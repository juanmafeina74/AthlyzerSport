import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../ui/card";
import Button from "../ui/button";
import equiposService from "../services/equipos.service";
import jugadorEquipoService, { Jugador, PlantillaEntry } from "../services/jugadorEquipo.service";

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
}

function JugadorMiniCard({ seleccionado, onToggle, titulo, subtitulo }: JugadorMiniCardProps) {
  return (
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
  const [seleccionDisponibles, setSeleccionDisponibles] = useState<number[]>([]);
  const [seleccionPlantilla, setSeleccionPlantilla] = useState<number[]>([]);
  const [error, setError] = useState("");

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
                onToggle={() =>
                  setSeleccionPlantilla((actual) => toggleSeleccion(actual, entry.id_jugador))
                }
                titulo={`${entry.jugador.apellidos}, ${entry.jugador.nombre}`}
                subtitulo={entry.dorsal ? `Dorsal #${entry.dorsal}` : "Sin dorsal asignado"}
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
