import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import Button from "../ui/button";
import jugadoresService from "../services/jugadores.service";

export default function JugadorCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellidos: "",
    fecha_nacimiento: "",
    foto: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const response = await jugadoresService.create(form);

    if (response.ok) {
      navigate("/jugadores");
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "No se pudo crear el jugador.");
    }
  };

  return (
    <Card title="Crear jugador">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="DNI"
          name="dni"
          value={form.dni}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Apellidos"
          name="apellidos"
          value={form.apellidos}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Fecha de nacimiento"
          name="fecha_nacimiento"
          type="date"
          value={form.fecha_nacimiento}
          onChange={handleChange}
        />

        <FormInput
          label="Foto (URL)"
          name="foto"
          value={form.foto}
          onChange={handleChange}
        />
      </div>

      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar jugador</Button>
      </div>
    </Card>
  );
}
