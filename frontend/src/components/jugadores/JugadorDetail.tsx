import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import type { AuthUser } from "../services/auth.service";
import Button from "../ui/button";
import LinkButton from "../ui/LinkButton";

type TeamAssignment = {
  id_jugador_equipo: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  dorsal: number | null;
  activo: boolean;
  equipo: {
    id_equipo: number;
    nombre: string;
    categoria: { nombre: string } | null;
    temporada: { nombre: string };
  };
};

type Measurement = {
  id_medicion: number;
  fecha: string;
  peso_kg: number;
  talla_cm: number;
  sumatoria_6_pliegues: number | null;
  porcentaje_grasa: number | null;
  somatotipo_endomorfia: number | null;
  somatotipo_mesomorfia: number | null;
  somatotipo_ectomorfia: number | null;
  evaluador: { id_usuario: number; nombre: string };
};

type Injury = {
  id_lesion: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo_lesion: string | null;
  zona_corporal: string | null;
  gravedad: string | null;
  alta_medica: boolean;
  observaciones: string | null;
};

type PlayerDetail = {
  id_jugador: number;
  dni: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  foto: string | null;
  jugador_equipo: TeamAssignment[];
  medicion_antropometrica: Measurement[];
  lesion: Injury[];
};

const API_ORIGIN = "http://localhost:3000";

function formatDate(value: string | null) {
  if (!value) return "Actualidad";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getUTCMonth() ||
    (today.getMonth() === birthDate.getUTCMonth() && today.getDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function resolvePhoto(photo: string | null) {
  if (!photo) return null;
  return photo.startsWith("/uploads/") ? `${API_ORIGIN}${photo}` : photo;
}

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="border-l-2 border-emerald-500 pl-3">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-950">{value}{unit && <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>}</p>
    </div>
  );
}

