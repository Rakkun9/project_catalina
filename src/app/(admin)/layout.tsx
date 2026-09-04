import type { ReactNode } from "react";

/**
 * El panel y el login no usan el header ni el footer del sitio público.
 * Comparten la paleta y la tipografía, pero con una densidad más alta.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
