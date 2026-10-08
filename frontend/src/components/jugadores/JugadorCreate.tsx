import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import Button from "../ui/button";
import jugadoresService from "../services/jugadores.service";
import posicionesService, { type Posicion } from "../services/posiciones.service";
import FormSelect from "../ui/FormSelect";

export default function JugadorCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellidos: "",
    fecha_nacimiento: "",
    foto: "",
    id_posicion_preferida: "",
  });
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);

  useEffect(() => {
    posicionesService.getAll().then(setPosiciones).catch(() => setError("No se pudo cargar el catálogo de posiciones."));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const response = await jugadoresService.create({
      ...form,
      id_posicion_preferida: form.id_posicion_preferida ? Number(form.id_posicion_preferida) : null,
    });

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
        <FormSelect label="Posición preferida" name="id_posicion_preferida"
          value={form.id_posicion_preferida}
          onChange={(event) => setForm({ ...form, id_posicion_preferida: event.target.value })}
          options={[{ value: "", label: "Sin definir" }, ...posiciones.map((position) => ({ value: String(position.id_posicion), label: position.nombre }))]} />
      </div>

      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar jugador</Button>
      </div>
    </Card>
  );
}
