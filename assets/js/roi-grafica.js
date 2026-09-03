/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV · Gráfica del simulador de inversión
   ───────────────────────────────────────────────────────────────────────────
   El simulador daba tres cifras y ya. Tres cifras no dejan ver la forma de la
   inversión: cuándo el arriendo empieza a pesar más que la valorización, o qué
   tan rápido se separa de lo aportado. Esto lo dibuja.

   Dos series apiladas sobre el capital aportado: valorización del inmueble y
   renta acumulada. Ejes en años y en pesos, con la línea del capital como
   referencia — todo lo que está por encima es ganancia.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const AZUL       = '#054BA6';
  const AZUL_CLARO = '#4C94E8';
  const BLANCO     = '#F8FAFC';
  const TENUE      = 'rgba(148, 163, 184, .55)';

  function pesosCortos(v) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1).replace('.', ',') + ' mil M';
    if (v >= 1e6) return '$' + Math.round(v / 1e6) + ' M';
    return '$' + Math.round(v);
  }

  function iniciar() {
    const canvas = document.getElementById('roiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let ancho = 0, alto = 0;

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      ancho = r.width; alto = r.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Recibe los mismos parámetros que el simulador y dibuja el recorrido
    // año a año. La curva es la misma fórmula: no hay dos verdades.
    function dibujar(capital, anios, multiplicador) {
      if (!ancho) medir();
      ctx.clearRect(0, 0, ancho, alto);

      const izq = 62, der = 14, arriba = 18, abajo = 30;
      const w = ancho - izq - der, h = alto - arriba - abajo;
      if (w <= 10 || h <= 10) return;

      const tasa = 0.084, rentaMes = capital * 0.006 * multiplicador;
      const serie = [];
      for (let a = 0; a <= anios; a++) {
        const valorizacion = capital * Math.pow(1 + tasa, a) - capital;
        const renta = rentaMes * 12 * a;
        serie.push({ a, valorizacion, renta, total: capital + valorizacion + renta });
      }
      const techo = serie[serie.length - 1].total * 1.06;
      const x = a => izq + (a / Math.max(anios, 1)) * w;
      const y = v => arriba + h - (v / techo) * h;

      // Retícula y escala de pesos
      ctx.save();
      ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const v = (techo / 4) * i, yy = y(v);
        ctx.strokeStyle = 'rgba(76,148,232,.13)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(izq, yy); ctx.lineTo(izq + w, yy); ctx.stroke();
        ctx.fillStyle = TENUE;
        ctx.textAlign = 'right';
        ctx.fillText(pesosCortos(v), izq - 10, yy);
      }
      // Años
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const paso = anios > 6 ? 2 : 1;
      for (let a = 0; a <= anios; a += paso) {
        ctx.fillStyle = TENUE;
        ctx.fillText(a === 0 ? 'hoy' : 'año ' + a, x(a), arriba + h + 10);
      }
      ctx.restore();

      // Áreas apiladas: capital, valorización y renta
      function area(valorDe, color) {
        ctx.beginPath();
        ctx.moveTo(x(0), y(0));
        serie.forEach(p => ctx.lineTo(x(p.a), y(valorDe(p))));
        ctx.lineTo(x(anios), y(0));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
      area(p => p.total, 'rgba(76,148,232,.16)');
      area(p => capital + p.valorizacion, 'rgba(5,75,166,.42)');
      area(() => capital, 'rgba(5,75,166,.75)');

      // Línea del capital aportado: el umbral a superar
      ctx.save();
      ctx.strokeStyle = 'rgba(248,250,252,.45)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(izq, y(capital)); ctx.lineTo(izq + w, y(capital)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = 'rgba(248,250,252,.72)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('capital aportado', izq + 6, y(capital) - 4);
      ctx.restore();

      // Trazo del total y punto final
      ctx.save();
      ctx.strokeStyle = AZUL_CLARO; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      serie.forEach((p, i) => (i ? ctx.lineTo(x(p.a), y(p.total)) : ctx.moveTo(x(p.a), y(p.total))));
      ctx.stroke();
      const fin = serie[serie.length - 1];
      ctx.fillStyle = BLANCO;
      ctx.beginPath(); ctx.arc(x(fin.a), y(fin.total), 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = AZUL; ctx.lineWidth = 2; ctx.stroke();

      // Etiqueta del valor final, dentro del lienzo
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      const txt = pesosCortos(fin.total);
      const anchoTxt = ctx.measureText(txt).width;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let tx = x(fin.a) + 10;
      if (tx + anchoTxt > ancho - 4) { ctx.textAlign = 'right'; tx = x(fin.a) - 10; }
      ctx.fillStyle = BLANCO;
      ctx.fillText(txt, tx, y(fin.total) - 12);
      ctx.restore();
    }

    medir();
    window.addEventListener('resize', () => { medir(); if (window.__roiUltimo) dibujar.apply(null, window.__roiUltimo); }, { passive: true });

    // El simulador llama aquí cada vez que se mueve un control.
    window.dibujarROI = function (capital, anios, multiplicador) {
      window.__roiUltimo = [capital, anios, multiplicador];
      dibujar(capital, anios, multiplicador);
    };
    if (window.__roiPendiente) window.dibujarROI.apply(null, window.__roiPendiente);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
