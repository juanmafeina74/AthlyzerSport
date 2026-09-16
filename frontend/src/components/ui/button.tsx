import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type ButtonColor = "primary" | "dark" | "light" | "danger" | "blue" | "black";

export const buttonStyles: Record<ButtonColor, string> = {
  primary: "bg-brand-primary text-white hover:bg-blue-700",
  dark: "bg-brand-secondary text-white hover:bg-gray-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
  light: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  black: "bg-gray-900 text-white hover:bg-gray-950",
};

export const buttonBaseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium shadow-soft transition-colors";

interface ButtonProps {
  children: ReactNode;
  color?: ButtonColor;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

export function Button({ children, color = "primary", onClick, type = "button" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${buttonBaseStyles} ${buttonStyles[color]}`}
    >
      {children}
    </button>
  );
}

export default Button;
