import { exactRatio } from "./ratios";

export type ProcessedImage = {
  /** Archivo listo para subir: reescalado y recomprimido. */
  blob: Blob;
  /** Extensión que corresponde al tipo real del blob. */
  extension: string;
  /** Dimensiones del ORIGINAL, que son las que se guardan en la base. */
  width: number;
  height: number;
  /** Proporción EXACTA del original, reducida. Sin recorte. */
  ratio: string;
  /** Dimensiones del archivo generado. */
  outputWidth: number;
  outputHeight: number;
};

const MAX_WIDTH = 2400;
const QUALITY = 0.82;

/**
 * Lee las dimensiones reales, reescala a un ancho máximo y recomprime a WebP.
 *
 * Un JPG de cámara son 8–15 MB y el bucket termina guardando el original entero
 * aunque en pantalla nunca se muestre a más de ~700px de ancho. Esto corre en el
 * navegador con canvas, así que no agrega dependencias ni carga al servidor.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  try {
    // Nunca se agranda: si la foto ya es chica, sólo se recomprime.
    const scale = Math.min(1, MAX_WIDTH / width);
    const outputWidth = Math.max(1, Math.round(width * scale));
    const outputHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no permitió usar canvas.");
    context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);

    const blob = await toBlob(canvas);

    return {
      blob,
      extension: blob.type === "image/webp" ? "webp" : "jpg",
      width,
      height,
      ratio: exactRatio(width, height),
      outputWidth,
      outputHeight,
    };
  } finally {
    bitmap.close();
  }
}

/**
 * `toBlob` con WebP y caída a JPEG. Los navegadores que no soportan un tipo no
 * fallan: devuelven PNG en silencio, que pesa más que el original. Por eso se
 * verifica el tipo del resultado en lugar de asumirlo.
 */
function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webp) => {
        if (webp && webp.type === "image/webp") return resolve(webp);

        canvas.toBlob(
          (jpeg) => {
            if (jpeg) return resolve(jpeg);
            reject(new Error("No se pudo generar la imagen."));
          },
          "image/jpeg",
          QUALITY,
        );
      },
      "image/webp",
      QUALITY,
    );
  });
}

/** "DSC_0142_kioto-final.JPG" → "DSC 0142 kioto final" */
export function labelFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lee sólo las dimensiones, sin procesar la imagen. Es barato y permite mostrar
 * la proporción real apenas se eligen los archivos, en vez de esperar a la subida.
 */
export async function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
