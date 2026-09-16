import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import Button from "../ui/button";
import temporadasService from "../services/temporadas.service";

export default function TemporadaCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "activa",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const response = await temporadasService.create(form);
    if (response.ok) {
      navigate("/temporadas");
    } else {
      const body = await response.json().catch(() => ({ message: "No se pudo crear la temporada." }));
      alert(body.message ?? body.error ?? "No se pudo crear la temporada.");
    }
  };

  return (
    <Card title="Crear temporada">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Fecha de inicio"
          name="fecha_inicio"
          type="date"
          value={form.fecha_inicio}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Fecha de fin"
          name="fecha_fin"
          type="date"
          value={form.fecha_fin}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Estado"
          name="estado"
          value={form.estado}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar temporada</Button>
      </div>
    </Card>
  );
}
