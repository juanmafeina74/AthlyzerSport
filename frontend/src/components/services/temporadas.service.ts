const API = "http://localhost:3000/api/temporadas";
import { authHeaders } from "./auth.service";

export default {
  getAll: async () => {
    const response = await fetch(API, { headers: authHeaders() });
    if (!response.ok) throw new Error("No se pudieron cargar las temporadas.");
    return response.json();
  },
  getById: async (id: number) => (await fetch(`${API}/${id}`, { headers: authHeaders() })).json(),
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
