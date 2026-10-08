import { FormEvent, useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";
import FormInput from "../ui/FormInput";
import posicionesService, { type Posicion } from "../services/posiciones.service";

const emptyForm = { nombre: "", abreviatura: "" };

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? fallback;
}

export default function PosicionesPage() {
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPositions = async () => {
    try {
      setPosiciones(await posicionesService.getAll());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPositions();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const data = { nombre: form.nombre.trim(), abreviatura: form.abreviatura.trim() || null };
      const response = editingId === null
        ? await posicionesService.create(data)
        : await posicionesService.update(editingId, data);
      if (!response.ok) {
        setError(await responseMessage(response, "No se pudo guardar la posición."));
        return;
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadPositions();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (position: Posicion) => {
    setEditingId(position.id_posicion);
    setForm({ nombre: position.nombre, abreviatura: position.abreviatura ?? "" });
    setError("");
  };

  const remove = async (position: Posicion) => {
    if (!window.confirm(`¿Eliminar la posición ${position.nombre}?`)) return;
    setError("");
    try {
      const response = await posicionesService.remove(position.id_posicion);
      if (!response.ok) {
        setError(await responseMessage(response, "No se pudo eliminar la posición."));
        return;
      }
      if (editingId === position.id_posicion) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await loadPositions();
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase text-emerald-700">Catálogo deportivo</p>
        <h1 className="text-2xl font-semibold text-gray-950">Posiciones</h1>
      </header>

      {error && <p role="alert" className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      <Card title={editingId === null ? "Añadir posición" : "Editar posición"}>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
          <FormInput label="Nombre" name="nombre" value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} required />
          <FormInput label="Abreviatura" name="abreviatura" value={form.abreviatura}
            onChange={(event) => setForm((current) => ({ ...current, abreviatura: event.target.value }))} />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editingId === null ? "Añadir" : "Guardar"}</Button>
            {editingId !== null && <Button type="button" color="light" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>}
          </div>
        </form>
      </Card>

      <Card title="Catálogo">
        {loading ? <p role="status" className="text-sm text-gray-600">Cargando posiciones…</p> : posiciones.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr><th className="py-2">Nombre</th><th className="py-2">Abreviatura</th><th className="py-2 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posiciones.map((position) => (
                  <tr key={position.id_posicion}>
                    <td className="py-3 font-medium text-gray-900">{position.nombre}</td>
                    <td className="py-3 text-gray-600">{position.abreviatura ?? "—"}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button color="light" onClick={() => edit(position)}>Editar</Button>
                        <Button color="danger" onClick={() => void remove(position)}>Eliminar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-600">Todavía no hay posiciones en el catálogo.</p>}
      </Card>
    </div>
  );
}