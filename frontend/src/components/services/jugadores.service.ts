const API = "http://localhost:3000/api/jugadores";
import { authHeaders } from "./auth.service";

export default {
  getAll: async () => (await fetch(API, { headers: authHeaders() })).json(),

  getById: async (id: number) =>
    (await fetch(`${API}/${id}`, { headers: authHeaders() })).json(),

  uploadPhoto: async (id: number, photo: File) => {
    const data = new FormData();
    data.append("foto", photo);
    return fetch(`${API}/${id}/foto`, {
      method: "POST",
      headers: authHeaders(),
      body: data,
    });
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
