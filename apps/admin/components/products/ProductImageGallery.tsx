"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface GalleryImage {
  url: string;
  alt: string;
}

/**
 * Product detail gallery — main viewer + selectable thumbnail strip.
 * Receives the deduplicated [main, ...gallery] image list from the server.
 */
export default function ProductImageGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (images.length === 0) {
    return (
      <div
        className="card flex flex-col items-center justify-center gap-2"
        style={{ aspectRatio: "1 / 1", color: "var(--apt-text-muted)" }}
      >
        <ImageOff size={22} />
        <span className="text-[12px]">No images uploaded</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="card relative flex items-center justify-center overflow-hidden p-6"
        style={{ aspectRatio: "1 / 1" }}
      >
        <img
          src={current.url}
          alt={current.alt || name}
          className="max-h-full max-w-full object-contain"
        />
        {images.length > 1 && (
          <span
            className="absolute top-3 left-3 font-mono text-[10.5px] px-1.5 py-0.5 rounded"
            style={{ color: "var(--apt-text-muted)", background: "var(--apt-bg)" }}
          >
            {index + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-2">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className="rounded-lg overflow-hidden flex items-center justify-center p-1 cursor-pointer transition-colors"
              style={{
                aspectRatio: "1 / 1",
                background: "var(--apt-bg)",
                border: `1px solid ${i === index ? "#0057b8" : "var(--apt-border)"}`,
              }}
            >
              <img src={img.url} alt={img.alt || name} className="max-h-full max-w-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
