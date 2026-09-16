import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";
import Button from "../ui/button";
import categoriasService, { Categoria } from "../services/categorias.service";
import equiposService from "../services/equipos.service";
import temporadasService from "../services/temporadas.service";

export default function EquipoCreate() {
  const navigate = useNavigate();
  const [temporadas, setTemporadas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    id_categoria: "",
    fecha_creacion: "",
    id_temporada: "",
  });

  useEffect(() => {
    temporadasService.getAll().then((items) => setTemporadas(items));
    categoriasService.getActive().then(setCategorias);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
          name="id_categoria"
          value={form.id_categoria}
          onChange={handleChange}
          options={[
            { value: "", label: "Sin categoría" },
            ...categorias.map((categoria) => ({
              value: String(categoria.id_categoria),
              label: categoria.nombre,
            })),
          ]}
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
 