export default function JugadorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const playerId = Number(id);
  const fileInput = useRef<HTMLInputElement>(null);
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? JSON.parse(rawUser) as AuthUser : null;
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState("");

  const loadPlayer = async () => {
    try {
      const response = await jugadoresService.getById(playerId);
      if (response?.statusCode && response.statusCode >= 400) {
        throw new Error(response.message ?? "No se pudo cargar el jugador.");
      }
      setPlayer(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el jugador.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(playerId) || playerId < 1) {
      setError("El identificador del jugador no es válido.");
      setLoading(false);
      return;
    }
    void loadPlayer();
  }, [playerId]);

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo) return;
    setUploading(true);
    setError("");
    try {
      const response = await jugadoresService.uploadPhoto(playerId, photo);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "No se pudo subir la foto.");
      }
      setImageFailed(false);
      await loadPlayer();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading) return <p className="text-gray-600">Cargando ficha del jugador…</p>;
  if (!player) return <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">{error || "Jugador no encontrado."}</p>;

  const currentTeams = player.jugador_equipo.filter((assignment) => assignment.activo);
  const previousTeams = player.jugador_equipo.filter((assignment) => !assignment.activo);
  const latestMeasurement = player.medicion_antropometrica[0];
  const activeInjuries = player.lesion.filter((injury) => !injury.alta_medica);
  const photoUrl = resolvePhoto(player.foto);
  const initials = `${player.nombre.charAt(0)}${player.apellidos.charAt(0)}`.toUpperCase();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && <p role="alert" className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <header className="overflow-hidden rounded-lg border border-panel-border bg-white shadow-panel">
        <div className="h-24 bg-gray-950" />
        <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
          <div className="-mt-14 h-32 w-32 shrink-0 overflow-hidden rounded-lg border-4 border-white bg-emerald-700 shadow-panel">
            {photoUrl && !imageFailed ? (
              <img src={photoUrl} alt={`${player.nombre} ${player.apellidos}`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-semibold text-white">{initials}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase text-emerald-700">Ficha de jugador</p>
            <h1 className="break-words text-3xl font-semibold text-gray-950">{player.nombre} {player.apellidos}</h1>
            <p className="mt-1 text-sm text-gray-500">DNI {player.dni} · {calculateAge(player.fecha_nacimiento)} años</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.role === "admin" && (
              <>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
                <Button color="light" onClick={() => fileInput.current?.click()}>{uploading ? "Subiendo…" : "Cambiar foto"}</Button>
                <LinkButton color="light" to={`/jugadores/editar/${player.id_jugador}`}>Editar</LinkButton>
              </>
            )}
            <LinkButton to={`/mediciones-antropometricas/crear?jugador=${player.id_jugador}`}>Nueva medición</LinkButton>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Situación deportiva</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentTeams.length ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>{currentTeams.length ? "En activo" : "Sin equipo"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentTeams.map((assignment) => (
                <article key={assignment.id_jugador_equipo} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-gray-950">{assignment.equipo.nombre}</p>
                  <p className="mt-1 text-sm text-gray-600">{assignment.equipo.categoria?.nombre ?? "Sin categoría"} · {assignment.equipo.temporada.nombre}</p>
                  <p className="mt-3 text-sm text-gray-600">Dorsal: <strong>{assignment.dorsal ?? "Sin asignar"}</strong></p>
                </article>
              ))}
              {!currentTeams.length && <p className="text-sm text-gray-500">El jugador no está asignado a un equipo activo.</p>}
            </div>
            {previousTeams.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-5">
                <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Historial de equipos</h3>
                <div className="space-y-3">
                  {previousTeams.map((assignment) => (
                    <div key={assignment.id_jugador_equipo} className="flex flex-col justify-between gap-1 text-sm sm:flex-row">
                      <span className="font-medium text-gray-800">{assignment.equipo.nombre}</span>
                      <span className="text-gray-500">{formatDate(assignment.fecha_inicio)} – {formatDate(assignment.fecha_fin)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-5 text-xl font-semibold">Evolución antropométrica</h2>
            {latestMeasurement ? (
              <>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <Stat label="Peso" value={latestMeasurement.peso_kg.toFixed(1)} unit="kg" />
                  <Stat label="Talla" value={latestMeasurement.talla_cm.toFixed(1)} unit="cm" />
                  <Stat label="Grasa" value={latestMeasurement.porcentaje_grasa?.toFixed(1) ?? "—"} unit={latestMeasurement.porcentaje_grasa != null ? "%" : undefined} />
                  <Stat label="Σ 6 pliegues" value={latestMeasurement.sumatoria_6_pliegues?.toFixed(1) ?? "—"} unit={latestMeasurement.sumatoria_6_pliegues != null ? "mm" : undefined} />
                </div>
                <p className="mt-5 text-xs text-gray-500">Última medición: {formatDate(latestMeasurement.fecha)} · Evaluador: {latestMeasurement.evaluador.nombre}</p>
                {player.medicion_antropometrica.length > 1 && (
                  <div className="mt-5 overflow-x-auto border-t border-gray-200 pt-4">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-xs uppercase text-gray-500"><tr><th className="pb-2">Fecha</th><th className="pb-2">Peso</th><th className="pb-2">Grasa</th><th className="pb-2">Somatotipo</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {player.medicion_antropometrica.slice(1).map((measurement) => (
                          <tr key={measurement.id_medicion}><td className="py-3">{formatDate(measurement.fecha)}</td><td>{measurement.peso_kg.toFixed(1)} kg</td><td>{measurement.porcentaje_grasa?.toFixed(1) ?? "—"}%</td><td>{[measurement.somatotipo_endomorfia, measurement.somatotipo_mesomorfia, measurement.somatotipo_ectomorfia].map((value) => value?.toFixed(1) ?? "—").join(" · ")}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : <p className="text-sm text-gray-500">Todavía no hay evaluaciones antropométricas.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-4 text-lg font-semibold">Datos personales</h2>
            <dl className="space-y-4 text-sm">
              <div><dt className="text-gray-500">Nombre completo</dt><dd className="font-medium text-gray-900">{player.nombre} {player.apellidos}</dd></div>
              <div><dt className="text-gray-500">DNI</dt><dd className="font-medium text-gray-900">{player.dni}</dd></div>
              <div><dt className="text-gray-500">Fecha de nacimiento</dt><dd className="font-medium text-gray-900">{formatDate(player.fecha_nacimiento)}</dd></div>
              <div><dt className="text-gray-500">Edad</dt><dd className="font-medium text-gray-900">{calculateAge(player.fecha_nacimiento)} años</dd></div>
            </dl>
          </section>

          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Estado médico</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${activeInjuries.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{activeInjuries.length ? `${activeInjuries.length} activa(s)` : "Sin lesiones activas"}</span>
            </div>
            <div className="space-y-4">
              {player.lesion.slice(0, 4).map((injury) => (
                <article key={injury.id_lesion} className="border-l-2 border-gray-300 pl-3 text-sm">
                  <p className="font-medium text-gray-900">{injury.tipo_lesion ?? "Lesión sin clasificar"}</p>
                  <p className="text-gray-500">{injury.zona_corporal ?? "Zona no indicada"} · {injury.gravedad ?? "Gravedad no indicada"}</p>
                  <p className="mt-1 text-xs text-gray-400">Desde {formatDate(injury.fecha_inicio)}</p>
                </article>
              ))}
              {!player.lesion.length && <p className="text-sm text-gray-500">No hay lesiones registradas.</p>}
            </div>
          </section>
        </aside>
      </div>

      <div><Button color="light" onClick={() => navigate("/jugadores")}>Volver al listado</Button></div>
    </div>
  );
}