/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV · Modelo BIM del edificio que se construye con el scroll
   ───────────────────────────────────────────────────────────────────────────
   Dibuja en canvas 2D un modelo tridimensional en líneas —lenguaje de plano
   BIM— que se levanta por fases a medida que el visitante baja: lote,
   cimentación, estructura nivel a nivel, envolvente y cubierta.

   Por qué canvas y proyección propia en vez de una librería 3D: el sitio no
   carga una sola dependencia externa, y traer Three.js por un wireframe serían
   ~600 KB para dibujar líneas. Esto ocupa lo que ves y da control exacto sobre
   el orden de montaje, que es justamente lo que cuenta la pieza.

   Unidades: metros. Eje Y hacia arriba. El origen está en el centro del lote.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const AZUL       = '#054BA6';
  const AZUL_CLARO = '#4C94E8';
  const BLANCO     = '#F8FAFC';
  const TENUE      = 'rgba(76, 148, 232, .28)';

  // ── Geometría del proyecto ────────────────────────────────────────────────
  const ANCHO = 12, FONDO = 18, ALTURA_PISO = 2.7, PISOS = 5;
  const EJES_X = [-6, -2, 2, 6];        // ejes estructurales (pórticos)
  const EJES_Z = [-9, -3, 3, 9];

  // ── Proyección en perspectiva ─────────────────────────────────────────────
  // Rotación en Y (giro), rotación en X (picado) y división por profundidad.
  // El orden importa: girar, alejar, inclinar, proyectar. La cámara apunta a
  // media altura del edificio, no al suelo, para que el encuadre no lo corte.
  function crearCamara(giro, distancia, picado, mira) {
    const cy = Math.cos(giro), sy = Math.sin(giro);
    const cp = Math.cos(picado), sp = Math.sin(picado);
    return function (p) {
      const x1 =  p.x * cy - p.z * sy;
      const z1 =  p.x * sy + p.z * cy + distancia;
      const y1 =  p.y - mira;
      const y2 =  y1 * cp - z1 * sp;
      const z2 =  y1 * sp + z1 * cp;
      const f  =  1 / Math.max(z2, 0.35);          // fuga real
      return { x: x1 * f, y: -y2 * f, z: z2 };
    };
  }

  // ── Utilidades de dibujo ──────────────────────────────────────────────────
  function crearLienzo(ctx, cam, cx, cy, escala) {
    function pt(p) { const q = cam(p); return { x: cx + q.x * escala, y: cy + q.y * escala, z: q.z }; }

    // Atenuación por profundidad. Sin esto, la cara trasera del edificio se
    // dibuja con la misma fuerza que la delantera y el modelo se lee como una
    // maraña; es lo que separa un wireframe de un plano. Lo cercano va nítido,
    // lo lejano se apaga y adelgaza.
    function velo(z) {
      const t = Math.min(1, Math.max(0, (z - 24) / 34));
      return { a: 1 - t * 0.72, w: 1 - t * 0.45 };
    }

    return {
      pt, ctx,
      linea(a, b, color, ancho, alfa, guion) {
        if (alfa <= 0.001) return;
        const A = pt(a), B = pt(b);
        const v = velo((A.z + B.z) / 2);
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
        const q = puntos.map(pt);
        const v = velo(q.reduce((s, p) => s + p.z, 0) / q.length);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alfa * v.a);
        ctx.beginPath();
        q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
        ctx.strokeStyle = color; ctx.lineWidth = ancho * v.w; ctx.stroke();
        ctx.restore();
      },
      texto(p, txt, color, alfa, tam, desvX, desvY) {
        if (alfa <= 0.001) return;
        const q = pt(p);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alfa);
        ctx.fillStyle = color;
        ctx.font = `500 ${tam}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillText(txt, q.x + (desvX || 0), q.y + (desvY || 0));
        ctx.restore();
      }
    };
  }

  // Progreso local de una fase: 0 antes de `desde`, 1 después de `hasta`.
  const tramo = (p, desde, hasta) => Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));
  const suave = t => t * t * (3 - 2 * t);

  // ── Las piezas del edificio, en orden de construcción ─────────────────────

  function lote(L, a) {
    // Retícula del terreno: la trama urbana sobre la que se implanta.
    for (let i = -18; i <= 18; i += 3) {
      const borde = Math.abs(i) > 12 ? 0.45 : 1;
      L.linea({ x: i, y: 0, z: -21 }, { x: i, y: 0, z: 21 }, TENUE, 1, a * 0.55 * borde);
      L.linea({ x: -21, y: 0, z: i }, { x: 21, y: 0, z: i }, TENUE, 1, a * 0.55 * borde);
    }
    // Linderos del lote
    const e = [
      { x: -ANCHO / 2, y: 0, z: -FONDO / 2 }, { x: ANCHO / 2, y: 0, z: -FONDO / 2 },
      { x: ANCHO / 2, y: 0, z: FONDO / 2 },  { x: -ANCHO / 2, y: 0, z: FONDO / 2 }
    ];
    L.poli(e, AZUL_CLARO, 1.6, a, 'rgba(5, 75, 166, .10)');
  }

  function cimentacion(L, a) {
    // Zapatas en cada intersección de ejes: el arranque del pórtico.
    EJES_X.forEach(x => EJES_Z.forEach(z => {
      const s = 0.7 * suave(a);
      L.poli([
        { x: x - s, y: 0, z: z - s }, { x: x + s, y: 0, z: z - s },
        { x: x + s, y: 0, z: z + s }, { x: x - s, y: 0, z: z + s }
      ], AZUL_CLARO, 1.2, a * 0.9);
      L.linea({ x, y: -1.2 * a, z }, { x, y: 0, z }, AZUL_CLARO, 1, a * 0.5, [3, 3]);
    }));
  }

  function nivel(L, n, a) {
    // Un nivel = columnas que suben + vigas que lo amarran + canto de losa.
    const base = n * ALTURA_PISO;
    const alto = base + ALTURA_PISO * suave(a);

    EJES_X.forEach(x => EJES_Z.forEach(z => {
      L.linea({ x, y: base, z }, { x, y: alto, z }, BLANCO, 1.5, a);
    }));

    if (a > 0.55) {                                   // las vigas cierran al final
      const av = tramo(a, 0.55, 1);
      EJES_Z.forEach(z => L.linea(
        { x: EJES_X[0], y: alto, z }, { x: EJES_X[EJES_X.length - 1], y: alto, z },
        AZUL_CLARO, 1.2, av));
      EJES_X.forEach(x => L.linea(
        { x, y: alto, z: EJES_Z[0] }, { x, y: alto, z: EJES_Z[EJES_Z.length - 1] },
        AZUL_CLARO, 1.2, av));

      const c = [
        { x: -ANCHO / 2, y: alto, z: -FONDO / 2 }, { x: ANCHO / 2, y: alto, z: -FONDO / 2 },
        { x: ANCHO / 2, y: alto, z: FONDO / 2 },  { x: -ANCHO / 2, y: alto, z: FONDO / 2 }
      ];
      L.poli(c, BLANCO, 1.1, av * 0.85, 'rgba(5, 75, 166, .26)');
    }
  }

  function envolvente(L, a) {
    // Primero, las dos caras que dan al espectador se rellenan casi opacas.
    // Sin esto se ve el interior entero a través de la fachada y el volumen
    // se lee hueco: es la diferencia entre un alambre y un edificio.
    const H = PISOS * ALTURA_PISO * Math.min(1, a * 1.15);
    if (a > 0.02) {
      L.poli([
        { x: -ANCHO / 2, y: 0, z: -FONDO / 2 }, { x: ANCHO / 2, y: 0, z: -FONDO / 2 },
        { x: ANCHO / 2, y: H, z: -FONDO / 2 },  { x: -ANCHO / 2, y: H, z: -FONDO / 2 }
      ], 'rgba(76,148,232,.35)', 1, a, 'rgba(3, 14, 32, .82)');
      L.poli([
        { x: ANCHO / 2, y: 0, z: -FONDO / 2 }, { x: ANCHO / 2, y: 0, z: FONDO / 2 },
        { x: ANCHO / 2, y: H, z: FONDO / 2 },  { x: ANCHO / 2, y: H, z: -FONDO / 2 }
      ], 'rgba(76,148,232,.35)', 1, a, 'rgba(4, 18, 40, .88)');
    }

    // Sobre ese cuerpo, los paños: llenos de ladrillo y vanos de ventana.
    for (let n = 0; n < PISOS; n++) {
      const an = tramo(a, n / PISOS * 0.7, n / PISOS * 0.7 + 0.3);
      if (an <= 0) continue;
      const y0 = n * ALTURA_PISO + 0.15, y1 = (n + 1) * ALTURA_PISO - 0.15;
      for (let i = 0; i < EJES_X.length - 1; i++) {
        const x0 = EJES_X[i] + 0.35, x1 = EJES_X[i + 1] - 0.35, z = -FONDO / 2;
        L.poli([{ x: x0, y: y0, z }, { x: x1, y: y0, z }, { x: x1, y: y1, z }, { x: x0, y: y1, z }],
          AZUL_CLARO, 1, an * 0.85, 'rgba(76, 148, 232, .07)');
        L.linea({ x: x0, y: (y0 + y1) / 2, z }, { x: x1, y: (y0 + y1) / 2, z }, AZUL_CLARO, 0.8, an * 0.4);
      }
      for (let i = 0; i < EJES_Z.length - 1; i++) {
        const z0 = EJES_Z[i] + 0.35, z1 = EJES_Z[i + 1] - 0.35, x = ANCHO / 2;
        L.poli([{ x, y: y0, z: z0 }, { x, y: y0, z: z1 }, { x, y: y1, z: z1 }, { x, y: y1, z: z0 }],
          AZUL_CLARO, 1, an * 0.85, 'rgba(76, 148, 232, .07)');
      }
    }
  }

  function cubierta(L, a) {
    const y = PISOS * ALTURA_PISO;
    // Antepecho
    const p = [
      { x: -ANCHO / 2, y: y + 1.1 * suave(a), z: -FONDO / 2 }, { x: ANCHO / 2, y: y + 1.1 * suave(a), z: -FONDO / 2 },
      { x: ANCHO / 2, y: y + 1.1 * suave(a), z: FONDO / 2 },  { x: -ANCHO / 2, y: y + 1.1 * suave(a), z: FONDO / 2 }
    ];
    L.poli(p, BLANCO, 1.4, a);
    [[-ANCHO / 2, -FONDO / 2], [ANCHO / 2, -FONDO / 2], [ANCHO / 2, FONDO / 2], [-ANCHO / 2, FONDO / 2]]
      .forEach(([x, z]) => L.linea({ x, y, z }, { x, y: y + 1.1 * suave(a), z }, BLANCO, 1.2, a));
    // Vegetación en cubierta: la firma de CityLive101
    for (let i = 0; i < 7; i++) {
      const t = tramo(a, 0.4 + i * 0.06, 0.75 + i * 0.06);
      if (t <= 0) continue;
      const x = -4.5 + i * 1.5;
      L.linea({ x, y, z: -2 }, { x, y: y + 0.9 * t, z: -2 }, AZUL_CLARO, 2.4, t * 0.75);
    }
  }

  function anotaciones(L, ctx, p, izq, der) {
    // Las cotas se colocan FUERA de la silueta, usando el borde izquierdo real
    // del volumen proyectado. Anclarlas a una coordenada del mundo las hacía
    // caer encima de la fachada en cuanto la cámara giraba.
    for (let n = 0; n <= PISOS; n++) {
      const a = tramo(p, 0.30 + n * 0.055, 0.42 + n * 0.055);
      if (a <= 0) continue;
      const y = n * ALTURA_PISO;
      const ancla = L.pt({ x: -ANCHO / 2, y, z: -FONDO / 2 });
      const x0 = izq - 78, x1 = ancla.x - 6;
      if (x1 <= x0) continue;
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = AZUL_CLARO; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x0 + 54, ancla.y); ctx.lineTo(x1, ancla.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x1, ancla.y - 3); ctx.lineTo(x1, ancla.y + 3); ctx.stroke();
      ctx.fillStyle = AZUL_CLARO;
      ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`N+${y.toFixed(2)}`, x0, ancla.y + 4);
      ctx.restore();
    }

    // Cota total de altura, a la derecha del volumen.
    const ah = tramo(p, 0.62, 0.72);
    if (ah > 0) {
      const base = L.pt({ x: ANCHO / 2, y: 0, z: -FONDO / 2 });
      const tope = L.pt({ x: ANCHO / 2, y: PISOS * ALTURA_PISO, z: -FONDO / 2 });
      const x = der + 42;
      ctx.save();
      ctx.globalAlpha = ah * 0.8;
      ctx.strokeStyle = BLANCO; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, base.y); ctx.lineTo(x, tope.y); ctx.stroke();
      [base.y, tope.y].forEach(yy => {
        ctx.beginPath(); ctx.moveTo(x - 4, yy); ctx.lineTo(x + 4, yy); ctx.stroke();
      });
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(tope.x, tope.y); ctx.lineTo(x, tope.y); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = ah;
      ctx.fillStyle = BLANCO;
      ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`${(PISOS * ALTURA_PISO).toFixed(2)} m`, x + 9, (base.y + tope.y) / 2 + 4);
      ctx.restore();
    }
  }

  // Escala gráfica y norte: los dos signos que convierten un dibujo en un
  // documento técnico. Van sobre el terreno, no flotando en pantalla, así que
  // giran con el modelo.
  function escalaYNorte(L, a) {
    if (a <= 0) return;
    const z = -FONDO / 2 - 7, y = 0;
    for (let i = 0; i <= 4; i++) {
      const x = -8 + i * 4;
      L.linea({ x, y, z }, { x, y: 0.55, z }, AZUL_CLARO, 1, a * 0.8);
    }
    L.linea({ x: -8, y, z }, { x: 8, y, z }, AZUL_CLARO, 1.2, a * 0.8);
    L.texto({ x: 8, y, z }, '16 m', AZUL_CLARO, a, 10, 8, 4);

    const nx = -12.5, nz = -FONDO / 2 - 5;
    L.linea({ x: nx, y: 0, z: nz - 2 }, { x: nx, y: 0, z: nz + 2 }, BLANCO, 1.2, a * 0.75);
    L.linea({ x: nx - 0.8, y: 0, z: nz + 0.6 }, { x: nx, y: 0, z: nz + 2 }, BLANCO, 1.2, a * 0.75);
    L.linea({ x: nx + 0.8, y: 0, z: nz + 0.6 }, { x: nx, y: 0, z: nz + 2 }, BLANCO, 1.2, a * 0.75);
    L.texto({ x: nx, y: 0, z: nz + 2 }, 'N', BLANCO, a * 0.9, 11, -4, 16);
  }

  // Llamados de elemento con línea guía: nombran lo que se está montando en
  // ese punto de la obra.
  const LLAMADOS = [
    { desde: 0.16, hasta: 0.34, p: { x: -6, y: 0.2, z: -9 },  txt: 'Zapata aislada · eje A-1' },
    { desde: 0.34, hasta: 0.66, p: { x: -6, y: 5.4, z: -9 },  txt: 'Pórtico en concreto · ejes cada 4,00 m' },
    { desde: 0.66, hasta: 0.88, p: { x: 0, y: 8.1, z: -9 },   txt: 'Fachada en ladrillo a la vista' },
    { desde: 0.88, hasta: 1.01, p: { x: -3, y: 14.6, z: -6 }, txt: 'Cubierta ajardinada · terraza BBQ' }
  ];

  function llamados(L, p) {
    LLAMADOS.forEach(ll => {
      const t = Math.min(tramo(p, ll.desde, ll.desde + 0.05), 1 - tramo(p, ll.hasta - 0.04, ll.hasta));
      if (t <= 0.01) return;
      const q = L.pt(ll.p);
      const ctx2 = L.ctx;
      ctx2.save();
      ctx2.globalAlpha = t;
      ctx2.strokeStyle = AZUL_CLARO; ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.arc(q.x, q.y, 3, 0, Math.PI * 2); ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(q.x + 3, q.y); ctx2.lineTo(q.x + 34, q.y - 22); ctx2.lineTo(q.x + 150, q.y - 22);
      ctx2.stroke();
      ctx2.fillStyle = BLANCO;
      ctx2.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx2.fillText(ll.txt, q.x + 38, q.y - 27);
      ctx2.restore();
    });
  }

  // Rótulos de fase con línea guía, en 2D sobre el lienzo.
  const FASES = [
    { hasta: 0.14, clave: 'LOTE',        txt: 'Implantación · 216 m² de lote' },
    { hasta: 0.30, clave: 'CIMENTACIÓN', txt: 'Zapatas sobre ejes estructurales' },
    { hasta: 0.66, clave: 'ESTRUCTURA',  txt: 'Pórticos y losas · 5 niveles' },
    { hasta: 0.86, clave: 'ENVOLVENTE',  txt: 'Fachada en ladrillo y ventanales' },
    { hasta: 1.01, clave: 'CUBIERTA',    txt: 'Terraza y cubierta ajardinada' }
  ];

  function faseDe(p) { return FASES.find(f => p < f.hasta) || FASES[FASES.length - 1]; }

  // ── Motor ─────────────────────────────────────────────────────────────────
  function iniciar() {
    const canvas = document.getElementById('bimCanvas');
    const escenario = document.getElementById('bimStage');
    const rotClave = document.getElementById('bimFase');
    const rotTexto = document.getElementById('bimFaseTexto');
    const barra = document.getElementById('bimBarra');
    if (!canvas || !escenario) return;

    const ctx = canvas.getContext('2d');
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ancho = 0, alto = 0, dpr = 1;

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      ancho = r.width; alto = r.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function dibujar(p) {
      ctx.clearRect(0, 0, ancho, alto);

      // La cámara gira y se acerca conforme sube el edificio, y sube la mirada
      // con él: el punto de vista acompaña a la obra en vez de quedarse quieto.
      const giro   = -0.70 + p * 0.85;
      // El picado arranca alto —casi una planta de implantación, que es como
      // se lee un lote— y baja a nivel de calle conforme el edificio sube.
      // Con un picado bajo desde el principio, el terreno se veía de canto.
      const picado = 1.15 - Math.min(p / 0.62, 1) * 0.93;
      const altoEdificio = PISOS * ALTURA_PISO;
      const mira   = 1.5 + p * altoEdificio * 0.42;   // apunta a media altura
      const dist   = 46 - p * 8;
      const cam = crearCamara(giro, dist, picado, mira);

      // Encuadre por caja envolvente: se proyectan las ocho esquinas del
      // volumen y se ajusta la escala a lo que realmente ocupan en pantalla.
      // Medir solo el eje central engaña —la esquina cercana proyecta mucho
      // más grande— y el edificio se salía por arriba.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      // La caja que se encuadra es la de lo CONSTRUIDO hasta ese momento, no la
      // del edificio terminado: si no, el lote arranca diminuto en una esquina
      // y la mitad del recorrido se ve vacío.
      const nivelesListos = Math.min(PISOS, Math.max(0, (p - 0.26) / 0.072 + 1));
      const alturaViva = Math.max(3.2, nivelesListos * ALTURA_PISO + (p > 0.8 ? 1.1 : 0));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [0, 1]) {
        const q = cam({ x: sx * ANCHO / 2, y: sy * alturaViva, z: sz * FONDO / 2 });
        if (q.x < minX) minX = q.x; if (q.x > maxX) maxX = q.x;
        if (q.y < minY) minY = q.y; if (q.y > maxY) maxY = q.y;
      }
      // Deja aire: 74 % del alto y 58 % del ancho, que el resto lo ocupan las
      // cotas de la izquierda y la línea de altura de la derecha.
      const escala = Math.min(
        (alto * 0.58) / Math.max(maxY - minY, 0.001),
        (ancho * 0.46) / Math.max(maxX - minX, 0.001)
      );
      // Desplazado a la derecha y hacia abajo: la franja superior izquierda es
      // del titular y la inferior del rótulo de fase. El modelo no los invade.
      const cxLienzo = ancho * 0.60 - ((minX + maxX) / 2) * escala;
      const cyLienzo = alto * 0.56 - ((minY + maxY) / 2) * escala;
      const L = crearLienzo(ctx, cam, cxLienzo, cyLienzo, escala);

      lote(L, tramo(p, 0.00, 0.10));
      cimentacion(L, tramo(p, 0.10, 0.26));
      for (let n = 0; n < PISOS; n++) {
        const a = tramo(p, 0.26 + n * 0.072, 0.26 + n * 0.072 + 0.10);
        if (a > 0) nivel(L, n, a);
      }
      envolvente(L, tramo(p, 0.62, 0.88));
      cubierta(L, tramo(p, 0.80, 1.00));
      anotaciones(L, ctx, p, cxLienzo + minX * escala, cxLienzo + maxX * escala);
      escalaYNorte(L, tramo(p, 0.04, 0.14));
      llamados(L, p);

      const f = faseDe(p);
      if (rotClave && rotClave.textContent !== f.clave) {
        rotClave.textContent = f.clave;
        rotTexto.textContent = f.txt;
      }
      if (barra) barra.style.transform = `scaleX(${p.toFixed(3)})`;
    }

    if (sinMovimiento) { medir(); dibujar(1); return; }

    let destino = 0, actual = 0;
    function progreso() {
      const r = escenario.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      if (recorrido <= 0) return 0;
      return Math.min(1, Math.max(0, -r.top / recorrido));
    }

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(e => { visible = e[0].isIntersecting; },
        { rootMargin: '120px' }).observe(escenario);
    }

    function bucle() {
      if (visible) {
        destino = progreso();
        actual += (destino - actual) * 0.12;
        if (Math.abs(destino - actual) < 0.0004) actual = destino;
        dibujar(actual);
      }
      requestAnimationFrame(bucle);
    }

    medir();
    // Un primer dibujo inmediato, antes del bucle: si se espera al primer
    // fotograma de animación, el lienzo queda en blanco ese instante — y en
    // navegadores que no disparan rAF (o con la pestaña en segundo plano al
    // cargar) se quedaría vacío del todo.
    actual = destino = progreso();
    dibujar(actual);

    window.addEventListener('resize', () => { medir(); dibujar(actual); }, { passive: true });
    requestAnimationFrame(bucle);

    // Punto de entrada para pruebas: dibuja un avance concreto.
    window.__bimDibujar = function (p) { medir(); dibujar(p); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
