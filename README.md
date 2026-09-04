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
| `/upload`             | Subida de fotos (no indexada, protegida por código)       |

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

| Ancho     | Columnas | Gap vertical |
| --------- | -------- | ------------ |
| `< 640px` | 1        | 40px         |
| `≥ 640px` | 2        | 32px         |
| `≥ 1024px`| 3        | 20px         |
| `≥ 1280px`| 4        | 20px         |
| `≥ 1536px`| 5        | 20px         |

Las proporciones disponibles están preseteadas en
[`src/app/upload/formats.ts`](src/app/upload/formats.ts) — de `16/10` a `5/7` —
para que subir fotos no rompa el ritmo visual.

---

## Supabase

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

| Variable                        | Dónde se usa                            |
| ------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | lectura pública + `next/image`          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | lectura pública                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | **sólo servidor** — subida en `/upload` |
| `STUDIO_ACCESS_CODE`            | clave que protege `/upload`             |

### 2. Esquema

Pegar [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de Supabase y
ejecutarlo. Crea las tablas `collections` y `photos`, el bucket público `photos`,
las políticas de RLS de lectura y las cuatro categorías iniciales.

### 3. Subir fotos

`/upload` → elegir imagen, label, dato corto, categoría, proporción y el código de
acceso. La imagen va al bucket, la ficha a `photos`, y se revalida todo el sitio.

> **Antes de producción:** el gate de `/upload` es un único código en variable de
> entorno, suficiente para un portfolio personal pero no es autenticación.
> Para varios usuarios, reemplazarlo por Supabase Auth y cambiar las políticas de
> RLS de escritura a `auth.uid()`, en lugar de usar la service role key.

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx              Inter + IBM Plex Mono, header, footer
│   ├── page.tsx                Work
│   ├── globals.css             tokens + grilla + utilidades
│   ├── collections/[slug]/     vista filtrada
│   ├── studio/ · journal/ · contact/
│   └── upload/                 page · UploadForm · actions · formats
├── components/
│   ├── SiteHeader.tsx          wordmark + punto de acento + nav
│   ├── SiteFooter.tsx
│   ├── Container.tsx           1440px + padding lateral
│   ├── PageIntro.tsx           eyebrow + display + lead (7fr / 4fr)
│   ├── FilterBar.tsx           categorías + contador
│   ├── PhotoGrid.tsx           .works-grid
│   ├── PhotoTile.tsx           marco + pie con hairline
│   └── LoadMore.tsx
└── lib/
    ├── types.ts
    ├── placeholder-data.ts     18 proyectos, 4 categorías
    ├── queries.ts              Supabase con fallback a placeholder
    └── supabase/               config · server (lectura) · admin (escritura)
```

## Próximo paso

Reemplazar el contenido de `src/lib/placeholder-data.ts` con las fotos reales, o
cargarlas desde `/upload` una vez conectada la base.
