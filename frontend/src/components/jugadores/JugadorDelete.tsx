import { useNavigate, useParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function JugadorDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const jugadorId = Number(id);

  const handleDelete = async () => {
    await jugadoresService.delete(jugadorId);
    navigate("/jugadores");
  };

  return (
    <Card title="Eliminar jugador" description="Esta acción eliminará el jugador seleccionado.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar este jugador?</p>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
