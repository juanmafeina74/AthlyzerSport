import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import equiposService from "../services/equipos.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";

export default function EquipoEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipoId = Number(id);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    equiposService.getById(equipoId).then((eq) => setNombre(eq.nombre));
  }, []);

  const handleSubmit = async () => {
    await equiposService.update(equipoId, { nombre });
    navigate("/equipos");
  };

  return (
    <Card title="Editar equipo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Nombre del equipo"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar cambios</Button>
      </div>
    </Card>
  );
}
