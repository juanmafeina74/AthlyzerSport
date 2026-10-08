import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, describeApiError, handleUnauthorized, toApiError } from "../services/apiError";
import type { AuthUser } from "../services/auth.service";
import categoriasService, { Categoria } from "../services/categorias.service";
import equiposService, { type ProtocoloAntropometrico } from "../services/equipos.service";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import FormSelect from "../ui/FormSelect";

const protocoloLabels: Record<ProtocoloAntropometrico, string> = {
  BASICA: "Básica (peso, talla, cintura)",
  ISAK: "ISAK (pliegues, perímetros y diámetros)",
};

export default function EquipoEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipoId = Number(id);
  const rawUser = localStorage.getItem("athlyzer_user");
  const isAdmin = (rawUser ? (JSON.parse(rawUser) as Partial<AuthUser>) : null)?.role === "admin";
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", id_categoria: "", protocolo_antropometrico: "" });
  const [loadedProtocolo, setLoadedProtocolo] = useState<ProtocoloAntropometrico | "">("");

  const showFailure = (cause: unknown, fallback: string) => {
    if (cause instanceof ApiError) {
      if (cause.status === 401) return handleUnauthorized();
      setError(describeApiError(cause).join(" "));
      return;
    }
    setError(fallback);
  };

  const loadEquipo = async () => {
    const eq = await equiposService.getById(equipoId);
    setLoadedProtocolo(eq.protocolo_antropometrico);
    return eq;
  };

  useEffect(() => {
    categoriasService.getActive().then(setCategorias);
    loadEquipo()
      .then((eq) => setForm({
        nombre: eq.nombre,
        id_categoria: String(eq.id_categoria ?? ""),
        protocolo_antropometrico: eq.protocolo_antropometrico,
      }))
      .catch((cause) => showFailure(cause, "No se pudo cargar el equipo."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (loading || saving) return;
    setError("");
    setNotice("");
    setSaving(true);
    const { protocolo_antropometrico, ...data } = form;
    const protocolChanged = isAdmin && protocolo_antropometrico !== "" && protocolo_antropometrico !== loadedProtocolo;

    try {
      const response = await equiposService.update(equipoId, protocolChanged ? { ...data, protocolo_antropometrico } : data);

      if (response.ok) {
        navigate("/equipos");
        return;
      }

      const apiError = await toApiError(response, "No se pudo actualizar el equipo.");
      if (apiError.status === 409) {
        const eq = await loadEquipo();
        setForm((current) => ({ ...current, protocolo_antropometrico: eq.protocolo_antropometrico }));
        setNotice(`La configuración del equipo ha cambiado. Modalidad actual: ${eq.protocolo_antropometrico}. Revisa los datos antes de volver a guardar.`);
        return;
      }
      showFailure(apiError, "No se pudo actualizar el equipo.");
    } catch (cause) {
      showFailure(cause, "No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Editar equipo">
      {loading && <p className="text-sm text-gray-600">Cargando equipo…</p>}
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
        {isAdmin ? (
          <div className="space-y-1">
            <FormSelect
              label="Modalidad antropométrica"
              name="protocolo_antropometrico"
              value={form.protocolo_antropometrico}
              onChange={(e) => setForm({ ...form, protocolo_antropometrico: e.target.value })}
              options={[
                { value: "", label: "Selecciona una modalidad" },
                { value: "BASICA", label: protocoloLabels.BASICA },
                { value: "ISAK", label: protocoloLabels.ISAK },
              ]}
            />
            <p className="text-xs text-gray-500">Afecta a las nuevas mediciones. El historial conserva el protocolo con el que se registró cada medición.</p>
          </div>
        ) : (
          loadedProtocolo && (
            <div className="flex flex-col space-y-1">
              <span className="text-gray-700 font-medium">Modalidad antropométrica</span>
              <span className="text-gray-900">{protocoloLabels[loadedProtocolo]}</span>
            </div>
          )
        )}
      </div>

      {notice && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="flex gap-3">
        <Button color="light" onClick={() => navigate(-1)}>Volver</Button>
        <Button color="primary" onClick={handleSubmit} disabled={loading || saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </Card>
  );
}
