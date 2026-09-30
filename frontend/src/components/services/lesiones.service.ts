import { authHeaders } from "./auth.service";

const API = "http://localhost:3000/api/lesiones";

export type Lesion = {
  id_lesion: number;
  id_jugador: number;
  fecha_inicio: string;
  tipo_lesion: string | null;
  zona_corporal: string | null;
  fase_readaptacion: string;
  alta_medica: boolean;
  fecha_alta_real: string | null;
  observaciones: string | null;
  jugador: { id_jugador: number; nombre: string; apellidos: string; foto: string | null };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(Array.isArray(body.message) ? body.message.join(". ") : body.message ?? "No se pudo completar la operación.");
  }
  return body as T;
}

export const lesionesService = {
  list: async () => parseResponse<Lesion[]>(await fetch(API, { headers: authHeaders() })),
  create: async (data: { id_jugador: number; fecha_inicio: string; tipo_lesion: string; zona_corporal: string; observaciones?: string }) =>
    parseResponse<Lesion>(await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    })),
  changePhase: async (id: number, fase: string) =>
    parseResponse<Lesion>(await fetch(`${API}/${id}/fase`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ fase }),
    })),
};