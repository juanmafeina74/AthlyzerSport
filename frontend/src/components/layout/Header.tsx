import Button from "../ui/button";

export function Header() {
  const rawUser = localStorage.getItem("athlyzer_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const logout = () => {
    localStorage.removeItem("athlyzer_user");
    window.location.href = "/login";
  };

  return (
    <header className="bg-white shadow-panel px-6 py-4 flex justify-end items-center gap-4">
      <span className="text-gray-700 font-medium">{user?.nombre ?? "Invitado"}</span>
      <Button color="danger" onClick={logout}>
        Salir
      </Button>
    </header>
  );
}
