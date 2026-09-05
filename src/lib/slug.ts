/**
 * "Still Life · Ñandú" → "still-life-nandu"
 *
 * Vive fuera de las server actions a propósito: los archivos "use server" sólo
 * pueden exportar funciones async, y además el panel la usa en el navegador
 * para mostrar la URL mientras se escribe el nombre.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
