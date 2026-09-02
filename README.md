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
    │   ├── bim-building.js        modelo BIM del edificio · 17 KB, sin librerías
    │   ├── citylive.js
    │   └── main.js                script de la versión anterior (sin usar hoy)
    ├── img/
    │   ├── prociv-logo-navy.png
    │   ├── prociv-icono-blanco.png
    │   ├── favicon.png · favicon.svg
    │   └── citylive/              galería del proyecto
    └── video/
        ├── hero-scrub.mp4         2,0 MB · el que usa el sitio (keyframes densos)
        └── hero.mp4               2,6 MB · original, queda como respaldo
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

## 3. El hero: el scroll hace crecer el edificio

`assets/video/hero-scrub.mp4` (720p, 10 s, **2,0 MB**) es el metraje del proyecto
creciendo. **No se reproduce en bucle**: su tiempo lo manda el scroll.

Antes iba con `loop`, y como el clip va de lote vacío a edificio terminado, cada
10 s cortaba de golpe al principio. Ese era el salto. Ahora:

- **Escenario fijo** (`.hero-stage`, 2,3 pantallas de alto) con el contenido
  `sticky`: mientras bajas, el edificio se construye.
- **Acercamiento en 3D**: `perspective: 1200px` en el escenario y `translateZ`
  sobre el video — es profundidad real, no una escala plana.
- **El cielo va aparte** (`.hero-sky`): dos capas de nubes en deriva continua a
  distinta velocidad, enmascaradas a la franja alta. No dependen del scroll, así
  que la escena sigue viva aunque el visitante no mueva nada.
- **El texto sale limpio**: entero hasta el 18 % del recorrido y fuera al 45 %.

### Por qué el video está reencodeado

El original tenía **2 keyframes en 240 fotogramas**. Barrer con el scroll obliga
a saltar a posiciones arbitrarias, y con keyframes tan separados el navegador
tiene que decodificar medio clip para cada salto: ahí venían los tirones.
`hero-scrub.mp4` lleva **49 keyframes** (uno cada 0,2 s) y encima pesa menos.

Si cambias el metraje, reencódealo igual:

```bash
ffmpeg -i tu-video.mp4 -c:v libx264 -crf 23 -preset slow \
       -g 5 -keyint_min 5 -sc_threshold 0 -an \
       -movflags +faststart assets/video/hero-scrub.mp4
```

Ajustes rápidos, todos en `index.html`:

| Quiero… | Dónde |
|---|---|
| Más o menos recorrido | `.hero-stage { height: 230vh }` |
| Acercamiento más fuerte | `const z = actual * 190;` en `heroScrollStage` |
| Nubes más rápidas | `animation: skyDrift 96s` |
| Texto que aguante más | `(0.45 - actual) / 0.27` |

---

## 3.bis. El modelo BIM que se construye con el scroll

`assets/js/bim-building.js` dibuja en canvas un modelo tridimensional en líneas
—lenguaje de plano— que se levanta por fases: lote, cimentación, estructura
nivel a nivel, envolvente y cubierta. Sustituyó al scrollytelling anterior, que
volvía a barrer el mismo video del hero.

- **Sin librerías 3D.** La proyección en perspectiva es propia (unas 40 líneas).
  Traer Three.js habrían sido ~600 KB para dibujar aristas. De paso salió GSAP,
  que solo usaba el scrollytelling: 114 KB menos.
- **La cámara cuenta la obra**: arranca casi en planta —como se lee una
  implantación— y baja a nivel de calle mientras el edificio sube.
- **Atenuación por profundidad**: lo cercano va nítido, lo lejano se apaga. Sin
  eso el modelo se lee como una maraña de alambre en vez de un plano.
- **Encuadre automático**: se proyectan las ocho esquinas de lo ya construido y
  la escala se ajusta a lo que ocupan. Por eso nunca se sale del lienzo, en
  ninguna pantalla.
- **Cotas de nivel, cota de altura, escala gráfica, norte y llamados de
  elemento**: es lo que lo hace leer como documentación técnica y no como
  adorno. Las cotas se colocan fuera de la silueta proyectada, así que no se
  montan encima del edificio al girar la cámara.

Qué tocar (todo en `bim-building.js`):

| Quiero… | Dónde |
|---|---|
| Otro número de pisos o luces | `ANCHO`, `FONDO`, `ALTURA_PISO`, `PISOS`, `EJES_X`, `EJES_Z` |
| Cambiar el orden de montaje | los `tramo(p, desde, hasta)` dentro de `dibujar` |
| Otros textos de fase | `FASES` |
| Otros llamados de elemento | `LLAMADOS` |
| Recorrido más largo o corto | `height:320vh` del `#bimStage` en `index.html` |

⚠️ El lienzo va en `absolute inset-0` dentro del escenario, **no** dentro de un
reparto flex: ahí se quedaba en altura 0 y el modelo no se veía.

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
- `prefers-reduced-motion` detiene la cinta, las nubes y el barrido: el hero
  muestra un fotograma fijo del proyecto terminado.
- El bloque de JavaScript va dentro de `DOMContentLoaded`. **No lo saques de
  ahí**: las librerías se cargan con `defer` y un script en línea corre antes que
  ellas; sin la espera, la primera línea que use `gsap` o los iconos lanza un
  error y se lleva por delante el scrollytelling, el simulador y el menú.
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
