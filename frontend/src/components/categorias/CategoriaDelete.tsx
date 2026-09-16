import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import categoriasService from "../services/categorias.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function CategoriaDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const categoriaId = Number(id);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    const response = await categoriasService.delete(categoriaId);

    if (response.ok) {
      navigate("/categorias");
      return;
    }

    const body = await response.json().catch(() => ({ message: "No se pudo eliminar la categoría." }));
    setError(body.message ?? body.error ?? "No se pudo eliminar la categoría.");
  };

  return (
    <Card title="Eliminar categoría" description="Esta acción eliminará la categoría seleccionada.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar esta categoría?</p>
      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
