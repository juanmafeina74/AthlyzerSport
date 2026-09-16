import { useNavigate, useParams } from "react-router-dom";
import temporadasService from "../services/temporadas.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function TemporadaDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const temporadaId = Number(id);

  const handleDelete = async () => {
    const response = await temporadasService.delete(temporadaId);
    if (response.ok) {
      navigate("/temporadas");
    } else {
      alert("No se pudo eliminar la temporada");
    }
  };

  return (
    <Card title="Eliminar temporada" description="Esta acción eliminará la temporada seleccionada.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar esta temporada?</p>
      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
