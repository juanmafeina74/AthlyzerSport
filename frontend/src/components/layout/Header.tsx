import Button from "../ui/button";

const roleStyles: Record<string, string> = {
  admin: "text-blue-800",
  usuario: "text-amber-800",
  jugador: "text-indigo-800",
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  usuario: "Usuario",
  jugador: "Jugador",
};

export function Header() {
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const logout = () => {
    localStorage.removeItem("athlyzer_user");
    window.location.href = "/login";
  };

  return (
    <header className="bg-white shadow-panel px-6 py-4 flex justify-end items-center gap-4">
      <div className="text-right">
        <p className="text-gray-700 font-medium">{user?.nombre ?? "Invitado"}</p>
        {user?.role && (
          <p className={`text-xs font-medium ${roleStyles[user.role] ?? "text-gray-500"}`}>
            ({roleLabels[user.role] ?? user.role})
          </p>
        )}
      </div>
      <Button color="danger" onClick={logout}>
        Salir
      </Button>
    </header>
  );
}
