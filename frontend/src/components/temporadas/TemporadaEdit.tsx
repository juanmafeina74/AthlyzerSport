import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import temporadasService from "../services/temporadas.service";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import Button from "../ui/button";

export default function TemporadaEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const temporadaId = Number(id);
  const [form, setForm] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "",
  });

  useEffect(() => {
    temporadasService.getById(temporadaId).then((t: any) => {
      setForm({
        nombre: t.nombre,
        fecha_inicio: t.fecha_inicio?.slice(0, 10),
        fecha_fin: t.fecha_fin?.slice(0, 10),
        estado: t.estado,
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const response = await temporadasService.update(temporadaId, form);
    if (response.ok) {
      navigate("/temporadas");
    } else {
      alert("No se pudo actualizar la temporada");
    }
  };

  return (
    <Card title="Editar temporada">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        <FormInput label="Fecha de inicio" name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} required />
        <FormInput label="Fecha de fin" name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} required />
        <FormInput label="Estado" name="estado" value={form.estado} onChange={handleChange} required />
      </div>

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar cambios</Button>
      </div>
    </Card>
  );
}
