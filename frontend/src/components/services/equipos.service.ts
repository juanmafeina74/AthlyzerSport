const API = "http://localhost:3000/api/equipos";
import { authHeaders } from "./auth.service";
import { toApiError } from "./apiError";

export type ProtocoloAntropometrico = "BASICA" | "ISAK";

export type Equipo = {
  id_equipo: number;
  id_temporada: number;
  id_categoria: number | null;
  nombre: string;
  protocolo_antropometrico: ProtocoloAntropometrico;
  version_protocolo_antropometrico: number;
  categoria?: { nombre: string } | null;
};

export default {
  getAll: async () => {
    const response = await fetch(API, { headers: authHeaders() });
    if (!response.ok) throw new Error("No se pudieron cargar los equipos.");
    return response.json();
  },
  getById: async (id: number): Promise<Equipo> => {
    const response = await fetch(`${API}/${id}`, { headers: authHeaders() });
    if (!response.ok) throw await toApiError(response, "No se pudo cargar el equipo.");
    return response.json();
  },
  create: async (data: any) =>
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    }),
  update: async (id: number, data: any) =>
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    }),
  delete: async (id: number) =>
    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
};
