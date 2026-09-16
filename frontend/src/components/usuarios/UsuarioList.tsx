import { useEffect, useState } from "react";
import usuariosService, { Usuario } from "../services/usuarios.service";
import Card from "../ui/card";
import LinkButton from "../ui/LinkButton";

const roleStyles: Record<Usuario["role"], string> = {
  admin: "bg-blue-100 text-blue-800",
  usuario: "bg-amber-100 text-amber-800",
  jugador: "bg-indigo-100 text-indigo-800",
};

const roleLabels: Record<Usuario["role"], string> = {
  admin: "Administrador",
  usuario: "Usuario",
  jugador: "Jugador",
};

export default function UsuarioList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    usuariosService.getAll().then(setUsuarios);
  }, []);

  return (
    <Card title="Usuarios" description="Gestiona accesos, roles y estado de los usuarios.">
      <div className="flex justify-end">
        <LinkButton to="/usuarios/crear">Crear usuario</LinkButton>
      </div>

      <div className="space-y-3">
        {usuarios.map((usuario) => (
          <div key={usuario.id_usuario} className="flex flex-col gap-4 rounded-lg border border-panel-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{usuario.nombre}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[usuario.role]}`}>
                  {roleLabels[usuario.role]}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${usuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {usuario.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-sm text-gray-600">{usuario.email}</p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex gap-3">
                <LinkButton color="light" to={`/usuarios/editar/${usuario.id_usuario}`}>Editar</LinkButton>
                <LinkButton color="danger" to={`/usuarios/borrar/${usuario.id_usuario}`}>Borrar</LinkButton>
              </div>
            </div>
          </div>
        ))}

        {usuarios.length === 0 && <p className="text-gray-600">No hay usuarios registrados.</p>}
      </div>
    </Card>
  );
}
