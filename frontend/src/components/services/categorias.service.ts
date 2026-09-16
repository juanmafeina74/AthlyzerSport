import { authHeaders } from "./auth.service";

const API = "http://localhost:3000/api/categorias";

export type Categoria = {
  id_categoria: number;
  nombre: string;
  activo: boolean;
};

export default {
  getAll: async (): Promise<Categoria[]> => (await fetch(API, { headers: authHeaders() })).json(),
  getActive: async (): Promise<Categoria[]> =>
    (await fetch(`${API}/activas`, { headers: authHeaders() })).json(),
  getById: async (id: number): Promise<Categoria> =>
    (await fetch(`${API}/${id}`, { headers: authHeaders() })).json(),
  create: async (data: { nombre: string; activo: boolean }) =>
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    }),
  update: async (id: number, data: { nombre: string; activo: boolean }) =>
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
