import { useNavigate, useParams } from "react-router-dom";
import equiposService from "../services/equipos.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function EquipoDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipoId = Number(id);

  const handleDelete = async () => {
    await equiposService.delete(equipoId);
    navigate("/equipos");
  };

  return (
    <Card title="Eliminar equipo" description="Esta acción eliminará el equipo seleccionado.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar este equipo?</p>
      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
