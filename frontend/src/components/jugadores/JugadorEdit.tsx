import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";

export default function JugadorEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const jugadorId = Number(id);
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellidos: "",
    fecha_nacimiento: "",
    foto: "",
  });

  useEffect(() => {
    jugadoresService.getById(jugadorId).then((jug) => setForm({
      dni: jug.dni,
      nombre: jug.nombre,
      apellidos: jug.apellidos,
      fecha_nacimiento: jug.fecha_nacimiento?.slice(0, 10) ?? "",
      foto: jug.foto ?? "",
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await jugadoresService.update(jugadorId, form);
    navigate("/jugadores");
  };

  return (
    <Card title="Editar jugador">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput name="dni" label="DNI" value={form.dni} onChange={handleChange} required />
        <FormInput name="nombre" label="Nombre" value={form.nombre} onChange={handleChange} required />
        <FormInput name="apellidos" label="Apellidos" value={form.apellidos} onChange={handleChange} required />
        <FormInput
          label="Fecha de nacimiento"
        name="fecha_nacimiento"
        type="date"
        value={form.fecha_nacimiento}
        onChange={handleChange}
      />
        <FormInput name="foto" label="Foto (URL)" value={form.foto} onChange={handleChange} />
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar cambios</Button>
      </div>
    </Card>
  );
}
