# Project Catalina

Portfolio fotográfico con estética editorial minimalista.
**Next.js 16 (App Router) · Tailwind CSS v4 · Supabase.** Sin librerías de UI.

El sistema visual está tomado del canvas de Claude Design *"Portfolio Editorial"*,
con la tipografía cambiada a **Inter**.

---

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
```

El sitio arranca con **datos de placeholder** — no necesita Supabase para verse.
Cuando las variables de entorno estén completas y haya filas en la base, el
contenido real reemplaza a los placeholders automáticamente
(ver [`src/lib/queries.ts`](src/lib/queries.ts)).

---

## Rutas

| Ruta                  | Qué es                                                   |
| --------------------- | -------------------------------------------------------- |
| `/`                   | Work — grilla masonry con todos los proyectos             |
| `/collections/[slug]` | La misma vista, filtrada por categoría                    |
| `/studio`             | Sobre el estudio + ficha de datos                         |
| `/journal`            | Listado de notas con hairlines                            |
| `/contact`            | Canales de contacto                                       |
| `/login`              | Entrada al panel                                          |
| `/admin/photos`       | Panel: lista, orden y vista previa                        |
| `/admin/categories`   | Crear, editar, ordenar y borrar categorías                |
| `/admin/photos/upload`| Subida múltiple con procesado en el navegador             |

Las páginas públicas viven en `src/app/(site)/` y el panel en `src/app/(admin)/`,
para que cada grupo tenga su propio chrome. Todo `/admin/*` está protegido por
[`src/middleware.ts`](src/middleware.ts).

---

## El sistema visual

Todo vive en [`src/app/globals.css`](src/app/globals.css) como tokens de Tailwind v4
(`@theme`) y utilidades propias (`@utility`).

**Paleta** — cálida y casi monocromática.

| Token             | Valor       | Uso                                    |
| ----------------- | ----------- | -------------------------------------- |
| `--color-paper`   | `#fafaf9`   | fondo                                  |
| `--color-ink`     | `#171614`   | texto principal                        |
| `--color-muted`   | `#8a8781`   | labels, metadatos                      |
| `--color-hairline`| `#e4e2de`   | separadores de 1px                     |
| `--color-tile`    | `#f1f0ee`   | fondo de tarjeta sin foto              |
| `--color-tile-label` | `#a8a5a0` | proporción impresa dentro de la tarjeta |
| `--color-accent`  | `oklch(0.62 0.06 40)` | punto junto al wordmark      |

**Tipografía** — Inter en cuatro pesos (200 / 300 / 400 / 500), más IBM Plex Mono
sólo para las etiquetas de proporción dentro de cada tarjeta.

- `.display` → peso 200, `line-height 1.02`, tracking `-0.03em`, `text-wrap: balance`
- `.ui-label` → 11px, MAYÚSCULAS, tracking `0.18em` (nav, filtros, footer)
- `.ui-eyebrow` → 11px, tracking `0.22em` (migas de pan)
- `.ui-tile-label` → 9px, tracking `0.16em` (pie de tarjeta)

**Separadores** — `border-hairline` de 1px. Sin sombras, sin bordes gruesos.

### La grilla asimétrica

`.works-grid` usa **multi-columna de CSS**: cada tarjeta fija su propio
`aspect-ratio`, así que las columnas quedan de distinto alto y el navegador las
equilibra sola.

```html
<div class="works-grid">
  <article><div style="aspect-ratio: 4 / 3">…</div></article>
```

El canvas resolvía este reparto con un algoritmo en JS sobre 5 columnas fijas.
Acá lo hace el navegador: mismo resultado visual, sin JS y reflowando solo en
cada breakpoint.

| Ancho     | Columnas | Gap columna | Gap fila |
| --------- | -------- | ----------- | -------- |
| `< 640px` | 2        | 12px        | 20px     |
| `≥ 640px` | 2        | 20px        | 32px     |
| `≥ 1024px`| 3        | 20px        | 20px     |
| `≥ 1280px`| 4        | 20px        | 20px     |
| `≥ 1536px`| 5        | 20px        | 20px     |

En celular son **dos columnas** desde el arranque, tipo Pinterest, con gaps más
chicos para que las fotos ganen ancho. El pie de cada tarjeta usa `flex-wrap` con
`basis-20` en el label: cuando la tarjeta es angosta, el dato corto baja de línea
en lugar de aplastar el nombre.

Cada tarjeta declara su `aspect-ratio` real, no uno de una lista cerrada — ver
"Proporciones" más abajo. Las esquinas usan `--radius-tile` (4px), definido una
sola vez en `@theme`.

---

## Supabase

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

| Variable                        | Dónde se usa                   |
| ------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | lectura pública + `next/image` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | lectura pública y sesión       |

Son las dos únicas claves. **La service-role key ya no se usa**: el panel escribe
con la sesión del usuario y RLS valida cada operación en la base.

### 2. Esquema

Pegar [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor y ejecutarlo.
Es idempotente, así que se puede volver a correr sobre una base existente. Crea las
tablas, el bucket público, las políticas de RLS, el trigger de `updated_at`, la
función `reorder_photos` y las cuatro categorías iniciales.

### 3. Crear el usuario administrador

> ⚠️ **Paso obligatorio, y en este orden.** Las políticas de escritura habilitan a
> cualquier usuario **autenticado**. Con el registro público abierto, eso significa
> que cualquiera puede crearse una cuenta y escribir en tus tablas.

1. **Authentication → Sign In / Providers → desactivar "Allow new users to sign up".**
2. **Authentication → Users → Add user**, con "Auto Confirm User" tildado (el
   proyecto pide confirmación por mail, y así te la salteás).

Si preferís no depender de ese interruptor, el final de `schema.sql` trae un bloque
comentado que mueve la validación a la base con una tabla `admins`. Con eso puesto,
da igual quién se pueda registrar.

### 4. Usar el panel

`/admin/photos` tiene tres modos sobre el mismo estado:

- **Lista** — edición inline de label, dato corto, alt, proporción y categoría.
  Publicar/despublicar guarda al instante; el resto, con "Guardar" por fila.
  Borrar pide confirmación y limpia también el archivo del bucket.
- **Orden** — arrastrar para reordenar, con botones ↑ ↓ para teclado y touch.
  "Guardar orden" escribe todas las posiciones en una sola sentencia (`reorder_photos`).
- **Vista previa** — la grilla real a 375 / 768 / 1280 / 1440 px, reflejando el orden
  actual aunque no lo hayas guardado.

En `/admin/photos/upload` cada archivo se reescala a 2400px y se convierte a WebP
**en tu navegador** antes de subirse.

### 5. Proporciones: por qué no hay que elegirlas

Cada foto usa **su proporción exacta** por defecto, calculada de las dimensiones
reales del archivo. Como el marco tiene la misma forma que la imagen, `object-cover`
no recorta nada.

Los presets (`4 / 3`, `1 / 1`, `2 / 3`…) siguen disponibles como **recorte
deliberado**, y el panel avisa cuánto se pierde: forzar una foto 3:2 a `4 / 5`
descarta el 47% de la imagen.

El botón **"Quitar recortes"** en `/admin/photos` devuelve todas las fotos a su
proporción original de una vez — útil para las cargadas antes de este cambio.

### 6. Categorías

`/admin/categories` permite crearlas, renombrarlas, cambiarles la URL y la
descripción, y reordenarlas (el orden es el de la barra de filtros del sitio).
Borrar una categoría **no borra sus fotos**: la clave foránea es
`on delete set null`, así que quedan sin categoría y se reasignan desde la lista.

---

## Estructura

```
src/
├── middleware.ts               refresca la sesión y bloquea /admin/*
├── app/
│   ├── layout.tsx              <html>, fuentes, globals.css
│   ├── globals.css             tokens + grilla + utilidades
│   ├── (site)/                 sitio público
│   │   ├── layout.tsx          SiteHeader + SiteFooter
│   │   └── page.tsx · collections/[slug]/ · studio/ · journal/ · contact/
│   └── (admin)/                panel
│       ├── login/              page · LoginForm
│       └── admin/
│           ├── layout.tsx      chrome del panel + salir
│           ├── actions.ts      fotos + categorías + quitar recortes
│           ├── photos/
│               ├── PhotoManager.tsx   estado compartido + 3 modos
│               ├── PhotoRow.tsx       fila editable
│               ├── ReorderGrid.tsx    arrastre nativo + ↑ ↓
│               ├── PreviewPane.tsx    PhotoGrid real a distintos anchos
│               └── upload/            page · UploadClient
│           └── categories/            page · CategoryManager · CategoryRow
├── components/                 SiteHeader · SiteFooter · Container · PageIntro
│                               FilterBar · PhotoGrid · PhotoTile · LoadMore
│                               RatioSelect (proporción + aviso de recorte)
└── lib/
    ├── types.ts                Photo y AdminPhoto
    ├── ratios.ts               exactRatio() + presets de recorte
    ├── slug.ts                 slugify() para las categorías
    ├── image.ts                resize + WebP + readDimensions()
    ├── placeholder-data.ts     18 proyectos, 4 categorías
    ├── queries.ts              públicas (con fallback) + del panel (sin fallback)
    └── supabase/               config · server (anon) · session (cookies) · browser
```

## Próximo paso

Con el panel andando, los candidatos más útiles para la próxima etapa son el blur
placeholder para `next/image`, las acciones masivas y el ABM de categorías —
detallados al final del plan en `.claude/plans/`.
