import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import categoriasService, { Categoria } from "../services/categorias.service";
import equiposService from "../services/equipos.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

export default function EquipoEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipoId = Number(id);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({ nombre: "", id_categoria: "" });

  useEffect(() => {
    categoriasService.getActive().then(setCategorias);
    equiposService.getById(equipoId).then((eq) => {
      setForm({ nombre: eq.nombre, id_categoria: String(eq.id_categoria ?? "") });
    });
  }, []);

  const handleSubmit = async () => {
    await equiposService.update(equipoId, form);
    navigate("/equipos");
  };

  return (
    <Card title="Editar equipo">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Nombre del equipo"
          name="nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <FormSelect
          label="Categoría"
          name="id_categoria"
          value={form.id_categoria}
          onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
          options={[
            { value: "", label: "Sin categoría" },
            ...categorias.map((categoria) => ({
              value: String(categoria.id_categoria),
              label: categoria.nombre,
            })),
          ]}
        />
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar cambios</Button>
      </div>
    </Card>
  );
}
