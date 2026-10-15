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
          dark: "var(--color-ink)",
          light: "var(--color-background)",
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-info)",
        },

        panel: {
          bg: "var(--color-surface)",
          border: "var(--color-border)",
        },

        alert: {
          info: "#dbeafe",
          warning: "#fef3c7",
          danger: "#fee2e2",
        },

        red: {
          800: "var(--color-danger)",
        },

        status: {
          active: "var(--color-error)",
          clear: "var(--color-success)",
          pending: "var(--color-warning)",
          info: "var(--color-info)",
          medical: "var(--color-success)",
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
