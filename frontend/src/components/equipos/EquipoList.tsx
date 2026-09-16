import { useEffect, useState } from "react";
import equiposService from "../services/equipos.service";
import Card from "../ui/card";
import LinkButton from "../ui/LinkButton";

export default function EquipoList() {
  const [equipos, setEquipos] = useState([]);

  useEffect(() => {
    equiposService.getAll().then(setEquipos);
  }, []);

  return (
    <Card title="Equipos" description="Gestiona los equipos disponibles por temporada.">
      <div className="flex justify-end">
        <LinkButton to="/equipos/crear">
          Crear equipo
        </LinkButton>
      </div>

      <div className="space-y-3">
        {equipos.map((eq: any) => (
          <div key={eq.id_equipo} className="flex flex-col gap-4 rounded-lg border border-panel-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-gray-900">{eq.nombre}</p>
              {eq.categoria && <p className="text-sm text-gray-600">Categoría: {eq.categoria.nombre}</p>}
            </div>

            <div className="flex gap-3">
              <LinkButton color="light" to={`/equipos/editar/${eq.id_equipo}`}>Editar</LinkButton>
              <LinkButton color="danger" to={`/equipos/borrar/${eq.id_equipo}`}>Borrar</LinkButton>
            </div>
          </div>
        ))}

        {equipos.length === 0 && <p className="text-gray-600">No hay equipos registrados.</p>}
      </div>
    </Card>
  );
}
