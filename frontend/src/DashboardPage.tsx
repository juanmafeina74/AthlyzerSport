import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./components/ui/button";
import LinkButton from "./components/ui/LinkButton";
import equiposService from "./components/services/equipos.service";
import jugadorEquipoService, { type PlantillaEntry } from "./components/services/jugadorEquipo.service";
import { lesionesService, type Lesion } from "./components/services/lesiones.service";
import temporadasService from "./components/services/temporadas.service";

type Equipo = { id_equipo: number; nombre: string; id_temporada: number };
type Temporada = { id_temporada: number; nombre: string };

function withTimeout<T>(request: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("El servidor no responde. Inténtalo de nuevo más tarde.")), 10_000);
    request.then(
      (value) => { window.clearTimeout(timeout); resolve(value); },
      (cause) => { window.clearTimeout(timeout); reject(cause); },
    );
  });
}

export default function DashboardPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [plantilla, setPlantilla] = useState<PlantillaEntry[]>([]);
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const role = JSON.parse(localStorage.getItem("athlyzer_user") || "{}").role as string | undefined;
  const canSeeMedical = role === "admin" || role === "usuario";

  useEffect(() => {
    let active = true;
    withTimeout(Promise.all([
      equiposService.getAll() as Promise<Equipo[]>,
      canSeeMedical ? lesionesService.list() : Promise.resolve([]),
      temporadasService.getAll() as Promise<Temporada[]>,
    ])).then(([items, injuries, seasons]) => {
      if (!active) return;
      if (!Array.isArray(items) || !Array.isArray(seasons)) throw new Error("No se pudieron cargar los equipos o las temporadas.");
      setEquipos(items);
      setLesiones(injuries);
      setTemporadas(seasons);
      setSelectedId(items[0]?.id_equipo ?? null);
      if (!items.length) setLoading(false);
    }).catch((cause) => {
      if (active) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el panel."); setLoading(false); }
    });
    return () => { active = false; };
  }, [canSeeMedical]);

  useEffect(() => {
    if (selectedId === null) return;
    let active = true;
    setLoading(true);
    setError("");
    setPlantilla([]);
    withTimeout(jugadorEquipoService.getPlantilla(selectedId))
      .then((items) => {
        if (!active) return;
        if (!Array.isArray(items)) throw new Error("No se pudo cargar la plantilla.");
        setPlantilla(items);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la plantilla."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const equipo = equipos.find((item) => item.id_equipo === selectedId);
  const temporada = temporadas.find((item) => item.id_temporada === equipo?.id_temporada);
  const playerIds = new Set(plantilla.map((entry) => entry.id_jugador));
  const activeInjuries = lesiones.filter((injury) => !injury.alta_medica && playerIds.has(injury.id_jugador));
  const injuredIds = new Set(activeInjuries.map((injury) => injury.id_jugador));
  const withoutActiveInjury = plantilla.length - injuredIds.size;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 text-gray-900">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase text-teal-700">Centro de mando diario</p>
          <h1 className="text-2xl font-bold">Estado de la plantilla</h1>
          <p className="mt-1 text-sm text-gray-600">{new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(new Date())}</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold text-gray-700">Equipo en foco
            <select value={selectedId ?? ""} disabled={!equipos.length} onChange={(event) => setSelectedId(Number(event.target.value))}
              className="mt-1 block min-w-48 max-w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-teal-700">
              {!equipos.length && <option value="">Sin equipos</option>}
              {equipos.map((item) => <option key={item.id_equipo} value={item.id_equipo}>{item.nombre}</option>)}
            </select>
          </label>
          <p className="pb-2 text-sm text-gray-600">Temporada: <strong className="text-gray-900">{temporada?.nombre ?? "Sin temporada"}</strong></p>
        </div>
      </header>

      {error && <p role="alert" className="rounded bg-red-100 px-4 py-3 text-sm text-red-800">{error}</p>}
      {loading && <p role="status" className="text-sm text-gray-600">Cargando estado del equipo...</p>}
      {!loading && !error && !equipo && <div className="border-l-4 border-teal-600 bg-white p-5 text-sm">No hay equipos registrados. <Link to="/equipos" className="font-semibold text-teal-700 underline">Ver equipos</Link></div>}

      {!loading && !error && equipo && <>
        <section aria-label="Indicadores clave" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Plantilla activa", value: String(plantilla.length), note: "Jugadores asignados al equipo", color: "border-teal-600" },
            { label: "Sin lesión activa", value: canSeeMedical ? `${withoutActiveInjury} / ${plantilla.length}` : "—", note: canSeeMedical ? "No equivale a aptitud para entrenar" : "Datos médicos restringidos", color: "border-emerald-600" },
            { label: "Wellness hoy", value: "—", note: "Pendiente de cuestionarios", color: "border-amber-500" },
            { label: "Jugadores en readaptación", value: canSeeMedical ? String(injuredIds.size) : "—", note: canSeeMedical ? "Con lesión activa registrada" : "Datos médicos restringidos", color: "border-rose-600" },
          ].map((metric) => <div key={metric.label} className={`min-w-0 border-l-4 bg-white p-4 shadow-sm ${metric.color}`}>
            <p className="text-xs font-semibold uppercase text-gray-600">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{metric.value}</p>
            <p className="mt-2 text-xs text-gray-600">{metric.note}</p>
          </div>)}
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <section className="min-w-0 bg-white p-5 shadow-sm" aria-labelledby="alerts-title">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h2 id="alerts-title" className="text-lg font-semibold">Atención médica</h2>
              {canSeeMedical && <span className="text-sm font-medium text-rose-700">{injuredIds.size} jugadores en seguimiento</span>}
            </div>
            {!canSeeMedical ? <p className="py-6 text-sm text-gray-600">Datos médicos disponibles para el personal autorizado.</p> : activeInjuries.length ? <ul className="divide-y divide-gray-100">
              {activeInjuries.map((injury) => <li key={injury.id_lesion} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div>
                  <Link className="font-semibold text-teal-800 hover:underline" to={`/jugadores/${injury.id_jugador}`}>{injury.jugador.nombre} {injury.jugador.apellidos}</Link>
                  <p className="mt-1 text-gray-600">{injury.tipo_lesion || "Lesión sin clasificar"} · {injury.zona_corporal || "Zona no indicada"}</p>
                </div>
                <span className="font-medium text-rose-700">{injury.fase_readaptacion}</span>
              </li>)}
            </ul> : <p className="py-6 text-sm text-gray-600">No hay lesiones activas registradas para este equipo.</p>}
            <div className="border-t border-gray-100 pt-3 text-sm text-gray-600">Las alertas de wellness, ACWR y revisiones programadas estarán disponibles cuando se registren esos datos.</div>
          </section>

          <div className="space-y-5">
            <section className="bg-white p-5 shadow-sm" aria-labelledby="health-title">
              <h2 id="health-title" className="text-lg font-semibold">Salud de la plantilla</h2>
              <p className="mt-3 text-sm text-gray-600">{canSeeMedical ? "Distribución según lesiones registradas" : "Datos médicos restringidos"}</p>
              {canSeeMedical && <><div className="mt-3 flex h-3 overflow-hidden rounded bg-gray-100" role="img" aria-label={`${withoutActiveInjury} sin lesión activa, ${injuredIds.size} con lesión activa`}>
                <div className="bg-emerald-500" style={{ width: `${plantilla.length ? withoutActiveInjury / plantilla.length * 100 : 0}%` }} />
                <div className="bg-rose-500" style={{ width: `${plantilla.length ? injuredIds.size / plantilla.length * 100 : 0}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span className="text-emerald-700">● Sin lesión: {withoutActiveInjury}</span><span className="text-rose-700">● En seguimiento: {injuredIds.size}</span></div>
              <p className="mt-3 text-xs text-gray-500">El estado «precaución» requiere datos de molestias y wellness.</p></>}
            </section>

            <section className="bg-white p-5 shadow-sm" aria-labelledby="actions-title">
              <h2 id="actions-title" className="text-lg font-semibold">Acciones rápidas</h2>
              <div className="mt-4 grid gap-2">
                {canSeeMedical ? <LinkButton to="/mediciones-antropometricas/crear">+ Nueva evaluación ISAK</LinkButton> : <Button unstyled disabled className="cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-left text-sm text-gray-500">Nueva evaluación ISAK · Acceso restringido</Button>}
                {canSeeMedical ? <LinkButton color="light" to="/lesiones?nueva=1">+ Registrar lesión</LinkButton> : <Button unstyled disabled className="cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-left text-sm text-gray-500">Registrar lesión · Acceso restringido</Button>}
                <LinkButton color="light" to={`/equipos/plantilla/${equipo.id_equipo}`}>Ver plantilla</LinkButton>
                <Button unstyled disabled title="Pendiente de módulo de tests" className="cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-left text-sm text-gray-500">Carga masiva de test · Próximamente</Button>
                <Button unstyled disabled title="Pendiente de módulo wellness" className="cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-left text-sm text-gray-500">Respuestas wellness · Próximamente</Button>
              </div>
            </section>
          </div>
        </div>

        <section className="border-t border-gray-200 pt-5" aria-labelledby="load-title">
          <h2 id="load-title" className="text-lg font-semibold">Carga y próximas sesiones</h2>
          <p className="mt-2 text-sm text-gray-600">La evolución de carga aguda/crónica, el RPE medio y las próximas evaluaciones se mostrarán cuando exista registro de sesiones y tests.</p>
        </section>
      </>}
    </div>
  );
}
