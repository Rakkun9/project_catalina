import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Photo } from "@/lib/types";

export function PhotoTile({ photo, priority = false }: { photo: Photo; priority?: boolean }) {
  const frameStyle = { aspectRatio: photo.ratio } as CSSProperties;

  const body = (
    <>
      <div
        style={frameStyle}
        className="relative overflow-hidden transition-opacity duration-[400ms] ease-out group-hover:opacity-[0.82]"
      >
        {photo.src ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority={priority}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, (max-width: 1535px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          // Sin foto real: trama diagonal y la proporción impresa en mono.
          <div
            role="img"
            aria-label={photo.alt}
            className="tile-fill flex h-full w-full items-center justify-center"
          >
            <span className="ui-tile-label font-mono text-tile-label">{photo.ratio}</span>
          </div>
        )}
      </div>

      {photo.meta ? (
        <div className="mt-3 flex justify-between gap-2.5 border-t border-hairline pt-2.5 whitespace-nowrap">
          <span className="ui-tile-label text-ink">{photo.label}</span>
          <span className="ui-tile-label text-muted">{photo.meta}</span>
        </div>
      ) : null}
    </>
  );

  if (photo.collectionSlug) {
    return (
      <article>
        <Link href={`/collections/${photo.collectionSlug}`} className="group block">
          {body}
        </Link>
      </article>
    );
  }

  return <article className="group">{body}</article>;
}
