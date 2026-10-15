import { useState } from "react";
import Button from "../ui/button";

type Region = { name: string; path: string; side?: boolean };

const front: Region[] = [
  { name: "Cabeza", path: "M85 15 Q100 3 115 15 L113 40 Q100 52 87 40 Z" },
  { name: "Cuello", path: "M92 46 L108 46 L111 56 L89 56 Z" },
  { name: "Hombro", path: "M88 56 Q67 53 56 65 L63 80 L85 75 Z", side: true },
  { name: "Pecho", path: "M88 57 L100 60 L100 96 L83 94 L80 78 Z", side: true },
  { name: "Abdomen", path: "M83 97 L100 99 L100 133 L78 127 Z", side: true },
  { name: "Cadera", path: "M78 129 L100 135 L100 157 L79 164 L73 146 Z", side: true },
  { name: "Brazo", path: "M55 67 L63 82 L54 111 L41 107 Z", side: true },
  { name: "Codo", path: "M40 109 L54 113 L51 126 L36 123 Z", side: true },
  { name: "Antebrazo", path: "M36 126 L51 129 L45 161 L27 155 Z", side: true },
  { name: "Mano", path: "M27 158 L44 164 L41 182 L30 190 L23 175 Z", side: true },
  { name: "Muslo", path: "M79 167 L99 160 L98 225 L81 230 L72 206 Z", side: true },
  { name: "Rodilla", path: "M81 232 L98 228 L97 248 L80 249 Z", side: true },
  { name: "Pierna", path: "M80 252 L97 251 L93 310 L77 312 Z", side: true },
  { name: "Tobillo", path: "M77 315 L93 313 L92 328 L76 329 Z", side: true },
  { name: "Pie", path: "M76 331 L93 331 L98 345 L70 346 Z", side: true },
];

const back: Region[] = front.map((region) => ({
  ...region,
  name: ({ Pecho: "Espalda alta", Abdomen: "Espalda baja", Cadera: "Glúteo", Pierna: "Pantorrilla" } as Record<string, string>)[region.name] ?? region.name,
}));

export default function BodyMap({ value, onChange }: { value: string; onChange: (zone: string) => void }) {
  const [view, setView] = useState<"Anterior" | "Posterior">("Anterior");
  const regions = view === "Anterior" ? front : back;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">Zona anatómica *</span>
        <div className="inline-flex rounded border border-gray-300 bg-white p-0.5 text-xs" aria-label="Vista del cuerpo">
          {(["Anterior", "Posterior"] as const).map((option) => (
            <Button key={option} unstyled type="button" onClick={() => setView(option)} aria-pressed={view === option}
              className={`rounded px-3 py-1.5 ${view === option ? "bg-brand-dark text-white" : "text-gray-600 hover:bg-gray-100"}`}>{option}</Button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 200 355" className="mx-auto h-80 max-w-full" role="img" aria-label={`Mapa anatómico, vista ${view.toLowerCase()}`}>
        {regions.flatMap((region) => (region.side ? ["screen-left", "screen-right"] : [""]).map((position) => {
          const side = position === "" ? "" : position === "screen-left"
            ? (view === "Anterior" ? "Derecha" : "Izquierda")
            : (view === "Anterior" ? "Izquierda" : "Derecha");
          const zone = [region.name, side, view.toLowerCase()].filter(Boolean).join(" · ");
          return (
            <path key={zone} id={`zona-${view}-${region.name}-${side}`.replace(/\s+/g, "-")}
              d={region.path} transform={position === "screen-right" ? "translate(200 0) scale(-1 1)" : undefined}
              fill={value === zone ? "#0d9488" : "#dbe5e8"} stroke="#fff" strokeWidth="2"
              className="cursor-pointer transition-colors hover:fill-teal-300 focus:outline-none focus:stroke-teal-900"
              role="button" tabIndex={0} aria-label={zone} aria-pressed={value === zone}
              onClick={() => onChange(zone)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChange(zone); } }}>
              <title>{zone}</title>
            </path>
          );
        }))}
      </svg>
      <p className="mt-2 min-h-6 text-center text-sm text-teal-800" aria-live="polite">{value || "Selecciona una región del cuerpo"}</p>
    </div>
  );
}