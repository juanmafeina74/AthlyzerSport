import { useState } from "react";
import { useNavigate } from "react-router-dom";
import categoriasService from "../services/categorias.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

export default function CategoriaCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", activo: "true" });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async () => {
    setError("");
    const response = await categoriasService.create({
      nombre: form.nombre,
      activo: form.activo === "true",
    });

    if (response.ok) {
      navigate("/categorias");
      return;
    }

    const body = await response.json().catch(() => ({ message: "No se pudo crear la categoría." }));
    setError(body.message ?? body.error ?? "No se pudo crear la categoría.");
  };

  return (
    <Card title="Crear categoría">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        <FormSelect
          label="Estado"
          name="activo"
          value={form.activo}
          onChange={handleChange}
          options={[
            { value: "true", label: "Activo" },
            { value: "false", label: "Inactivo" },
          ]}
        />
      </div>

      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar categoría</Button>
      </div>
    </Card>
  );
}
