import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import Card from "../ui/card";
import LinkButton from "../ui/LinkButton";

export default function JugadorList() {
  const navigate = useNavigate();
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    jugadoresService.getAll().then(setJugadores);
  }, []);

  return (
    <Card title="Jugadores" description="Gestiona jugadores y su información deportiva.">
      <div className="flex justify-end">
        <LinkButton to="/jugadores/crear">
          Crear jugador
        </LinkButton>
      </div>

      <div className="space-y-3">
        {jugadores.map((jug: any) => (
          <div
            key={jug.id_jugador}
            role="link"
            tabIndex={0}
            title="Abrir ficha del jugador"
            onDoubleClick={(event) => {
              if (!(event.target as HTMLElement).closest("a, button")) navigate(`/jugadores/${jug.id_jugador}`);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate(`/jugadores/${jug.id_jugador}`);
            }}
            className="flex cursor-pointer flex-col gap-4 rounded-lg border border-panel-border bg-white p-4 shadow-soft outline-none transition-colors hover:border-emerald-300 focus:ring-2 focus:ring-brand-primary md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900">{jug.nombre} {jug.apellidos}</p>
              <p className="text-sm text-gray-600">DNI: {jug.dni}</p>
            </div>

            <div className="flex gap-3">
              <LinkButton color="light" to={`/jugadores/${jug.id_jugador}`}>Ficha</LinkButton>
              <LinkButton color="primary" to={`/mediciones-antropometricas/crear?jugador=${jug.id_jugador}`}>Medición</LinkButton>
              <LinkButton color="light" to={`/jugadores/editar/${jug.id_jugador}`}>Editar</LinkButton>
              <LinkButton color="danger" to={`/jugadores/borrar/${jug.id_jugador}`}>Borrar</LinkButton>
            </div>
          </div>
        ))}

        {jugadores.length === 0 && <p className="text-gray-600">No hay jugadores registrados.</p>}
      </div>
    </Card>
  );
}
