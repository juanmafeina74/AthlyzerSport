export function Sidebar() {
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  return (
    <aside className="w-full shrink-0 space-y-3 bg-brand-dark p-4 text-white md:w-64 md:space-y-6 md:p-6">
      <h2 className="text-lg font-semibold md:text-xl">AthLyzer Sports Train</h2>

      <nav className="flex gap-2 overflow-x-auto pb-1 text-sm md:block md:space-y-4 md:overflow-visible md:pb-0 md:text-base">
        <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/dashboard">Panel diario</a>
        {user?.role === "admin" && (
          <>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/equipos">Equipos</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/categorias">Categorías</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/jugadores">Jugadores</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/mediciones-antropometricas/crear">Antropometría</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/lesiones">Lesiones y Reath</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/temporadas">Temporadas</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/admin">Administración</a>
          </>
        )}
        {user?.role === "usuario" && (
          <>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/equipos">Equipos</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/jugadores">Jugadores</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/mediciones-antropometricas/crear">Antropometría</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/lesiones">Lesiones y Reath</a>
            <a className="block whitespace-nowrap rounded px-2 py-1 hover:bg-white/10 hover:text-brand-accent md:px-0" href="/temporadas">Temporadas</a>
          </>
        )}
      </nav>
    </aside>
  );
}
