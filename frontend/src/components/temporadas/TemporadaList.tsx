import { useEffect, useState } from "react";
import temporadasService from "../services/temporadas.service";
import Card from "../ui/card";
import LinkButton from "../ui/LinkButton";

export default function TemporadaList() {
  const [temporadas, setTemporadas] = useState<any[]>([]);

  useEffect(() => {
    temporadasService.getAll().then(setTemporadas);
  }, []);

  return (
    <Card title="Temporadas" description="Gestiona temporadas, fechas y estado operativo.">
      <div className="flex justify-end">
        <LinkButton to="/temporadas/crear">
          Crear temporada
        </LinkButton>
      </div>

      <div className="space-y-3">
        {temporadas.map((t: any) => (
          <div key={t.id_temporada} className="flex flex-col gap-4 rounded-lg border border-panel-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-gray-900">{t.nombre}</p>
              <p className="text-sm text-gray-600">Estado: {t.estado}</p>
            </div>

            <div className="flex gap-3">
              <LinkButton color="light" to={`/temporadas/editar/${t.id_temporada}`}>Editar</LinkButton>
              <LinkButton color="danger" to={`/temporadas/borrar/${t.id_temporada}`}>Borrar</LinkButton>
            </div>
          </div>
        ))}

        {temporadas.length === 0 && <p className="text-gray-600">No hay temporadas registradas.</p>}
      </div>
    </Card>
  );
}
