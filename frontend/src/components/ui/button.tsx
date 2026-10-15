import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonColor = "primary" | "dark" | "light" | "danger" | "blue" | "black";

export const buttonStyles: Record<ButtonColor, string> = {
  primary: "bg-brand-dark text-white hover:bg-teal-800",
  dark: "bg-brand-secondary text-white hover:bg-gray-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
  light: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100",
  blue: "bg-brand-dark text-white hover:bg-teal-800",
  black: "bg-brand-dark text-white hover:bg-teal-800",
};

export const buttonBaseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium shadow-soft transition-colors";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  children: ReactNode;
  color?: ButtonColor;
  unstyled?: boolean;
}

export function Button({ children, color = "primary", type = "button", unstyled = false, className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={unstyled ? className : `${buttonBaseStyles} ${buttonStyles[color]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export default Button;
