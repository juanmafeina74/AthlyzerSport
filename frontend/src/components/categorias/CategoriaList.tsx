import { useEffect, useState } from "react";
import categoriasService, { Categoria } from "../services/categorias.service";
import Card from "../ui/card";
import LinkButton from "../ui/LinkButton";

export default function CategoriaList() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    categoriasService.getAll().then(setCategorias);
  }, []);

  return (
    <Card title="Categorías" description="Gestiona las categorías disponibles para los equipos deportivos.">
      <div className="flex justify-end">
        <LinkButton to="/categorias/crear">Crear categoría</LinkButton>
      </div>

      <div className="space-y-3">
        {categorias.map((categoria) => (
          <div key={categoria.id_categoria} className="flex flex-col gap-4 rounded-lg border border-panel-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900">{categoria.nombre}</p>
              <span className="text-sm text-gray-500">ID: {categoria.id_categoria}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoria.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {categoria.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="flex gap-3">
              <LinkButton color="light" to={`/categorias/editar/${categoria.id_categoria}`}>Editar</LinkButton>
              <LinkButton color="danger" to={`/categorias/borrar/${categoria.id_categoria}`}>Borrar</LinkButton>
            </div>
          </div>
        ))}

        {categorias.length === 0 && <p className="text-gray-600">No hay categorías registradas.</p>}
      </div>
    </Card>
  );
}
