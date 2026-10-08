import { authHeaders } from "./auth.service";

const API = "http://localhost:3000/api/posiciones";

export type Posicion = {
  id_posicion: number;
  nombre: string;
  abreviatura: string | null;
};

export type PosicionInput = {
  nombre: string;
  abreviatura?: string | null;
};

async function getAll(): Promise<Posicion[]> {
  const response = await fetch(API, { headers: authHeaders() });
  if (!response.ok) throw new Error("No se pudo cargar el catálogo de posiciones.");
  return response.json();
}

function create(data: PosicionInput) {
  return fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

function update(id: number, data: PosicionInput) {
  return fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

function remove(id: number) {
  return fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
}

export default { getAll, create, update, remove };