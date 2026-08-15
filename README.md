# PROCIV Urban Group — sitio estático para SiteGround

Sitio listo para **subir y pegar**. No necesita Node, ni build, ni Vite: son
archivos HTML/CSS/JS planos que cualquier hosting compartido sirve tal cual.

---

## 1. Estructura de carpetas

Súbela **exactamente así** (respetando mayúsculas y nombres):

```
public_html/                  ← raíz de tu dominio en SiteGround
├── index.html
├── .htaccess                 ← archivo oculto: activa "Show hidden files"
├── robots.txt
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   └── main.js
    ├── img/
    │   └── favicon.svg
    └── video/                ← opcional (ver punto 4)
        └── hero.mp4
```

Si el sitio va en un subdirectorio (por ejemplo `tudominio.com/prociv`),
sube la misma estructura dentro de `public_html/prociv/`. Todas las rutas del
HTML son **relativas**, así que funciona igual sin tocar una sola línea.

---

## 2. Cómo subirlo (File Manager de SiteGround)

1. **Site Tools → Site → File Manager**.
2. Entra a `public_html`.
3. Comprime esta carpeta en un `.zip` desde tu computador
   (selecciona el *contenido*: `index.html`, `.htaccess`, `assets/`, `robots.txt` — no la carpeta padre).
4. En File Manager: **Upload → File**, sube el `.zip`.
5. Clic derecho sobre el `.zip` → **Extract** → confirma en `public_html`.
6. Borra el `.zip`.
7. Activa el icono de **Settings → Show hidden files** para confirmar que
   `.htaccess` quedó arriba. Si no lo ves, súbelo aparte.

### Alternativa por FTP
Host: tu dominio · Usuario y contraseña: **Site Tools → Devs → FTP Accounts** ·
Puerto 21. Arrastra el contenido a `public_html`.

### Alternativa por SSH
```bash
scp -r sitio-prociv/* usuario@tuservidor:~/public_html/
scp sitio-prociv/.htaccess usuario@tuservidor:~/public_html/
```

---

## 3. Después de subir

- Entra a `https://tudominio.com` — debe verse el hero con el video.
- Si el CSS no carga: verifica que la ruta sea `assets/css/styles.css` y no
  `Assets/CSS/…` (Linux distingue mayúsculas).
- **Site Tools → Speed → Caching**: si tienes Dynamic Cache activo, haz
  **Flush Cache** después de cada actualización.
- SSL: **Site Tools → Security → SSL Manager** → instala Let's Encrypt y activa
  **HTTPS Enforce** (el `.htaccess` ya redirige, pero es mejor tener las dos).

---

## 4. El video del hero

Por defecto el video se carga desde el CDN indicado en el brief
(CloudFront), así que **funciona sin subir nada**.

Para servirlo desde tu propio dominio (más control, sin depender de un CDN
ajeno):

1. Descarga el `.mp4` del brief.
2. Súbelo a `assets/video/hero.mp4`.
3. En `index.html`, dentro de `<video class="hero__video">`, deja el `source`
   local **primero**:

```html
<source src="assets/video/hero.mp4" type="video/mp4">
<source src="https://d8j0ntlcm91z4.cloudfront.net/…mp4" type="video/mp4">
```

Recomendación: comprime el video a **menos de 8 MB** (por ejemplo con HandBrake,
preset *Web → Gmail Large 3 Minutes 720p30*). Los planes compartidos de
SiteGround no son un CDN de video.

**Póster** (imagen mientras carga el video): sube un `assets/img/hero-poster.jpg`
y añade `poster="assets/img/hero-poster.jpg"` a la etiqueta `<video>`.

---

## 5. El formulario de contacto

Abre `assets/js/main.js`, primeras líneas:

```js
var FORM_ENDPOINT = '';                          // ← vacío = abre el correo del visitante
var FORM_EMAIL    = 'contacto@prociv.co'; // ← destino del mailto
```

- **Sin tocar nada:** al enviar, se abre el cliente de correo del visitante con
  los datos ya escritos. Cero configuración, funciona siempre.
- **Con backend propio:** pon la URL en `FORM_ENDPOINT` (por ejemplo el endpoint
  de leads del ERP). El formulario hará `POST` con JSON
  `{ nombre, email, telefono, interes }`. Recuerda habilitar CORS para tu dominio.
- **Con un servicio externo** (Formspree, Web3Forms…): pega su URL en
  `FORM_ENDPOINT`; casi todos aceptan JSON.

El footer ya incluye los datos de contacto de PROCIV: Calle 101 #70G-53,
Bogotá · WhatsApp y teléfono +57 324 650 8105 · contacto@prociv.co.

---

## 6. Qué editar para personalizar

| Quiero cambiar… | Archivo | Dónde |
|---|---|---|
| Textos, secciones, proyectos | `index.html` | están en orden, con comentarios `═══` por sección |
| Colores de marca | `assets/css/styles.css` | bloque `:root` (Obsidian, Concrete, Bone, Urban Sand, Signal, Sage) |
| Titular animado del hero | `index.html` | atributo `data-animated-heading` (el salto de línea real = línea nueva) |
| Velocidad de la animación | `assets/js/main.js` | `CHAR_DELAY` (30 ms) e `INITIAL_DELAY` (200 ms) |
| Retardos de entrada | `index.html` | `data-fade-in="800"` (subtítulo), `1200` (botones), `1400` (tag) |
| Correo, WhatsApp, dominio | `index.html` (footer) y `main.js` | — |
| Favicon | `assets/img/favicon.svg` | monograma geométrico PROGRESO + CIUDAD + VALOR |

---

## 7. Detalles fieles al brief del hero

- Video de fondo a pantalla completa (`object-fit: cover`), autoplay, loop,
  muted, playsinline, **sin overlay, sin degradado y sin capa semitransparente**
  encima. El video se ve crudo.
- Tipografía **Inter** (300/400/500/600) cargada desde Google Fonts, con
  `-webkit-font-smoothing: antialiased` y `-moz-osx-font-smoothing: grayscale`.
- Navbar con `.liquid-glass`, esquinas `rounded-xl`, logo a la izquierda, enlaces
  al centro (ocultos en móvil) y botón blanco *hablemos* a la derecha.
- Contenido del hero anclado al fondo del viewport; en pantallas grandes, dos
  columnas: contenido a la izquierda y tarjeta de vidrio
  **LA EVOLUCIÓN DEL HÁBITAT URBANO** abajo a la derecha.
- Titular con entrada **carácter por carácter**: cada uno arranca en
  `opacity: 0` + `translateX(-18px)`, con retardo
  `(línea × largoLínea × 30ms) + (índice × 30ms)`, transición de 500 ms y
  200 ms de retardo inicial.
- Paleta: negro, blanco, gris para texto secundario, bordes `white/20`.
  Nada de morado ni índigo.
- Respeta `prefers-reduced-motion`: si el visitante pidió menos animación, todo
  aparece de una vez.

---

## 8. Prueba local antes de subir

```bash
cd sitio-prociv
python3 -m http.server 8080
# abre http://localhost:8080
```

(Abrir el `index.html` con doble clic también funciona; solo el `.htaccess` no
aplica fuera del servidor.)
