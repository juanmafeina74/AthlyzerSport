type Point = { x: number; y: number };

type SomatocartaProps = {
  current?: Point;
  previous?: Point;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mapX = (value: number) => 30 + ((clamp(value, -10, 10) + 10) / 20) * 340;
const mapY = (value: number) => 250 - ((clamp(value, -10, 15) + 10) / 25) * 220;

export default function Somatocarta({ current, previous }: SomatocartaProps) {
  return (
    <div className="rounded-lg border border-panel-border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">Somatocarta</h3>
        <div className="flex gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-gray-400" />Anterior</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Actual</span>
        </div>
      </div>
      <svg viewBox="0 0 400 280" className="aspect-[10/7] w-full" role="img" aria-label="Somatocarta de la medición actual y anterior">
        <rect x="30" y="30" width="340" height="220" rx="4" fill="#f9fafb" stroke="#e5e7eb" />
        <line x1="200" y1="30" x2="200" y2="250" stroke="#9ca3af" />
        <line x1="30" y1={mapY(0)} x2="370" y2={mapY(0)} stroke="#9ca3af" />
        <text x="34" y="22" fontSize="11" fill="#6b7280">Mesomorfia</text>
        <text x="30" y="269" fontSize="11" fill="#6b7280">Endomorfia</text>
        <text x="310" y="269" fontSize="11" fill="#6b7280">Ectomorfia</text>
        {previous && current && (
          <line
            x1={mapX(previous.x)}
            y1={mapY(previous.y)}
            x2={mapX(current.x)}
            y2={mapY(current.y)}
            stroke="#059669"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
        {previous && <circle cx={mapX(previous.x)} cy={mapY(previous.y)} r="7" fill="#9ca3af" />}
        {current && <circle cx={mapX(current.x)} cy={mapY(current.y)} r="8" fill="#059669" stroke="white" strokeWidth="3" />}
      </svg>
      {!current && <p className="text-center text-sm text-gray-500">Completa perímetros y diámetros para situar el somatotipo.</p>}
    </div>
  );
}