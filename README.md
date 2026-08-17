# PROCIV Urban Group — sitio estático para SiteGround

Archivos planos: HTML, CSS y JS. No necesita Node ni build para funcionar — solo
para **regenerar** el CSS si cambias clases (ver el último apartado).

---

## 1. Estructura

```
public_html/                       ← raíz de tu dominio
├── index.html                     Home
├── citylive101.html               Ficha del proyecto
├── .htaccess                      ARCHIVO OCULTO: activa "Show hidden files"
├── robots.txt
├── build-tailwind.config.js       solo para recompilar; no lo sirve el navegador
└── assets/
    ├── css/
    │   ├── tailwind.css           22 KB · compilado, sin CDN
    │   ├── citylive.css           estilos de la ficha de proyecto
    │   └── styles.css             hoja de la versión anterior (sin usar hoy)
    ├── js/
    │   ├── icons.js               10 iconos propios · 3 KB
    │   ├── gsap.min.js            animación del scrollytelling
    │   ├── ScrollTrigger.min.js
    │   ├── citylive.js
    │   └── main.js                script de la versión anterior (sin usar hoy)
    ├── img/
    │   ├── prociv-logo-navy.png
    │   ├── prociv-icono-blanco.png
    │   ├── favicon.png · favicon.svg
    │   └── citylive/              galería del proyecto
    └── video/
        └── hero.mp4               2,6 MB · el edificio creciendo entre nubes
```

Las rutas del HTML son **relativas**: la misma estructura funciona igual en la
raíz del dominio, en `public_html/prociv/` o en un subdominio.

---

## 2. Subirlo

1. **Site Tools → Site → File Manager** → entra a `public_html`.
2. Borra el `index.html` de la página "Under construction" si sigue ahí.
3. **Upload → File** → sube el ZIP → clic derecho → **Extract**.
4. **SiteGround crea una carpeta con el nombre del ZIP.** Entra, selecciona todo
   (con *Show hidden files* activado, para no dejar atrás el `.htaccess`),
   **Move** a la raíz y borra la carpeta vacía.
5. **Site Tools → Speed → Caching → Flush Cache.**

Comprobación:

```bash
curl -sS https://prociv.co | grep -i "<title>"
curl -sSo /dev/null -w "css: %{http_code}\n" https://prociv.co/assets/css/tailwind.css
```

---

## 3. El video del hero

Va **incluido** en `assets/video/hero.mp4` (720p, 10 s, 2,6 MB). El HTML lo
busca ahí primero y, como segunda opción, un `hero.mp4` en la raíz — así puedes
cambiarlo dejando el archivo al lado del `index.html`, sin tocar código.

El video se muestra **crudo**: sin opacidad reducida y sin degradado encima. Como
su cielo es claro (luminancia media de 103 a 160), el texto del hero se apoya en
una losa de vidrio (`.hero-slab`), no en una capa oscura sobre la imagen. Si algún
día lo cambias por un metraje más claro y el titular cuesta de leer, sube la
opacidad en esa única regla:

```css
.hero-slab { background: rgba(4, 18, 40, .62); }   /* ← sube a .72 y listo */
```

---

## 4. El formulario

El envío está en el `<script>` al final de `index.html`. Hoy muestra un mensaje de
confirmación en pantalla; para que los datos lleguen a algún sitio hay que
conectarlo a un endpoint (`fetch` con `POST`) o a un servicio tipo Formspree.

Contacto ya publicado en el footer: Calle 101 #70G-53, Bogotá · WhatsApp y
teléfono +57 324 650 8105 · contacto@prociv.co.

---

## 5. Dónde se edita cada cosa

| Quiero cambiar… | Archivo | Dónde |
|---|---|---|
| Textos y secciones | `index.html` | en orden, con comentarios `═══` por sección |
| Azul de marca | `index.html` (bloque `<style>`) y `build-tailwind.config.js` | `#054BA6` corporativo · `#4C94E8` sobre fondo oscuro · `#033571` hover |
| Fondos del sitio | `build-tailwind.config.js` | `night #020C1C` (general) · `dark #04142E` (secciones alternas) · `card #062146` · `black #01060F`. **Son azules, no grises**: el sitio entero se apoya en la familia del corporativo |
| Losa del hero | `index.html` | regla `.hero-slab` |
| Deriva del video | `index.html` | `.hero-drift` (26 s, escala 1 → 1,07) |
| Cinta "Hacemos ciudad" | `index.html` | bloque `2.bis`, y velocidad en `@keyframes ticker` |
| Método de 5 pasos | `index.html` | bloque `4.bis` |
| Galería del proyecto | `citylive101.html` + `assets/img/citylive/` | — |

**El azul vive en dos sitios**: el `<style>` embebido y el config de Tailwind. Si
cambias uno, cambia el otro y recompila.

---

## 6. Accesibilidad y rendimiento

- Todo local salvo Google Fonts: sin CDN de Tailwind (que compilaba en el
  navegador), sin unpkg, sin cdnjs.
- `prefers-reduced-motion` detiene la cinta, la deriva del video y las entradas.
- El contraste del hero se resolvió con la losa; el azul corporativo `#054BA6` no
  se usa como **texto** sobre negro (no llega al contraste mínimo): ahí va `#4C94E8`.

---

## 7. Prueba local

```bash
cd sitio-prociv
python3 -m http.server 8080
# abre http://localhost:8080
```

---

## 8. Recompilar el CSS (solo si tocas clases de Tailwind)

`assets/css/tailwind.css` está compilado y minificado. Las clases que no aparecen
en el marcado **no existen** en la hoja, así que hay que regenerarla al añadir
clases nuevas:

```bash
npm install -D tailwindcss@3.4.17
printf '@tailwind base;@tailwind components;@tailwind utilities;' > /tmp/in.css
npx tailwindcss -c build-tailwind.config.js -i /tmp/in.css -o assets/css/tailwind.css --minify
```

El config escanea `index.html` **incluido su JavaScript**, así que las clases que
el simulador y el scrollytelling generan en caliente (`border-l-brand-blue`,
`bg-brand-blue/20`…) entran solas. Verificado: las nueve están en la hoja.

### Qué se sirve desde dónde

| Recurso | Origen | Peso |
|---|---|---|
| Tailwind | `assets/css/tailwind.css` | 22 KB |
| GSAP + ScrollTrigger | local | 114 KB |
| Iconos | `assets/js/icons.js` — subconjunto propio | 3 KB (antes 352 KB con lucide completo) |
| Video del hero | `assets/video/hero.mp4` | 2,6 MB |
| Inter y Plus Jakarta Sans | Google Fonts | única dependencia externa |
