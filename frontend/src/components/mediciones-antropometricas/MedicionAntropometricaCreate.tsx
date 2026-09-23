import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jugadoresService from "../services/jugadores.service";
import medicionesService, {
  type MedicionAntropometrica,
  type MedicionAntropometricaInput,
} from "../services/medicionesAntropometricas.service";
import Button from "../ui/button";
import FormSelect from "../ui/FormSelect";
import FormTextarea from "../ui/FormTextarea";
import { calculatePreview } from "./antropometria";
import Somatocarta from "./Somatocarta";

type Player = {
  id_jugador: number;
  nombre: string;
  apellidos: string;
  dni: string;
};

type FormState = {
  id_jugador: string;
  fecha: string;
  peso_kg: string;
  talla_cm: string;
  talla_sentado_cm: string;
  pliegue_tricipital: string;
  pliegue_subescapular: string;
  pliegue_supraespinal: string;
  pliegue_abdominal: string;
  pliegue_muslo: string;
  pliegue_pantorrilla: string;
  pliegue_bicipital: string;
  pliegue_cresta_iliaca: string;
  perimetro_brazo_relajado: string;
  perimetro_brazo_flexionado: string;
  perimetro_cintura: string;
  perimetro_cadera: string;
  perimetro_muslo_medio: string;
  perimetro_pantorrilla: string;
  diametro_biepicondilar_humero: string;
  diametro_biepicondilar_femur: string;
  diametro_biestiloideo: string;
  observaciones: string;
};

const steps = ["Contexto", "Pliegues", "Perímetros", "Resultados"];
const requiredSkinfolds: (keyof FormState)[] = [
  "pliegue_tricipital",
  "pliegue_subescapular",
  "pliegue_supraespinal",
  "pliegue_abdominal",
  "pliegue_muslo",
  "pliegue_pantorrilla",
];

const initialForm = (): FormState => ({
  id_jugador: "",
  fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  peso_kg: "",
  talla_cm: "",
  talla_sentado_cm: "",
  pliegue_tricipital: "",
  pliegue_subescapular: "",
  pliegue_supraespinal: "",
  pliegue_abdominal: "",
  pliegue_muslo: "",
  pliegue_pantorrilla: "",
  pliegue_bicipital: "",
  pliegue_cresta_iliaca: "",
  perimetro_brazo_relajado: "",
  perimetro_brazo_flexionado: "",
  perimetro_cintura: "",
  perimetro_cadera: "",
  perimetro_muslo_medio: "",
  perimetro_pantorrilla: "",
  diametro_biepicondilar_humero: "",
  diametro_biepicondilar_femur: "",
  diametro_biestiloideo: "",
  observaciones: "",
});

