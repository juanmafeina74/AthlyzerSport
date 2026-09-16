import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonBaseStyles, buttonStyles } from "./button";

type LinkButtonColor = keyof typeof buttonStyles;

interface LinkButtonProps {
  children: ReactNode;
  color?: LinkButtonColor;
  to: string;
}

export default function LinkButton({ children, color = "primary", to }: LinkButtonProps) {
  return (
    <Link className={`${buttonBaseStyles} ${buttonStyles[color]}`} to={to}>
      {children}
    </Link>
  );
}
