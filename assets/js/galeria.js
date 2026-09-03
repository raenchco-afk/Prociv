/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV · Galería del proyecto
   ───────────────────────────────────────────────────────────────────────────
   Diez renders con su pie: qué se está viendo y desde dónde. Las miniaturas se
   generan aquí para no repetir diez bloques de marcado idénticos en el HTML.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const IMAGENES = [
    { f: 'fachada-principal.jpg', pie: 'Fachada principal · ladrillo a la vista y ventanales', alt: 'Fachada principal de CityLive101' },
    { f: 'fachada-esquina.jpg',   pie: 'Esquina sobre la Calle 101 · acceso peatonal',          alt: 'Esquina del edificio' },
    { f: 'fachada-aerea.jpg',     pie: 'Vista aérea · implantación en Santa Rosa Morato',       alt: 'Vista aérea del proyecto' },
    { f: 'fachada-lateral.jpg',   pie: 'Costado · balcones y ritmo de vanos',                   alt: 'Fachada lateral' },
    { f: 'terraza-bbq.jpg',       pie: 'Cubierta · terraza BBQ y zona social',                  alt: 'Terraza BBQ en cubierta' },
    { f: 'unique-mezzanine.jpg',  pie: 'Apartaestudio Unique · mezzanine',                      alt: 'Mezzanine de apartaestudio Unique' },
    { f: 'unique-escalera.jpg',   pie: 'Unique · escalera al mezzanine',                        alt: 'Escalera interior' },
    { f: 'unique-cocina.jpg',     pie: 'Unique · cocina integrada',                             alt: 'Cocina del apartaestudio' },
    { f: 'duo-sala.jpg',          pie: 'Apartaestudio Duo · sala y comedor',                    alt: 'Sala de apartaestudio Duo' },
    { f: 'duo-social.jpg',        pie: 'Duo · zona social con doble altura',                    alt: 'Zona social del Duo' }
  ];

  function iniciar() {
    const img   = document.getElementById('galeriaImg');
    const pie   = document.getElementById('galeriaPie');
    const tiras = document.getElementById('galeriaTiras');
    if (!img || !tiras) return;

    let actual = 0;

    IMAGENES.forEach((im, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', im.alt);
      b.className = 'galeria-min shrink-0 w-14 h-10 sm:w-16 sm:h-11 rounded-md overflow-hidden border border-white/25';
      b.innerHTML = `<img src="assets/img/citylive/${im.f}" alt="" loading="lazy" class="w-full h-full object-cover">`;
      b.addEventListener('click', () => mostrar(i));
      b.addEventListener('mouseenter', () => mostrar(i));
      tiras.appendChild(b);
    });

    const botones = Array.prototype.slice.call(tiras.children);

    function mostrar(i) {
      if (i === actual) return;
      actual = i;
      const im = IMAGENES[i];
      // Cambio con desvanecido: el salto seco entre renders se nota mucho.
      img.style.opacity = '0';
      const previa = new Image();
      previa.onload = function () {
        img.src = previa.src;
        img.alt = im.alt;
        img.style.opacity = '1';
      };
      previa.src = 'assets/img/citylive/' + im.f;
      pie.textContent = im.pie;
      botones.forEach((b, j) => {
        b.classList.toggle('is-activa', j === i);
        b.setAttribute('aria-selected', String(j === i));
      });
    }

    botones[0].classList.add('is-activa');
    botones[0].setAttribute('aria-selected', 'true');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
