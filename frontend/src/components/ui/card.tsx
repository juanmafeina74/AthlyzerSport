import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-panel p-8 space-y-6 border border-panel-border">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      {children}
    </div>
  );
}

export default Card;

