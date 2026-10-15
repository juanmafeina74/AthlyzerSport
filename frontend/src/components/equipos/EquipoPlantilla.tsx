import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../ui/card";
import Button from "../ui/button";
import equiposService from "../services/equipos.service";
import jugadorEquipoService, { Jugador, PlantillaEntry } from "../services/jugadorEquipo.service";
import posicionesService, { type Posicion } from "../services/posiciones.service";

function toggleSeleccion(seleccion: number[], id: number) {
  return seleccion.includes(id)
    ? seleccion.filter((value) => value !== id)
    : [...seleccion, id];
}

interface JugadorMiniCardProps {
  seleccionado: boolean;
  onToggle: () => void;
  titulo: string;
  subtitulo: string;
  positionSelect?: { value: string; options: Posicion[]; onChange: (value: string) => void; disabled: boolean };
}

function JugadorMiniCard({ seleccionado, onToggle, titulo, subtitulo, positionSelect }: JugadorMiniCardProps) {
  return (
    <div className="space-y-2">
      <Button
        unstyled
        type="button"
        onClick={onToggle}
        className={`w-full rounded-lg border px-3 py-2 text-left shadow-soft transition-colors ${
          seleccionado
            ? "border-brand-primary bg-blue-50"
            : "border-panel-border bg-white hover:bg-gray-50"
        }`}
      >
        <p className="font-medium text-gray-900">{titulo}</p>
        <p className="text-sm text-gray-600">{subtitulo}</p>
      </Button>
      {positionSelect && <label className="block px-1 text-xs font-medium text-gray-600">
        Posición en este equipo
        <select value={positionSelect.value} disabled={positionSelect.disabled}
          onChange={(event) => positionSelect.onChange(event.target.value)}
          aria-label={`Posición en este equipo para ${titulo}`}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 disabled:bg-gray-100">
          <option value="">Sin asignar</option>
          {positionSelect.options.map((position) => <option key={position.id_posicion} value={position.id_posicion}>{position.nombre}</option>)}
        </select>
      </label>}
    </div>
  );
}

export default function EquipoPlantilla() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipoId = Number(id);

  const [equipoNombre, setEquipoNombre] = useState("");
  const [search, setSearch] = useState("");
  const [disponibles, setDisponibles] = useState<Jugador[]>([]);
  const [plantilla, setPlantilla] = useState<PlantillaEntry[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [seleccionDisponibles, setSeleccionDisponibles] = useState<number[]>([]);
  const [seleccionPlantilla, setSeleccionPlantilla] = useState<number[]>([]);
  const [error, setError] = useState("");
  const rawUser = localStorage.getItem("athlyzer_user");
  const isAdmin = (rawUser ? JSON.parse(rawUser) as { role?: string } : null)?.role === "admin";

  const cargarDatos = useCallback(async () => {
    const [nuevosDisponibles, nuevaPlantilla] = await Promise.all([
      jugadorEquipoService.getDisponibles(equipoId, search),
      jugadorEquipoService.getPlantilla(equipoId),
    ]);
    setDisponibles(nuevosDisponibles);
    setPlantilla(nuevaPlantilla);
  }, [equipoId, search]);

  useEffect(() => {
    equiposService.getById(equipoId)
      .then((eq) => setEquipoNombre(eq.nombre))
      .catch((cause: Error) => setError(cause.message));
  }, [equipoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    posicionesService.getAll().then(setPosiciones).catch((cause: Error) => setError(cause.message));
  }, []);

  const handleAsignar = async () => {
    if (seleccionDisponibles.length === 0) return;
    setError("");
    const response = await jugadorEquipoService.bulkAssign(equipoId, seleccionDisponibles);

    if (response.ok) {
      setSeleccionDisponibles([]);
      await cargarDatos();
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "No se pudieron añadir los jugadores seleccionados.");
    }
  };

  const handleQuitar = async () => {
    if (seleccionPlantilla.length === 0) return;
    setError("");
    const response = await jugadorEquipoService.bulkRemove(equipoId, seleccionPlantilla);

    if (response.ok) {
      setSeleccionPlantilla([]);
      await cargarDatos();
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "No se pudieron quitar los jugadores seleccionados.");
    }
  };

  const cambiarPosicion = async (idJugador: number, value: string) => {
    setError("");
    const response = await jugadorEquipoService.updatePosition(equipoId, idJugador, value ? Number(value) : null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "No se pudo actualizar la posición del jugador.");
      return;
    }
    const updated = await response.json();
    setPlantilla((current) => current.map((entry) => entry.id_jugador === idJugador
      ? { ...entry, posicion: updated.posicion }
      : entry));
  };

  return (
    <Card
      title={`Plantilla de ${equipoNombre || "equipo"}`}
      description="Toca uno o varios jugadores en cada columna para seleccionarlos y usa las flechas para moverlos."
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellidos o DNI..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-primary md:max-w-sm"
        />
      </div>

      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}
      {isAdmin && posiciones.length === 0 && <p className="text-sm text-gray-600">El catálogo está vacío. <a className="font-semibold text-brand-primary underline" href="/posiciones">Añadir posiciones</a></p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-700">
            Jugadores disponibles ({disponibles.length})
          </label>
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-panel-border bg-panel-bg p-2">
            {disponibles.map((jugador) => (
              <JugadorMiniCard
                key={jugador.id_jugador}
                seleccionado={seleccionDisponibles.includes(jugador.id_jugador)}
                onToggle={() =>
                  setSeleccionDisponibles((actual) => toggleSeleccion(actual, jugador.id_jugador))
                }
                titulo={`${jugador.apellidos}, ${jugador.nombre}`}
                subtitulo={`DNI ${jugador.dni}`}
              />
            ))}

            {disponibles.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-gray-500">
                No hay jugadores disponibles.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-row justify-center gap-3 md:flex-col">
          <Button color="primary" onClick={handleAsignar}>
            Añadir →
          </Button>
          <Button color="light" onClick={handleQuitar}>
            ← Quitar
          </Button>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-700">
            Plantilla del equipo ({plantilla.length})
          </label>
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-panel-border bg-panel-bg p-2">
            {plantilla.map((entry) => (
              <JugadorMiniCard
                key={entry.id_jugador_equipo}
                seleccionado={seleccionPlantilla.includes(entry.id_jugador)}
                onToggle={() => setSeleccionPlantilla((actual) => toggleSeleccion(actual, entry.id_jugador))}
                titulo={`${entry.jugador.apellidos}, ${entry.jugador.nombre}`}
                subtitulo={`${entry.dorsal ? `Dorsal #${entry.dorsal}` : "Sin dorsal asignado"} · Preferida: ${entry.jugador.posicion_preferida?.nombre ?? "Sin definir"}`}
                positionSelect={{
                  value: entry.posicion ? String(entry.posicion.id_posicion) : "",
                  options: posiciones,
                  onChange: (value) => void cambiarPosicion(entry.id_jugador, value),
                  disabled: !isAdmin || posiciones.length === 0,
                }}
              />
            ))}

            {plantilla.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-gray-500">
                Esta plantilla todavía no tiene jugadores.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate("/equipos")}>Volver</Button>
      </div>
    </Card>
  );
}
