const API = "http://localhost:3000/api/equipos";
import { authHeaders } from "./auth.service";

export type Jugador = {
  id_jugador: number;
  dni: string;
  nombre: string;
  apellidos: string;
};

export type PlantillaEntry = {
  id_jugador_equipo: number;
  id_jugador: number;
  dorsal: number | null;
  fecha_inicio: string;
  jugador: Jugador;
};

export default {
  getDisponibles: async (idEquipo: number, search: string) => {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const response = await fetch(`${API}/${idEquipo}/plantilla/disponibles${query}`, {
      headers: authHeaders(),
    });
    return (await response.json()) as Jugador[];
  },

  getPlantilla: async (idEquipo: number) => {
    const response = await fetch(`${API}/${idEquipo}/plantilla`, { headers: authHeaders() });
    if (!response.ok) throw new Error("No se pudo cargar la plantilla del equipo.");
    return (await response.json()) as PlantillaEntry[];
  },

  bulkAssign: (idEquipo: number, idJugadores: number[]) =>
    fetch(`${API}/${idEquipo}/plantilla/bulk-assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id_jugadores: idJugadores }),
    }),

  bulkRemove: (idEquipo: number, idJugadores: number[]) =>
    fetch(`${API}/${idEquipo}/plantilla/bulk-remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id_jugadores: idJugadores }),
    }),
};
