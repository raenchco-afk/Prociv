/* ═══════════════════════════════════════════════════════════════════════════
   PROCIV URBAN GROUP — JavaScript del sitio (vanilla, sin dependencias)
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Configuración editable ────────────────────────────────────────────────
     FORM_ENDPOINT: URL que recibe el formulario por POST (JSON).
       - Déjalo en '' y el formulario abrirá el correo del visitante (mailto).
       - O apúntalo a tu backend, p. ej. 'https://api.tudominio.com/api/leads'.
     FORM_EMAIL: destino del mailto cuando no hay endpoint.
     ───────────────────────────────────────────────────────────────────────── */
  var FORM_ENDPOINT = '';
  var FORM_EMAIL = 'contacto@prociv.co';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════ Titular animado carácter por carácter ═══════════════
     Cada carácter arranca en opacity 0 + translateX(-18px) y entra con un
     retardo escalonado: (línea × largoLínea × 30ms) + (índice × 30ms),
     tras un retardo inicial de 200ms. Cada transición dura 500ms.          */
  function buildAnimatedHeading(el) {
    var text = el.getAttribute('data-animated-heading') || '';
    var lines = text.split('\n');
    var CHAR_DELAY = 30;
    var INITIAL_DELAY = 200;

    lines.forEach(function (line, lineIndex) {
      var lineEl = document.createElement('span');
      lineEl.className = 'ah-line';
      var lineOffset = lineIndex * line.length * CHAR_DELAY;
      var charIndex = 0;

      function makeChar(char) {
        var span = document.createElement('span');
        span.className = 'ah-char';
        span.textContent = char;
        span.style.transitionDelay = (lineOffset + charIndex * CHAR_DELAY) + 'ms';
        charIndex++;
        return span;
      }

      // Las palabras se agrupan en un contenedor `nowrap` para que la línea
      // nunca se corte a mitad de palabra; el salto solo ocurre en los espacios.
      line.split(' ').forEach(function (word, wordIndex) {
        if (wordIndex > 0) {
          var space = makeChar(' ');
          space.classList.add('ah-space');
          lineEl.appendChild(space);
        }
        var wordEl = document.createElement('span');
        wordEl.className = 'ah-word';
        word.split('').forEach(function (char) { wordEl.appendChild(makeChar(char)); });
        lineEl.appendChild(wordEl);
      });

      el.appendChild(lineEl);
    });

    if (reduceMotion) { el.classList.add('is-animated'); return; }
    window.setTimeout(function () { el.classList.add('is-animated'); }, INITIAL_DELAY);
  }

  document.querySelectorAll('[data-animated-heading]').forEach(buildAnimatedHeading);

  /* ═══════════════ FadeIn por retardo (subtítulo, botones, tag) ═══════════════ */
  document.querySelectorAll('[data-fade-in]').forEach(function (el) {
    var delay = parseInt(el.getAttribute('data-fade-in'), 10) || 0;
    if (reduceMotion) { el.classList.add('is-visible'); return; }
    window.setTimeout(function () { el.classList.add('is-visible'); }, delay);
  });

  /* ═══════════════ Reveal al hacer scroll ═══════════════ */
  var revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 90 + 'ms';
      observer.observe(el);
    });
  }

  /* ═══════════════ Menú móvil ═══════════════ */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    links.addEventListener('click', function (e) {
      if (e.target.tagName !== 'A') return;
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ═══════════════ Autoplay del video (iOS/Safari a veces lo bloquea) ═══════════════ */
  var video = document.querySelector('.hero__video');
  if (video) {
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () { /* el póster queda visible */ }); }
    };
    tryPlay();
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tryPlay();
    });
    ['touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, tryPlay, { once: true, passive: true });
    });
  }

  /* ═══════════════ Formulario de contacto ═══════════════ */
  var form = document.getElementById('leadForm');
  var status = document.getElementById('formStatus');

  function setStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form__status ' + (ok ? 'is-ok' : 'is-err');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        nombre:   form.nombre.value.trim(),
        email:    form.email.value.trim(),
        telefono: form.telefono.value.trim(),
        interes:  form.interes.value
      };

      var invalid = null;
      ['nombre', 'email', 'telefono', 'interes'].forEach(function (key) {
        var field = form[key];
        var bad = !data[key] || (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email));
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !invalid) invalid = field;
      });

      if (invalid) {
        setStatus('Revisa los campos marcados antes de enviar.', false);
        invalid.focus();
        return;
      }

      // Sin endpoint configurado → abrir el cliente de correo del visitante.
      if (!FORM_ENDPOINT) {
        var subject = 'Solicitud de dossier — ' + data.nombre;
        var body =
          'Nombre: ' + data.nombre + '\n' +
          'Correo: ' + data.email + '\n' +
          'WhatsApp: ' + data.telefono + '\n' +
          'Me interesa: ' + data.interes + '\n';
        window.location.href = 'mailto:' + FORM_EMAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        setStatus('Abrimos tu correo para completar el envío. Gracias.', true);
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      setStatus('Enviando…', true);

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          setStatus('Recibimos tus datos. Un consultor te escribirá muy pronto.', true);
        })
        .catch(function () {
          setStatus('No pudimos enviar el formulario. Escríbenos a ' + FORM_EMAIL + '.', false);
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  /* ═══════════════ Año del footer ═══════════════ */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
