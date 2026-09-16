import { useNavigate, useParams } from "react-router-dom";
import usuariosService from "../services/usuarios.service";
import Button from "../ui/button";
import Card from "../ui/card";

export default function UsuarioDelete() {
  const navigate = useNavigate();
  const { id } = useParams();
  const usuarioId = Number(id);

  const handleDelete = async () => {
    const response = await usuariosService.delete(usuarioId);
    if (response.ok) {
      navigate("/usuarios");
    } else {
      alert("No se pudo eliminar el usuario");
    }
  };

  return (
    <Card title="Eliminar usuario" description="Esta acción eliminará el usuario seleccionado.">
      <p className="rounded-lg bg-alert-danger px-4 py-3 text-red-800">¿Seguro que deseas eliminar este usuario?</p>
      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
      </div>
    </Card>
  );
}
