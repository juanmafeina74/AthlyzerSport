import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usuariosService, { Rol } from "../services/usuarios.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

export default function UsuarioCreate() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    passwordConfirm: "",
    id_rol: "",
    activo: "true",
  });

  useEffect(() => {
    usuariosService.getRoles().then((items) => {
      setRoles(items);
      setForm((currentForm) => ({
        ...currentForm,
        id_rol: currentForm.id_rol || String(items[0]?.id_rol ?? ""),
      }));
    });
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async () => {
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const response = await usuariosService.create({
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      id_rol: form.id_rol,
      activo: form.activo === "true",
    });

    if (response.ok) {
      navigate("/usuarios");
      return;
    }

    const body = await response.json().catch(() => ({ message: "No se pudo crear el usuario." }));
    setError(body.message ?? body.error ?? "No se pudo crear el usuario.");
  };

  return (
    <Card title="Crear usuario">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <FormInput label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} required />
        <FormInput label="Confirmar contraseña" name="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange} required />
        <FormSelect
          label="Rol"
          name="id_rol"
          value={form.id_rol}
          onChange={handleChange}
          options={roles.map((rol) => ({ value: String(rol.id_rol), label: rol.nombre }))}
        />
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
        <Button color="primary" onClick={handleSubmit}>Guardar usuario</Button>
      </div>
    </Card>
  );
}
