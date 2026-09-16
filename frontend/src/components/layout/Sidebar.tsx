export function Sidebar() {
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  return (
    <aside className="w-64 bg-brand-dark text-white p-6 space-y-6">
      <h2 className="text-xl font-semibold">AthLyzer Sports Train</h2>
      {user && <p className="text-sm text-gray-300">{user.role}</p>}

      <nav className="space-y-4">
        {user?.role === "admin" && (
          <>
            <a className="block hover:text-brand-accent" href="/equipos">Equipos</a>
            <a className="block hover:text-brand-accent" href="/jugadores">Jugadores</a>
            <a className="block hover:text-brand-accent" href="/temporadas">Temporadas</a>
            <a className="block hover:text-brand-accent" href="/admin">Administración</a>
          </>
        )}
        {user?.role === "usuario" && (
          <>
            <a className="block hover:text-brand-accent" href="/equipos">Equipos</a>
            <a className="block hover:text-brand-accent" href="/jugadores">Jugadores</a>
            <a className="block hover:text-brand-accent" href="/temporadas">Temporadas</a>
          </>
        )}
        {user?.role === "jugador" && (
          <a className="block hover:text-brand-accent" href="/dashboard">Mi progreso</a>
        )}
      </nav>
    </aside>
  );
}
