import type { ReactNode } from "react";

/** 1440px de ancho útil con 40px de aire lateral, como el canvas. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-6 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
