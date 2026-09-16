import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import Button from "../ui/button";
import equiposService from "../services/equipos.service";
import temporadasService from "../services/temporadas.service";

export default function EquipoCreate() {
  const navigate = useNavigate();
  const [temporadas, setTemporadas] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    fecha_creacion: "",
    id_temporada: "",
  });

  useEffect(() => {
    temporadasService.getAll().then((items) => setTemporadas(items));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const categorias = [
    { value: "U12", label: "U12" },
    { value: "U14", label: "U14" },
    { value: "U16", label: "U16" },
    { value: "Senior", label: "Senior" },
  ];

  const handleSubmit = async () => {
    if (!form.id_temporada) {
      setError("Debes seleccionar una temporada antes de guardar el equipo.");
      return;
    }

    setError("");
    const response = await equiposService.create(form);

    if (response.ok) {
      navigate("/equipos");
    } else {
      const body = await response.json();
      setError(body.message ?? "No se pudo crear el equipo.");
    }
  };

  return (
    <Card title="Crear equipo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Nombre del equipo"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <FormSelect
          label="Categoría"
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          options={categorias}
        />

        <FormInput
          label="Fecha de creación"
          name="fecha_creacion"
          type="date"
          value={form.fecha_creacion}
          onChange={handleChange}
        />

        <FormSelect
          label="Temporada"
          name="id_temporada"
          value={form.id_temporada}
          onChange={handleChange}
          options={temporadas.map((t) => ({
            value: String(t.id_temporada),
            label: `${t.nombre} (${t.estado})`,
          }))}
        />
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar equipo</Button>
      </div>
    </Card>
  );
}
 