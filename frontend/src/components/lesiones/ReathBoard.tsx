import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import { lesionesService, type Lesion } from "../services/lesiones.service";
import BodyMap from "./BodyMap";

type Player = { id_jugador: number; nombre: string; apellidos: string };

const phases = [
  { key: "Fase 1", title: "Aguda / Tratamiento", detail: "Camilla", color: "border-rose-400 bg-rose-50" },
  { key: "Fase 2", title: "Readaptación física", detail: "Gimnasio", color: "border-amber-400 bg-amber-50" },
  { key: "Fase 3", title: "Campo adaptado", detail: "Trabajo individual", color: "border-sky-400 bg-sky-50" },
  { key: "Fase 4", title: "Integración parcial", detail: "Con el grupo", color: "border-emerald-400 bg-emerald-50" },
] as const;

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default function ReathBoard() {
  const [searchParams] = useSearchParams();
  const [injuries, setInjuries] = useState<Lesion[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropPhase, setDropPhase] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(Boolean(searchParams.get("jugador")));
  const [form, setForm] = useState({ id_jugador: searchParams.get("jugador") ?? "", fecha_inicio: today(), tipo_lesion: "", zona_corporal: "", observaciones: "" });

  useEffect(() => {
    Promise.all([lesionesService.list(), jugadoresService.getAll() as Promise<Player[]>])
      .then(([items, roster]) => { setInjuries(items); setPlayers(roster); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "No se pudieron cargar las lesiones."))
      .finally(() => setLoading(false));
  }, []);

  async function changePhase(injury: Lesion, phase: string) {
    if (injury.fase_readaptacion === phase || busyId !== null) return;
    if (phase === "Alta Médica" && !window.confirm(`¿Confirmar el alta médica de ${injury.jugador.nombre} ${injury.jugador.apellidos}?`)) return;
    setBusyId(injury.id_lesion);
    setError("");
    setNotice("");
    try {
      const updated = await lesionesService.changePhase(injury.id_lesion, phase);
      setInjuries((items) => items.map((item) => item.id_lesion === injury.id_lesion ? { ...item, ...updated } : item));
      setNotice(phase === "Alta Médica" ? "Alta médica registrada." : `${injury.jugador.nombre} pasó a ${phase}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la fase.");
    } finally {
      setBusyId(null);
    }
  }

  async function createInjury(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.zona_corporal || !form.id_jugador) {
      setError("Selecciona un jugador y una zona del mapa.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await lesionesService.create({ ...form, id_jugador: Number(form.id_jugador) });
      setInjuries((items) => [created, ...items]);
      setShowForm(false);
      setForm({ id_jugador: "", fecha_inicio: today(), tipo_lesion: "", zona_corporal: "", observaciones: "" });
      setNotice("Lesión registrada en Fase 1.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la lesión.");
    } finally {
      setSaving(false);
    }
  }

  const active = injuries.filter((item) => !item.alta_medica);
  const discharged = injuries.filter((item) => item.alta_medica);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">Salud de la plantilla</p>
          <h1 className="text-2xl font-bold text-gray-900">Lesiones y readaptación</h1>
          <p className="mt-1 text-sm text-gray-600">{active.length} en seguimiento · {discharged.length} altas registradas</p>
        </div>
        <button type="button" onClick={() => { setShowForm((open) => !open); setError(""); }}
          className="rounded bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          {showForm ? "Cerrar registro" : "+ Nueva lesión"}
        </button>
      </header>

      {error && <p role="alert" className="rounded bg-red-100 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded bg-emerald-100 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

      {showForm && <section className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6" aria-label="Registrar lesión">
        <h2 className="mb-5 text-lg font-semibold">Registrar lesión</h2>
        <form onSubmit={createInjury} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">Jugador *
              <select required value={form.id_jugador} onChange={(event) => setForm({ ...form, id_jugador: event.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 bg-white p-2 focus:outline-teal-700">
                <option value="">Selecciona un jugador</option>
                {players.map((player) => <option key={player.id_jugador} value={player.id_jugador}>{player.nombre} {player.apellidos}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">Fecha de inicio *
              <input type="date" required value={form.fecha_inicio} onChange={(event) => setForm({ ...form, fecha_inicio: event.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 p-2 focus:outline-teal-700" />
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Tipo de lesión *
              <input required maxLength={100} value={form.tipo_lesion} onChange={(event) => setForm({ ...form, tipo_lesion: event.target.value })}
                placeholder="Ej. Esguince de tobillo" className="mt-1 block w-full rounded border border-gray-300 p-2 focus:outline-teal-700" />
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">Observaciones
              <textarea rows={3} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                className="mt-1 block w-full rounded border border-gray-300 p-2 focus:outline-teal-700" />
            </label>
            <button type="submit" disabled={saving || !form.zona_corporal} className="self-end rounded bg-teal-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:justify-self-start">
              {saving ? "Guardando..." : "Registrar lesión"}
            </button>
          </div>
          <BodyMap value={form.zona_corporal} onChange={(zone) => setForm((current) => ({ ...current, zona_corporal: zone }))} />
        </form>
      </section>}

      {loading ? <p className="text-sm text-gray-600">Cargando lesiones...</p> : <>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {phases.map((phase, index) => {
            const cards = active.filter((item) => item.fase_readaptacion === phase.key);
            return <section key={phase.key} aria-label={`${phase.key}: ${phase.title}`}
              onDragOver={(event) => { event.preventDefault(); if (dragId !== null) setDropPhase(phase.key); }}
              onDragLeave={() => setDropPhase(null)}
              onDrop={(event) => { event.preventDefault(); setDropPhase(null); const injury = active.find((item) => item.id_lesion === dragId); setDragId(null); if (injury) void changePhase(injury, phase.key); }}
              className={`min-w-0 border-t-4 p-3 ${phase.color} ${dropPhase === phase.key ? "ring-2 ring-teal-600" : ""}`}>
              <div className="mb-4 flex items-start justify-between gap-2">
                <div><span className="text-xs font-bold uppercase text-gray-600">Fase {index + 1} · {phase.detail}</span><h2 className="text-base font-semibold text-gray-900">{phase.title}</h2></div>
                <span className="rounded-full bg-white px-2 py-0.5 text-sm font-semibold text-gray-700">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map((injury) => <article key={injury.id_lesion} draggable={busyId === null}
                  onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDragId(injury.id_lesion); }}
                  onDragEnd={() => { setDragId(null); setDropPhase(null); }}
                  className={`rounded border border-gray-200 bg-white p-3 shadow-sm ${busyId === injury.id_lesion ? "opacity-60" : ""}`}>
                  <Link to={`/jugadores/${injury.id_jugador}`} className="font-semibold text-gray-900 hover:text-teal-700">{injury.jugador.nombre} {injury.jugador.apellidos}</Link>
                  <p className="mt-1 text-sm text-gray-700">{injury.tipo_lesion || "Lesión sin clasificar"}</p>
                  <p className="mt-1 text-xs text-gray-500">{injury.zona_corporal || "Zona sin especificar"} · {injury.fecha_inicio.slice(0, 10)}</p>
                  <div className="mt-3 border-t border-gray-100 pt-2">
                    <label className="text-xs font-medium text-gray-600">Cambiar fase
                      <select aria-label={`Cambiar fase de ${injury.jugador.nombre} ${injury.jugador.apellidos}`} value={injury.fase_readaptacion}
                        disabled={busyId !== null} onChange={(event) => void changePhase(injury, event.target.value)}
                        className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800">
                        {phases.map((option) => <option key={option.key} value={option.key}>{option.key} · {option.title}</option>)}
                        {injury.fase_readaptacion === "Fase 4" && <option value="Alta Médica">Alta Médica</option>}
                      </select>
                    </label>
                  </div>
                </article>)}
                {!cards.length && <p className="py-6 text-center text-xs text-gray-500">Sin deportistas en esta fase</p>}
              </div>
            </section>;
          })}
        </div>
        {discharged.length > 0 && <section className="border-t border-gray-200 pt-5">
          <h2 className="mb-3 text-base font-semibold text-gray-800">Altas médicas recientes</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{discharged.slice(0, 8).map((injury) =>
            <div key={injury.id_lesion} className="border-l-2 border-emerald-500 bg-white px-3 py-2 text-sm">
              <Link to={`/jugadores/${injury.id_jugador}`} className="font-semibold hover:text-teal-700">{injury.jugador.nombre} {injury.jugador.apellidos}</Link>
              <p className="text-xs text-gray-500">{injury.tipo_lesion} · {injury.fecha_alta_real?.slice(0, 10) ?? "Sin fecha"}</p>
            </div>)}</div>
        </section>}
      </>}
    </div>
  );
}