export type AuthRole = 'admin' | 'usuario' | 'jugador';

export type JwtUser = {
  id_usuario: number;
  email: string;
  role: AuthRole;
};
