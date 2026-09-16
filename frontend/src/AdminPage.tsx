import { Card } from "./components/ui/card";
import LinkButton from "./components/ui/LinkButton";

export default function AdminPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <Card
        title="Equipos"
        description="Gestiona todos los equipos del sistema."
      >
        <LinkButton color="black" to="/equipos">Ir a equipos</LinkButton>
      </Card>

      <Card
        title="Jugadores"
        description="Gestiona jugadores y su información."
      >
        <LinkButton color="black" to="/jugadores">Ir a jugadores</LinkButton>
      </Card>

      <Card
        title="Usuarios"
        description="Gestiona accesos, roles y estado de usuarios."
      >
        <LinkButton color="black" to="/usuarios">Ir a usuarios</LinkButton>
      </Card>

      <Card
        title="Planes"
        description="Gestiona planes, fases y días."
      >
        <div className="space-x-3">
          <LinkButton color="blue" to="/dashboard">Gestionar planes</LinkButton>
          <LinkButton color="black" to="/dashboard">Asignar planes</LinkButton>
        </div>
      </Card>
    </div>
  );
}