function NumericField({
  label,
  name,
  value,
  unit,
  required = false,
  warning = false,
  onChange,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  unit: string;
  required?: boolean;
  warning?: boolean;
  onChange: (name: keyof FormState, value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
      <span>{label}{required && <span className="text-red-600"> *</span>}</span>
      <div className="relative">
        <input
          type="number"
          name={name}
          min="0.1"
          step="0.1"
          inputMode="decimal"
          value={value}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
          className={`w-full rounded-lg border bg-white px-3 py-2 pr-12 shadow-soft outline-none focus:ring-2 ${
            warning
              ? "border-amber-400 ring-2 ring-amber-200 focus:ring-amber-400"
              : "border-gray-300 focus:ring-brand-primary"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-gray-500">{unit}</span>
      </div>
      {warning && <span className="text-xs font-normal text-amber-700">Valor superior al rango habitual de 35 mm</span>}
    </label>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border-l-2 border-emerald-500 pl-3">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      {detail && <p className="text-xs text-gray-500">{detail}</p>}
    </div>
  );
}

export default function MedicionAntropometricaCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm(),
    id_jugador: searchParams.get("jugador") ?? "",
  }));
  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<MedicionAntropometrica[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    jugadoresService.getAll().then(setPlayers).catch(() => setError("No se pudo cargar la lista de jugadores."));
  }, []);

  useEffect(() => {
    if (!form.id_jugador) {
      setHistory([]);
      return;
    }

    let active = true;
    setLoadingHistory(true);
    medicionesService
      .getByPlayer(Number(form.id_jugador))
      .then((data) => active && setHistory(data))
      .catch((loadError: Error) => active && setError(loadError.message))
      .finally(() => active && setLoadingHistory(false));

    return () => {
      active = false;
    };
  }, [form.id_jugador]);

  const setValue = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };
  const numberValue = (name: keyof FormState) => Number(form[name]);
  const optionalNumber = (name: keyof FormState) => form[name] === "" ? undefined : Number(form[name]);
  const hasBasicData = numberValue("peso_kg") > 0 && numberValue("talla_cm") > 0;
  const hasRequiredSkinfolds = requiredSkinfolds.every((name) => numberValue(name) > 0);
  const preview = hasBasicData && hasRequiredSkinfolds
    ? calculatePreview({
        peso_kg: numberValue("peso_kg"),
        talla_cm: numberValue("talla_cm"),
        pliegue_tricipital: numberValue("pliegue_tricipital"),
        pliegue_subescapular: numberValue("pliegue_subescapular"),
        pliegue_supraespinal: numberValue("pliegue_supraespinal"),
        pliegue_abdominal: numberValue("pliegue_abdominal"),
        pliegue_muslo: numberValue("pliegue_muslo"),
        pliegue_pantorrilla: numberValue("pliegue_pantorrilla"),
        pliegue_bicipital: optionalNumber("pliegue_bicipital"),
        pliegue_cresta_iliaca: optionalNumber("pliegue_cresta_iliaca"),
        perimetro_brazo_flexionado: optionalNumber("perimetro_brazo_flexionado"),
        perimetro_pantorrilla: optionalNumber("perimetro_pantorrilla"),
        diametro_biepicondilar_humero: optionalNumber("diametro_biepicondilar_humero"),
        diametro_biepicondilar_femur: optionalNumber("diametro_biepicondilar_femur"),
      })
    : undefined;
  const partialSkinfoldSum = requiredSkinfolds.reduce(
    (sum, name) => sum + (Number(form[name]) || 0),
    0,
  );
  const latest = history[0];
  const weightDifference = latest && form.peso_kg
    ? Number(form.peso_kg) - latest.peso_kg
    : undefined;

  const validateCurrentStep = () => {
    if (step === 0 && (!form.id_jugador || !form.fecha || !hasBasicData)) {
      setError("Selecciona un jugador y completa fecha, peso y talla con valores válidos.");
      return false;
    }
    if (step === 1 && !hasRequiredSkinfolds) {
      setError("Completa los seis pliegues obligatorios con valores mayores que cero.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateCurrentStep()) {
      setError("");
      setStep((current) => Math.min(current + 1, 3));
    }
  };

  const buildPayload = (): MedicionAntropometricaInput => ({
    id_jugador: Number(form.id_jugador),
    fecha: new Date(form.fecha).toISOString(),
    peso_kg: numberValue("peso_kg"),
    talla_cm: numberValue("talla_cm"),
    talla_sentado_cm: optionalNumber("talla_sentado_cm"),
    pliegue_tricipital: numberValue("pliegue_tricipital"),
    pliegue_subescapular: numberValue("pliegue_subescapular"),
    pliegue_supraespinal: numberValue("pliegue_supraespinal"),
    pliegue_abdominal: numberValue("pliegue_abdominal"),
    pliegue_muslo: numberValue("pliegue_muslo"),
    pliegue_pantorrilla: numberValue("pliegue_pantorrilla"),
    pliegue_bicipital: optionalNumber("pliegue_bicipital"),
    pliegue_cresta_iliaca: optionalNumber("pliegue_cresta_iliaca"),
    perimetro_brazo_relajado: optionalNumber("perimetro_brazo_relajado"),
    perimetro_brazo_flexionado: optionalNumber("perimetro_brazo_flexionado"),
    perimetro_cintura: optionalNumber("perimetro_cintura"),
    perimetro_cadera: optionalNumber("perimetro_cadera"),
    perimetro_muslo_medio: optionalNumber("perimetro_muslo_medio"),
    perimetro_pantorrilla: optionalNumber("perimetro_pantorrilla"),
    diametro_biepicondilar_humero: optionalNumber("diametro_biepicondilar_humero"),
    diametro_biepicondilar_femur: optionalNumber("diametro_biepicondilar_femur"),
    diametro_biestiloideo: optionalNumber("diametro_biestiloideo"),
    observaciones: form.observaciones.trim() || undefined,
  });

  const handleSubmit = async () => {
    if (!preview || saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await medicionesService.create(buildPayload());
      if (response.ok) {
        navigate("/jugadores");
        return;
      }
      const body = await response.json().catch(() => ({}));
      setError(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "No se pudo guardar la evaluación.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const skinfoldFields: { name: keyof FormState; label: string; required?: boolean }[] = [
    { name: "pliegue_tricipital", label: "Tricipital", required: true },
    { name: "pliegue_subescapular", label: "Subescapular", required: true },
    { name: "pliegue_supraespinal", label: "Supraespinal", required: true },
    { name: "pliegue_abdominal", label: "Abdominal", required: true },
    { name: "pliegue_muslo", label: "Muslo anterior", required: true },
    { name: "pliegue_pantorrilla", label: "Pantorrilla medial", required: true },
    { name: "pliegue_bicipital", label: "Bicipital" },
    { name: "pliegue_cresta_iliaca", label: "Cresta ilíaca" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase text-emerald-700">Protocolo ISAK</p>
        <h1 className="text-3xl font-semibold text-gray-950">Nueva evaluación antropométrica</h1>
      </header>

      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Progreso de la evaluación">
        {steps.map((label, index) => (
          <li key={label} className={`border-t-4 px-2 py-3 ${index <= step ? "border-emerald-600" : "border-gray-200"}`}>
            <span className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${index === step ? "bg-emerald-600 text-white" : index < step ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>{index + 1}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}

      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-5 text-xl font-semibold">Contexto y datos básicos</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <FormSelect
                label="Jugador"
                name="id_jugador"
                value={form.id_jugador}
                onChange={(event) => setValue("id_jugador", event.target.value)}
                options={[
                  { value: "", label: "Selecciona un jugador" },
                  ...players.map((player) => ({ value: String(player.id_jugador), label: `${player.nombre} ${player.apellidos} · ${player.dni}` })),
                ]}
              />
              <label className="flex flex-col gap-1.5 font-medium text-gray-700">
                Fecha y hora
                <input type="datetime-local" value={form.fecha} onChange={(event) => setValue("fecha", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-soft outline-none focus:ring-2 focus:ring-brand-primary" />
              </label>
              <NumericField label="Peso" name="peso_kg" unit="kg" value={form.peso_kg} required onChange={setValue} />
              <NumericField label="Talla" name="talla_cm" unit="cm" value={form.talla_cm} required onChange={setValue} />
              <NumericField label="Talla sentado" name="talla_sentado_cm" unit="cm" value={form.talla_sentado_cm} onChange={setValue} />
            </div>
          </section>
          <aside className="rounded-lg border border-panel-border bg-gray-950 p-6 text-white shadow-panel">
            <p className="text-sm font-medium text-emerald-300">Referencia inmediata</p>
            <div className="mt-6 space-y-6">
              <div><p className="text-sm text-gray-400">IMC actual</p><p className="text-3xl font-semibold">{hasBasicData ? (numberValue("peso_kg") / (numberValue("talla_cm") / 100) ** 2).toFixed(1) : "—"}</p></div>
              <div><p className="text-sm text-gray-400">Último peso</p><p className="text-2xl font-semibold">{loadingHistory ? "…" : latest ? `${latest.peso_kg.toFixed(1)} kg` : "Sin historial"}</p></div>
              {weightDifference !== undefined && <p className={`text-sm font-medium ${weightDifference > 0 ? "text-amber-300" : "text-emerald-300"}`}>{weightDifference >= 0 ? "+" : ""}{weightDifference.toFixed(1)} kg respecto a la última medición</p>}
            </div>
          </aside>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-1 text-xl font-semibold">Pliegues cutáneos</h2>
            <p className="mb-5 text-sm text-gray-500">Introduce los valores en milímetros siguiendo el orden del protocolo.</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {skinfoldFields.map((field) => (
                <NumericField key={field.name} {...field} unit="mm" value={form[field.name]} warning={Number(form[field.name]) > 35} onChange={setValue} />
              ))}
            </div>
          </section>
          <aside className="h-fit rounded-lg border border-emerald-200 bg-emerald-50 p-6 lg:sticky lg:top-0">
            <p className="text-sm font-semibold uppercase text-emerald-800">Resumen en vivo</p>
            <div className="mt-6 space-y-5">
              <Metric label="Sumatoria 6" value={`${partialSkinfoldSum.toFixed(1)} mm`} />
              <Metric label="Sumatoria 8" value={preview?.sumatoria8 !== undefined ? `${preview.sumatoria8.toFixed(1)} mm` : "—"} detail="Disponible al completar los opcionales" />
              <Metric label="Grasa estimada" value={preview ? `${preview.porcentajeGrasa.toFixed(1)} %` : "—"} detail="Ecuación de Faulkner" />
            </div>
          </aside>
        </div>
      )}

      {step === 2 && (
        <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
          <div className="grid gap-8 xl:grid-cols-2">
            <div>
              <h2 className="mb-5 text-xl font-semibold">Perímetros</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <NumericField label="Brazo relajado" name="perimetro_brazo_relajado" unit="cm" value={form.perimetro_brazo_relajado} onChange={setValue} />
                <NumericField label="Brazo flexionado en tensión" name="perimetro_brazo_flexionado" unit="cm" value={form.perimetro_brazo_flexionado} onChange={setValue} />
                <NumericField label="Cintura" name="perimetro_cintura" unit="cm" value={form.perimetro_cintura} onChange={setValue} />
                <NumericField label="Cadera" name="perimetro_cadera" unit="cm" value={form.perimetro_cadera} onChange={setValue} />
                <NumericField label="Muslo medio" name="perimetro_muslo_medio" unit="cm" value={form.perimetro_muslo_medio} onChange={setValue} />
                <NumericField label="Pantorrilla" name="perimetro_pantorrilla" unit="cm" value={form.perimetro_pantorrilla} onChange={setValue} />
              </div>
            </div>
            <div>
              <h2 className="mb-5 text-xl font-semibold">Diámetros</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <NumericField label="Biepicondilar del húmero (codo)" name="diametro_biepicondilar_humero" unit="cm" value={form.diametro_biepicondilar_humero} onChange={setValue} />
                <NumericField label="Biepicondilar del fémur (rodilla)" name="diametro_biepicondilar_femur" unit="cm" value={form.diametro_biepicondilar_femur} onChange={setValue} />
                <NumericField label="Biestiloideo (muñeca)" name="diametro_biestiloideo" unit="cm" value={form.diametro_biestiloideo} onChange={setValue} />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <FormTextarea label="Observaciones / notas" name="observaciones" value={form.observaciones} placeholder="Toma realizada post-partido, ligera deshidratación…" onChange={(event) => setValue("observaciones", event.target.value)} />
          </div>
        </section>
      )}

      {step === 3 && preview && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-5 text-xl font-semibold">Composición corporal</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <Metric label="Sumatoria 6" value={`${preview.sumatoria6.toFixed(1)} mm`} />
              <Metric label="Sumatoria 8" value={preview.sumatoria8 !== undefined ? `${preview.sumatoria8.toFixed(1)} mm` : "—"} />
              <Metric label="IMC" value={preview.imc.toFixed(1)} />
              <Metric label="Grasa" value={`${preview.porcentajeGrasa.toFixed(1)} %`} detail={`${preview.grasaKg.toFixed(1)} kg estimados`} />
              <Metric label="Masa muscular" value="—" detail="Sin fórmula validada para las variables disponibles" />
            </div>
            <h2 className="mb-5 mt-8 text-xl font-semibold">Somatotipo Heath-Carter</h2>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Endomorfia" value={preview.endomorfia.toFixed(2)} />
              <Metric label="Mesomorfia" value={preview.mesomorfia?.toFixed(2) ?? "—"} />
              <Metric label="Ectomorfia" value={preview.ectomorfia.toFixed(2)} />
            </div>
          </section>
          <Somatocarta
            current={preview.somatocartaX !== undefined && preview.somatocartaY !== undefined ? { x: preview.somatocartaX, y: preview.somatocartaY } : undefined}
            previous={latest?.somatocarta_x != null && latest.somatocarta_y != null ? { x: latest.somatocarta_x, y: latest.somatocarta_y } : undefined}
          />
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
        <Button color="light" onClick={() => step === 0 ? navigate(-1) : setStep((current) => current - 1)}>{step === 0 ? "Cancelar" : "Anterior"}</Button>
        <p className="text-sm text-gray-500">Paso {step + 1} de 4</p>
        {step < 3 ? <Button onClick={goNext}>Continuar</Button> : <Button onClick={handleSubmit}>{saving ? "Guardando…" : "Guardar evaluación antropométrica"}</Button>}
      </footer>
    </div>
  );
}