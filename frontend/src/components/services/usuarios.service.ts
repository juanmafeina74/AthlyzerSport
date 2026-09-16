import { authHeaders } from "./auth.service";

const API = "http://localhost:3000/api/usuarios";

export type Usuario = {
  id_usuario: number;
  nombre: string;
  email: string;
  activo: boolean;
  id_rol: number;
  role: "admin" | "usuario" | "jugador";
};

export type Rol = {
  id_rol: number;
  nombre: "admin" | "usuario" | "jugador";
};

export default {
  getAll: async (): Promise<Usuario[]> => (await fetch(API, { headers: authHeaders() })).json(),
  getById: async (id: number): Promise<Usuario> =>
    (await fetch(`${API}/${id}`, { headers: authHeaders() })).json(),
  getRoles: async (): Promise<Rol[]> =>
    (await fetch(`${API}/roles`, { headers: authHeaders() })).json(),
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
