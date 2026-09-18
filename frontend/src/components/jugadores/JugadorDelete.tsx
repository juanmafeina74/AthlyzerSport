import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function JugadorDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const jugadorId = Number(id);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    const response = await jugadoresService.delete(jugadorId);

    if (response.ok) {
      navigate("/jugadores");
      return;
    }

    const body = await response.json().catch(() => ({ message: "No se pudo eliminar el jugador." }));
    setError(body.message ?? body.error ?? "No se pudo eliminar el jugador.");
  };

  return (
    <Card title="Eliminar jugador" description="Esta acción eliminará el jugador seleccionado.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar este jugador?</p>
      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
