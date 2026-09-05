import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

// Sólo para las etiquetas diminutas de proporción dentro de cada tarjeta.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Estudio fotografía",
    template: "%s — Estudio Catalina",
  },
  description:
    "Portfolio de fotografía editorial, retrato, arquitectura y still life.",
};

/** Sólo el documento y las fuentes. El chrome lo pone cada grupo de rutas. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
