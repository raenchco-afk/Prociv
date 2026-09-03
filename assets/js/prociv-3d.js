/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV · Motor de proyección compartido
   ───────────────────────────────────────────────────────────────────────────
   Lo usan el modelo BIM del edificio y el corte de amenidades. Es proyección
   en perspectiva sobre canvas 2D: sin librerías 3D, unos pocos kilobytes, y
   control exacto sobre qué se dibuja y en qué orden.

   Unidades: metros. Eje Y hacia arriba. Origen en el centro del lote.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  // Rotación en Y (giro), rotación en X (picado) y división por profundidad.
  // El orden importa: girar, alejar, inclinar, proyectar. La cámara apunta a
  // `mira` —una altura, no el suelo— para que el encuadre no corte el objeto.
  function crearCamara(giro, distancia, picado, mira) {
    const cy = Math.cos(giro), sy = Math.sin(giro);
    const cp = Math.cos(picado), sp = Math.sin(picado);
    return function (p) {
      const x1 = p.x * cy - p.z * sy;
      const z1 = p.x * sy + p.z * cy + distancia;
      const y1 = p.y - mira;
      const y2 = y1 * cp - z1 * sp;
      const z2 = y1 * sp + z1 * cp;
      const f  = 1 / Math.max(z2, 0.35);
      return { x: x1 * f, y: -y2 * f, z: z2 };
    };
  }

  // Encuadre automático: proyecta las esquinas de una caja y devuelve la
  // escala y el centro que la dejan dentro del lienzo con el aire pedido.
  function encuadrar(cam, caja, ancho, alto, opciones) {
    const o = opciones || {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) {
      const q = cam({ x: sx * caja.ancho / 2, y: sy * caja.alto, z: sz * caja.fondo / 2 });
      if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
    }
    const escala = Math.min(
      (alto * (o.aireAlto || 0.58)) / Math.max(maxY - minY, 0.001),
      (ancho * (o.aireAncho || 0.46)) / Math.max(maxX - minX, 0.001)
    );
    return {
      escala,
      cx: ancho * (o.centroX || 0.5) - ((minX + maxX) / 2) * escala,
      cy: alto * (o.centroY || 0.5) - ((minY + maxY) / 2) * escala,
      minX, maxX, minY, maxY
    };
  }

  // Lienzo: convierte puntos del mundo a pantalla y dibuja con atenuación por
  // profundidad. Sin esa atenuación, la cara trasera compite con la delantera
  // y el modelo se lee como una maraña en vez de un plano.
  function crearLienzo(ctx, cam, cx, cy, escala, rango) {
    const cerca = (rango && rango.cerca) || 24;
    const lejos = (rango && rango.lejos) || 58;

    function pt(p) { const q = cam(p); return { x: cx + q.x * escala, y: cy + q.y * escala, z: q.z }; }
    function velo(z) {
      const t = Math.min(1, Math.max(0, (z - cerca) / (lejos - cerca)));
      return { a: 1 - t * 0.72, w: 1 - t * 0.45 };
    }

    return {
      ctx, pt, velo,
      linea(a, b, color, ancho, alfa, guion) {
        if (alfa <= 0.001) return;
        const A = pt(a), B = pt(b), v = velo((A.z + B.z) / 2);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alfa * v.a);
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho * v.w;
        ctx.lineCap = 'round';
        ctx.setLineDash(guion || []);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        ctx.restore();
      },
      poli(puntos, color, ancho, alfa, relleno) {
        if (alfa <= 0.001) return;
        const q = puntos.map(pt), v = velo(q.reduce((s, p) => s + p.z, 0) / q.length);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alfa * v.a);
        ctx.beginPath();
        q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
        if (ancho > 0) { ctx.strokeStyle = color; ctx.lineWidth = ancho * v.w; ctx.stroke(); }
        ctx.restore();
      },
      texto(p, txt, color, alfa, tam, dx, dy) {
        if (alfa <= 0.001) return;
        const q = pt(p);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alfa);
        ctx.fillStyle = color;
        ctx.font = `500 ${tam}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillText(txt, q.x + (dx || 0), q.y + (dy || 0));
        ctx.restore();
      }
    };
  }

  // Ajusta el lienzo a su tamaño real teniendo en cuenta la densidad de
  // pantalla; sin esto las líneas se ven borrosas en pantallas Retina.
  function medirLienzo(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ancho: r.width, alto: r.height };
  }

  const tramo = (p, desde, hasta) => Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));
  const suave = t => t * t * (3 - 2 * t);

  raiz.Prociv3D = { crearCamara, crearLienzo, encuadrar, medirLienzo, tramo, suave };
})(window);
