const API = "http://localhost:3000/api/auth";

export type AuthUser = {
  id_usuario: number;
  nombre: string;
  email: string;
  role: "admin" | "usuario" | "jugador";
  activo: boolean;
  accessToken: string;
};

export function authHeaders(): Record<string, string> {
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? (JSON.parse(rawUser) as Partial<AuthUser>) : null;

  return user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "No se pudo iniciar sesión." }));
    throw new Error(body.message ?? body.error ?? "No se pudo iniciar sesión.");
  }

  return response.json();
}
