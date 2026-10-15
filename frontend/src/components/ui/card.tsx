import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
      {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
      {children}
    </div>
  );
}

export default Card;

