/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV · Corte interactivo del edificio por amenidades
   ───────────────────────────────────────────────────────────────────────────
   Cada amenidad ocupa un nivel real del proyecto. Al elegirla en la lista, el
   modelo ilumina ESE nivel y apaga los demás, y el edificio gira despacio para
   que se entienda dónde está. No es una ilustración: es la misma geometría del
   modelo BIM, cortada por plantas.

   Un listado de amenidades no dice dónde están. Esto sí.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const { crearCamara, crearLienzo, encuadrar, medirLienzo, suave } = window.Prociv3D || {};
  if (!crearCamara) return;

  const AZUL       = '#054BA6';
  const AZUL_CLARO = '#4C94E8';
  const BLANCO     = '#F8FAFC';

  const ANCHO = 12, FONDO = 18, ALTURA_PISO = 2.7, PISOS = 6;   // 5 + cubierta

  function iniciar() {
    const canvas = document.getElementById('amenCanvas');
    const lista  = document.getElementById('amenLista');
    if (!canvas || !lista) return;

    const ctx = canvas.getContext('2d');
    const opciones = Array.prototype.slice.call(lista.querySelectorAll('[data-nivel]'));
    if (!opciones.length) return;

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let activo = parseInt(opciones[0].getAttribute('data-nivel'), 10);
    let activoSuave = activo;          // el resaltado viaja entre niveles
    let giro = -0.5, giroDestino = -0.5;
    let ancho = 0, alto = 0;

    function medir() { const m = medirLienzo(canvas, ctx); ancho = m.ancho; alto = m.alto; }

    function dibujar() {
      ctx.clearRect(0, 0, ancho, alto);

      const cam = crearCamara(giro, 44, 0.30, PISOS * ALTURA_PISO * 0.45);
      const enc = encuadrar(cam, { ancho: ANCHO, fondo: FONDO, alto: PISOS * ALTURA_PISO },
                            ancho, alto, { aireAlto: 0.74, aireAncho: 0.66, centroY: 0.46 });
      const L = crearLienzo(ctx, cam, enc.cx, enc.cy, enc.escala, { cerca: 26, lejos: 56 });

      // Terreno: una retícula corta que asienta el volumen.
      for (let i = -12; i <= 12; i += 4) {
        L.linea({ x: i, y: 0, z: -14 }, { x: i, y: 0, z: 14 }, 'rgba(76,148,232,.16)', 1, 1);
        L.linea({ x: -12, y: 0, z: i }, { x: 12, y: 0, z: i }, 'rgba(76,148,232,.16)', 1, 1);
      }

      for (let n = 0; n < PISOS; n++) {
        const y0 = n * ALTURA_PISO, y1 = y0 + ALTURA_PISO;
        const cerca = Math.max(0, 1 - Math.abs(n - activoSuave));   // 1 en el nivel activo
        const encendido = suave(cerca);

        const esquinas = y => ([
          { x: -ANCHO / 2, y, z: -FONDO / 2 }, { x: ANCHO / 2, y, z: -FONDO / 2 },
          { x: ANCHO / 2, y, z: FONDO / 2 },  { x: -ANCHO / 2, y, z: FONDO / 2 }
        ]);

        // Planta: se rellena con fuerza solo la del nivel activo.
        // El volumen completo se lee siempre; el nivel activo se enciende
        // sobre esa base. Con el resto casi invisible no se entendía dónde
        // estaba la amenidad dentro del edificio.
        L.poli(esquinas(y0), encendido > 0.5 ? BLANCO : AZUL_CLARO,
               0.9 + encendido * 0.9,
               0.42 + encendido * 0.58,
               `rgba(5, 75, 166, ${0.10 + encendido * 0.40})`);

        // Aristas verticales del nivel.
        [[-ANCHO / 2, -FONDO / 2], [ANCHO / 2, -FONDO / 2], [ANCHO / 2, FONDO / 2], [-ANCHO / 2, FONDO / 2]]
          .forEach(([x, z]) => L.linea({ x, y: y0, z }, { x, y: y1, z },
            encendido > 0.5 ? BLANCO : AZUL_CLARO, 0.9 + encendido, 0.40 + encendido * 0.60));

        // El nivel activo se “abre”: se marcan sus ejes interiores, como una
        // planta arquitectónica vista en corte.
        if (encendido > 0.15) {
          const a = (encendido - 0.15) / 0.85;
          for (const x of [-2, 2]) L.linea({ x, y: y0, z: -FONDO / 2 }, { x, y: y0, z: FONDO / 2 }, AZUL_CLARO, 1, a * 0.5, [4, 4]);
          for (const z of [-3, 3]) L.linea({ x: -ANCHO / 2, y: y0, z }, { x: ANCHO / 2, y: y0, z }, AZUL_CLARO, 1, a * 0.5, [4, 4]);
        }
      }

      // Coronación del volumen.
      const yTope = PISOS * ALTURA_PISO;
      L.poli([
        { x: -ANCHO / 2, y: yTope, z: -FONDO / 2 }, { x: ANCHO / 2, y: yTope, z: -FONDO / 2 },
        { x: ANCHO / 2, y: yTope, z: FONDO / 2 },  { x: -ANCHO / 2, y: yTope, z: FONDO / 2 }
      ], AZUL_CLARO, 1, 0.5);

      // Cota del nivel activo, fuera de la silueta.
      const n = Math.round(activoSuave);
      const anc = L.pt({ x: -ANCHO / 2, y: n * ALTURA_PISO, z: -FONDO / 2 });
      const x0 = enc.cx + enc.minX * enc.escala - 66;
      if (anc.x - 8 > x0 + 40) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = AZUL_CLARO; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(x0 + 40, anc.y); ctx.lineTo(anc.x - 8, anc.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = AZUL_CLARO;
        ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`N+${(n * ALTURA_PISO).toFixed(2)}`, x0 - 14, anc.y + 4);
        ctx.restore();
      }
    }

    function seleccionar(nivel, el) {
      activo = nivel;
      // Cada nivel se mira desde un ángulo distinto: el giro refuerza que el
      // modelo respondió al clic.
      giroDestino = -0.85 + (nivel / (PISOS - 1)) * 0.9;
      opciones.forEach(o => {
        const on = o === el;
        o.setAttribute('aria-selected', String(on));
        o.classList.toggle('is-activa', on);
      });
      const panel = document.getElementById('amenDetalle');
      if (panel && el) {
        panel.querySelector('[data-campo="titulo"]').textContent = el.getAttribute('data-titulo');
        panel.querySelector('[data-campo="texto"]').textContent  = el.getAttribute('data-texto');
        panel.querySelector('[data-campo="dato"]').textContent   = el.getAttribute('data-dato');
        panel.querySelector('[data-campo="nivel"]').textContent  = el.getAttribute('data-rotulo');
      }
    }

    opciones.forEach(o => {
      const nivel = parseInt(o.getAttribute('data-nivel'), 10);
      o.addEventListener('click', () => seleccionar(nivel, o));
      o.addEventListener('mouseenter', () => seleccionar(nivel, o));
      o.addEventListener('focus', () => seleccionar(nivel, o));
      o.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleccionar(nivel, o); }
      });
    });

    medir();
    seleccionar(parseInt(opciones[0].getAttribute('data-nivel'), 10), opciones[0]);
    dibujar();

    window.addEventListener('resize', () => { medir(); dibujar(); }, { passive: true });

    if (sinMovimiento) return;          // sin animación: queda el estado elegido

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { rootMargin: '100px' })
        .observe(canvas);
    }
    function bucle() {
      if (visible) {
        activoSuave += (activo - activoSuave) * 0.14;
        giro += (giroDestino - giro) * 0.06;
        dibujar();
      }
      requestAnimationFrame(bucle);
    }
    requestAnimationFrame(bucle);

    // Punto de entrada para pruebas.
    window.__amenDibujar = function (nivel) {
      const el = opciones.find(o => +o.getAttribute('data-nivel') === nivel) || opciones[0];
      seleccionar(nivel, el);
      activoSuave = nivel; giro = giroDestino;
      medir(); dibujar();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
