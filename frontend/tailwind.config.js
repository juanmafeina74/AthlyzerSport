/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui"],
      },

      colors: {
        brand: {
          dark: "#1a1a1a",      // Sidebar oscuro
          light: "#f5f5f5",     // Fondo general
          primary: "#2563eb",   // Azul botones / progreso
          secondary: "#111827", // Botón negro
          accent: "#3b82f6",    // Azul claro
        },

        panel: {
          bg: "#ffffff",
          border: "#e5e7eb",
        },

        alert: {
          info: "#dbeafe",
          warning: "#fef3c7",
          danger: "#fee2e2",
        },
      },

      boxShadow: {
        card: "0 2px 6px rgba(0,0,0,0.08)",
        panel: "0 4px 12px rgba(0,0,0,0.06)",
        soft: "0 1px 3px rgba(0,0,0,0.05)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },

      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
