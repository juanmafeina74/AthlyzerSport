import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import posicionesService, { type Posicion } from "../services/posiciones.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

export default function JugadorEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const jugadorId = Number(id);
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
    Promise.all([jugadoresService.getById(jugadorId), posicionesService.getAll()]).then(([jug, items]) => {
      setForm({
        dni: jug.dni,
        nombre: jug.nombre,
        apellidos: jug.apellidos,
        fecha_nacimiento: jug.fecha_nacimiento?.slice(0, 10) ?? "",
        foto: jug.foto ?? "",
        id_posicion_preferida: jug.id_posicion_preferida == null ? "" : String(jug.id_posicion_preferida),
      });
      setPosiciones(items);
    }).catch(() => setError("No se pudieron cargar los datos del jugador o las posiciones."));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const response = await jugadoresService.update(jugadorId, {
      ...form,
      id_posicion_preferida: form.id_posicion_preferida ? Number(form.id_posicion_preferida) : null,
    });

    if (response.ok) {
      navigate("/jugadores");
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? "No se pudo guardar el jugador.");
    }
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
        <FormSelect label="Posición preferida" name="id_posicion_preferida"
          value={form.id_posicion_preferida}
          onChange={(event) => setForm({ ...form, id_posicion_preferida: event.target.value })}
          options={[{ value: "", label: "Sin definir" }, ...posiciones.map((position) => ({ value: String(position.id_posicion), label: position.nombre }))]} />
      </div>

      {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit}>Guardar cambios</Button>
      </div>
    </Card>
  );
}
