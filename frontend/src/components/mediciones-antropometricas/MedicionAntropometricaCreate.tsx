import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, apiErrorFromBody, describeApiError, handleUnauthorized, toApiError } from "../services/apiError";
import equiposService, { type ProtocoloAntropometrico } from "../services/equipos.service";
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

type Membership = {
  id_jugador_equipo: number;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  equipo: { id_equipo: number; nombre: string };
};

type TeamContext = {
  id_equipo: number;
  nombre: string;
  protocolo: ProtocoloAntropometrico;
  version: number;
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

type MeasureKey = Exclude<keyof FormState, "id_jugador" | "fecha" | "observaciones">;

const stepsByProtocol: Record<ProtocoloAntropometrico, string[]> = {
  ISAK: ["Contexto", "Pliegues", "Perímetros", "Resultados"],
  BASICA: ["Contexto", "Medidas básicas"],
};
const requiredSkinfolds: MeasureKey[] = [
  "pliegue_tricipital",
  "pliegue_subescapular",
  "pliegue_supraespinal",
  "pliegue_abdominal",
  "pliegue_muslo",
  "pliegue_pantorrilla",
];
const optionalSkinfolds: MeasureKey[] = ["pliegue_bicipital", "pliegue_cresta_iliaca"];
const isakPerimetersAndDiameters: MeasureKey[] = [
  "perimetro_brazo_relajado",
  "perimetro_brazo_flexionado",
  "perimetro_cadera",
  "perimetro_muslo_medio",
  "perimetro_pantorrilla",
  "diametro_biepicondilar_humero",
  "diametro_biepicondilar_femur",
  "diametro_biestiloideo",
];
const MEASURE_PATTERN = /^\d+(\.\d{1,2})?$/;
const isValidMeasure = (value: string) => MEASURE_PATTERN.test(value) && Number(value) >= 0.1;
const MEASURE_RULE = "Las medidas deben ser mayores o iguales a 0,1 y tener como máximo dos decimales.";

const utcDay = (value: string) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
};
const coversDay = (membership: Membership, day: number) =>
  utcDay(membership.fecha_inicio) <= day && (!membership.fecha_fin || utcDay(membership.fecha_fin) >= day);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
const formatResult = (value: number | null | undefined, unit = "", digits = 1) =>
  value == null ? "Sin resultado" : `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;

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
          step="0.01"
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
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamContext, setTeamContext] = useState<TeamContext | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [manualProtocol, setManualProtocol] = useState<ProtocoloAntropometrico | "">("");
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const requestedTeam = useRef("");

  const setError = (message: string) => setErrors(message ? [message] : []);
  const showFailure = (cause: unknown, fallback: string) => {
    if (cause instanceof ApiError) {
      if (cause.status === 401) return handleUnauthorized();
      setErrors(describeApiError(cause));
      return;
    }
    setError(fallback);
  };

  const loadPlayerContext = async (idJugador: number) => {
    const [detail, measurements] = await Promise.all([
      jugadoresService.getById(idJugador),
      medicionesService.getByPlayer(idJugador),
    ]);
    if (!detail || (detail.statusCode && detail.statusCode >= 400)) {
      throw apiErrorFromBody(detail?.statusCode ?? 500, detail, "No se pudo cargar el jugador.");
    }
    return { memberships: (detail.jugador_equipo ?? []) as Membership[], measurements };
  };

  const loadTeamContext = async (idEquipo: number): Promise<TeamContext> => {
    const equipo = await equiposService.getById(idEquipo);
    return {
      id_equipo: equipo.id_equipo,
      nombre: equipo.nombre,
      protocolo: equipo.protocolo_antropometrico,
      version: equipo.version_protocolo_antropometrico,
    };
  };

  useEffect(() => {
    jugadoresService.getAll()
      .then((data) => {
        if (!Array.isArray(data)) throw apiErrorFromBody(data?.statusCode ?? 500, data, "No se pudo cargar la lista de jugadores.");
        setPlayers(data);
      })
      .catch((cause) => showFailure(cause, "No se pudo cargar la lista de jugadores."));
  }, []);

  useEffect(() => {
    setMemberships([]);
    setHistory([]);
    if (!form.id_jugador) return;

    let active = true;
    setLoadingContext(true);
    loadPlayerContext(Number(form.id_jugador))
      .then((context) => {
        if (!active) return;
        setMemberships(context.memberships);
        setHistory(context.measurements);
      })
      .catch((cause) => active && showFailure(cause, "No se pudo cargar el contexto del jugador."))
      .finally(() => active && setLoadingContext(false));

    return () => {
      active = false;
    };
  }, [form.id_jugador]);

  const selectTeam = (value: string) => {
    requestedTeam.current = value;
    setSelectedTeamId(value);
    setTeamContext(null);
    setErrors([]);
    if (!value) return;

    setLoadingTeam(true);
    loadTeamContext(Number(value))
      .then((context) => requestedTeam.current === value && setTeamContext(context))
      .catch((cause) => requestedTeam.current === value && showFailure(cause, "No se pudo cargar la configuración del equipo."))
      .finally(() => requestedTeam.current === value && setLoadingTeam(false));
  };

  const selectPlayer = (value: string) => {
    setValue("id_jugador", value);
    requestedTeam.current = "";
    setLoadingTeam(false);
    setSelectedTeamId("");
    setTeamContext(null);
    setManualProtocol("");
    setNotice("");
  };

  const activeMemberships = memberships.filter((membership) => membership.activo);
  const hasActiveTeams = activeMemberships.length > 0;
  const protocolo: ProtocoloAntropometrico | undefined = hasActiveTeams
    ? teamContext?.protocolo
    : manualProtocol || undefined;
  const steps = protocolo ? stepsByProtocol[protocolo] : ["Contexto"];
  const lastStep = steps.length - 1;
  const busy = loadingContext || loadingTeam || reloading;
  const teamNames = new Map(memberships.map((membership) => [membership.equipo.id_equipo, membership.equipo.nombre]));

  const setValue = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors([]);
  };
  const numberValue = (name: keyof FormState) => Number(form[name]);
  const optionalNumber = (name: keyof FormState) => form[name] === "" ? undefined : Number(form[name]);
  const hasBasicData = numberValue("peso_kg") > 0 && numberValue("talla_cm") > 0;
  const hasRequiredSkinfolds = requiredSkinfolds.every((name) => isValidMeasure(form[name]));
  const preview = protocolo === "ISAK" && hasBasicData && hasRequiredSkinfolds
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
  const previousSomatocarta = history.find((measurement) => measurement.somatocarta_x != null && measurement.somatocarta_y != null);
  const weightDifference = latest && form.peso_kg
    ? Number(form.peso_kg) - latest.peso_kg
    : undefined;
  const imc = hasBasicData ? numberValue("peso_kg") / (numberValue("talla_cm") / 100) ** 2 : undefined;

  const optionalMeasuresValid = (names: MeasureKey[]) => names.every((name) => form[name] === "" || isValidMeasure(form[name]));

  const validateContext = () => {
    if (!form.id_jugador) return "Selecciona un jugador.";
    if (busy) return "Espera a que termine la carga del contexto del jugador.";
    if (hasActiveTeams && !selectedTeamId) return "El jugador tiene equipos activos: selecciona explícitamente el equipo de la medición.";
    if (hasActiveTeams && !teamContext) return "No se ha podido obtener la configuración del equipo seleccionado.";
    if (!hasActiveTeams && !manualProtocol) return "Selecciona el protocolo de la medición.";
    if (!form.fecha || Number.isNaN(new Date(form.fecha).getTime())) return "Indica una fecha válida.";
    if (!isValidMeasure(form.peso_kg) || !isValidMeasure(form.talla_cm)) return `Completa peso y talla. ${MEASURE_RULE}`;
    if (protocolo === "ISAK" && !optionalMeasuresValid(["talla_sentado_cm"])) return MEASURE_RULE;

    const day = utcDay(form.fecha);
    if (teamContext) {
      const membership = activeMemberships.find((item) => item.equipo.id_equipo === teamContext.id_equipo);
      if (!membership || !coversDay(membership, day)) {
        return "La fecha de la medición debe estar cubierta por la pertenencia activa al equipo seleccionado.";
      }
    } else if (memberships.some((membership) => coversDay(membership, day))) {
      return "No se pueden registrar mediciones de pertenencias ya finalizadas.";
    }
    return "";
  };

  const validateStep = (index: number) => {
    let message = "";
    if (index === 0) message = validateContext();
    else if (protocolo === "BASICA" && index === 1 && !optionalMeasuresValid(["perimetro_cintura"])) message = MEASURE_RULE;
    else if (protocolo === "ISAK" && index === 1 && !hasRequiredSkinfolds) message = `Completa los seis pliegues obligatorios. ${MEASURE_RULE}`;
    else if (protocolo === "ISAK" && index === 1 && !optionalMeasuresValid(optionalSkinfolds)) message = MEASURE_RULE;
    else if (protocolo === "ISAK" && index === 2 && !optionalMeasuresValid(["perimetro_cintura", ...isakPerimetersAndDiameters])) message = MEASURE_RULE;
    else if (protocolo === "ISAK" && index === 3 && !preview) message = "Faltan datos para calcular la previsualización ISAK.";
    setError(message);
    return !message;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, lastStep));
    }
  };

  const buildPayload = (selected: ProtocoloAntropometrico): MedicionAntropometricaInput => {
    const common = {
      id_jugador: Number(form.id_jugador),
      fecha: new Date(form.fecha).toISOString(),
      peso_kg: numberValue("peso_kg"),
      talla_cm: numberValue("talla_cm"),
      perimetro_cintura: optionalNumber("perimetro_cintura"),
      observaciones: form.observaciones.trim() || undefined,
      ...(teamContext
        ? { id_equipo: teamContext.id_equipo, version_protocolo_antropometrico: teamContext.version }
        : {}),
    };

    if (selected === "BASICA") return { ...common, protocolo: "BASICA" };

    return {
      ...common,
      protocolo: "ISAK",
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
      perimetro_cadera: optionalNumber("perimetro_cadera"),
      perimetro_muslo_medio: optionalNumber("perimetro_muslo_medio"),
      perimetro_pantorrilla: optionalNumber("perimetro_pantorrilla"),
      diametro_biepicondilar_humero: optionalNumber("diametro_biepicondilar_humero"),
      diametro_biepicondilar_femur: optionalNumber("diametro_biepicondilar_femur"),
      diametro_biestiloideo: optionalNumber("diametro_biestiloideo"),
    };
  };

  const reloadAfterConflict = async () => {
    setStep(0);
    setReloading(true);
    const previousProtocol = protocolo;
    try {
      const context = await loadPlayerContext(Number(form.id_jugador));
      setMemberships(context.memberships);
      setHistory(context.measurements);
      const stillActive = context.memberships.some(
        (membership) => membership.activo && String(membership.equipo.id_equipo) === selectedTeamId,
      );
      let reloadedTeam: TeamContext | null = null;
      if (selectedTeamId && stillActive) {
        reloadedTeam = await loadTeamContext(Number(selectedTeamId));
      } else {
        requestedTeam.current = "";
        setSelectedTeamId("");
      }
      setTeamContext(reloadedTeam);
      const protocolNote = reloadedTeam && reloadedTeam.protocolo !== previousProtocol
        ? ` La modalidad del equipo es ahora ${reloadedTeam.protocolo}.`
        : selectedTeamId && !stillActive ? " El equipo seleccionado ya no es una pertenencia activa del jugador." : "";
      setNotice(`La configuración del equipo o la pertenencia del jugador ha cambiado. Se han recargado los datos y conservado las medidas introducidas.${protocolNote} Revisa el formulario antes de volver a guardar.`);
    } catch (cause) {
      showFailure(cause, "No se pudo recargar el contexto de la medición.");
    } finally {
      setReloading(false);
    }
  };

  const handleSubmit = async () => {
    if (saving || !protocolo) return;
    for (let index = 0; index <= lastStep; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }
    setSaving(true);
    setErrors([]);
    setNotice("");

    try {
      const response = await medicionesService.create(buildPayload(protocolo));
      if (response.ok) {
        navigate("/jugadores");
        return;
      }
      const apiError = await toApiError(response, "No se pudo guardar la evaluación.");
      if (apiError.status === 409) {
        await reloadAfterConflict();
        return;
      }
      showFailure(apiError, "No se pudo guardar la evaluación.");
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
        <p className="text-sm font-semibold uppercase text-status-medical">{protocolo ? `Protocolo ${protocolo}` : "Protocolo pendiente de contexto"}</p>
        <h1 className="text-3xl font-semibold text-gray-950">Nueva evaluación antropométrica</h1>
      </header>

      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Progreso de la evaluación">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined} className={`border-t-4 px-2 py-3 ${index <= step ? "border-status-medical" : "border-gray-200"}`}>
            <span className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${index === step ? "bg-status-medical text-white" : index < step ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>{index + 1}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </li>
        ))}
      </ol>

      {notice && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>}
      {errors.length > 0 && (
        <div role="alert" className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">
          {errors.length === 1 ? <p>{errors[0]}</p> : <ul className="list-disc space-y-1 pl-5">{errors.map((message) => <li key={message}>{message}</li>)}</ul>}
        </div>
      )}

      {step === 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
              <h2 className="mb-5 text-xl font-semibold">Contexto y datos básicos</h2>
              <div className="grid gap-5 md:grid-cols-2">
                <FormSelect
                  label="Jugador"
                  name="id_jugador"
                  value={form.id_jugador}
                  onChange={(event) => selectPlayer(event.target.value)}
                  options={[
                    { value: "", label: "Selecciona un jugador" },
                    ...players.map((player) => ({ value: String(player.id_jugador), label: `${player.nombre} ${player.apellidos} · ${player.dni}` })),
                  ]}
                />
                <div className="space-y-2">
                  {!form.id_jugador ? (
                    <p className="pt-8 text-sm text-gray-500">Selecciona un jugador para cargar sus equipos.</p>
                  ) : loadingContext || reloading ? (
                    <p className="pt-8 text-sm text-gray-600" role="status">Cargando equipos del jugador…</p>
                  ) : hasActiveTeams ? (
                    <>
                      <FormSelect
                        label="Equipo de la medición"
                        name="id_equipo"
                        value={selectedTeamId}
                        onChange={(event) => selectTeam(event.target.value)}
                        options={[
                          { value: "", label: "Selecciona un equipo" },
                          ...activeMemberships.map((membership) => ({
                            value: String(membership.equipo.id_equipo),
                            label: membership.equipo.nombre,
                          })),
                        ]}
                      />
                      {loadingTeam && <p className="text-sm text-gray-600" role="status">Cargando configuración del equipo…</p>}
                      {teamContext && <p className="text-sm text-gray-600">Modalidad del equipo: <strong>{teamContext.protocolo}</strong></p>}
                    </>
                  ) : (
                    <>
                      <FormSelect
                        label="Protocolo (medición sin equipo)"
                        name="protocolo"
                        value={manualProtocol}
                        onChange={(event) => { setManualProtocol(event.target.value as ProtocoloAntropometrico | ""); setErrors([]); }}
                        options={[
                          { value: "", label: "Selecciona un protocolo" },
                          { value: "BASICA", label: "Básica" },
                          { value: "ISAK", label: "ISAK" },
                        ]}
                      />
                      <p className="text-xs text-gray-500">El jugador no tiene equipos activos; la medición se registrará sin equipo.</p>
                    </>
                  )}
                </div>
                <label className="flex flex-col gap-1.5 font-medium text-gray-700">
                  Fecha y hora
                  <input type="datetime-local" value={form.fecha} onChange={(event) => setValue("fecha", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-soft outline-none focus:ring-2 focus:ring-brand-primary" />
                </label>
                <NumericField label="Peso" name="peso_kg" unit="kg" value={form.peso_kg} required onChange={setValue} />
                <NumericField label="Talla" name="talla_cm" unit="cm" value={form.talla_cm} required onChange={setValue} />
                {protocolo === "ISAK" && <NumericField label="Talla sentado" name="talla_sentado_cm" unit="cm" value={form.talla_sentado_cm} onChange={setValue} />}
              </div>
            </section>
            <aside className="rounded-lg border border-panel-border bg-gray-950 p-6 text-white shadow-panel">
              <p className="text-sm font-medium text-emerald-300">Referencia inmediata</p>
              <div className="mt-6 space-y-6">
                <div><p className="text-sm text-gray-400">IMC actual</p><p className="text-3xl font-semibold">{imc !== undefined ? imc.toFixed(1) : "—"}</p></div>
                <div><p className="text-sm text-gray-400">Último peso</p><p className="text-2xl font-semibold">{loadingContext ? "…" : latest ? `${latest.peso_kg.toFixed(1)} kg` : "Sin historial"}</p></div>
                {weightDifference !== undefined && <p className="text-sm font-medium text-gray-300">{weightDifference >= 0 ? "+" : ""}{weightDifference.toFixed(1)} kg respecto a la última medición</p>}
              </div>
            </aside>
          </div>

          {form.id_jugador && !loadingContext && (
            <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
              <h2 className="mb-4 text-xl font-semibold">Historial reciente</h2>
              {history.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase text-gray-500">
                      <tr><th className="pb-2">Fecha</th><th className="pb-2">Protocolo</th><th className="pb-2">Equipo</th><th className="pb-2">Peso</th><th className="pb-2">Talla</th><th className="pb-2">Cintura</th><th className="pb-2">Σ 6 pliegues</th><th className="pb-2">Grasa</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.slice(0, 5).map((measurement) => (
                        <tr key={measurement.id_medicion}>
                          <td className="py-3">{formatDate(measurement.fecha)}</td>
                          <td><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{measurement.protocolo}</span></td>
                          <td>{measurement.id_equipo == null ? "Sin equipo" : teamNames.get(measurement.id_equipo) ?? `Equipo ${measurement.id_equipo}`}</td>
                          <td>{formatResult(measurement.peso_kg, "kg")}</td>
                          <td>{formatResult(measurement.talla_cm, "cm")}</td>
                          <td>{measurement.perimetro_cintura == null ? "—" : formatResult(measurement.perimetro_cintura, "cm")}</td>
                          <td>{formatResult(measurement.sumatoria_6_pliegues, "mm")}</td>
                          <td>{formatResult(measurement.porcentaje_grasa, "%")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-gray-500">Todavía no hay evaluaciones antropométricas.</p>}
            </section>
          )}
        </>
      )}

      {protocolo === "BASICA" && step === 1 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <section className="rounded-lg border border-panel-border bg-white p-6 shadow-panel">
            <h2 className="mb-5 text-xl font-semibold">Medidas básicas</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <NumericField label="Cintura" name="perimetro_cintura" unit="cm" value={form.perimetro_cintura} onChange={setValue} />
            </div>
            <div className="mt-6">
              <FormTextarea label="Observaciones / notas" name="observaciones" value={form.observaciones} placeholder="Condiciones de la toma, hora, hidratación…" onChange={(event) => setValue("observaciones", event.target.value)} />
            </div>
          </section>
          <aside className="h-fit rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold uppercase text-emerald-800">Indicadores</p>
            <div className="mt-6 space-y-5">
              <Metric label="Peso" value={`${numberValue("peso_kg").toFixed(1)} kg`} />
              <Metric label="Talla" value={`${numberValue("talla_cm").toFixed(1)} cm`} />
              <Metric label="IMC" value={imc !== undefined ? imc.toFixed(1) : "—"} />
              <Metric label="Cintura" value={form.perimetro_cintura ? `${numberValue("perimetro_cintura").toFixed(1)} cm` : "No indicada"} />
              {teamContext && <Metric label="Equipo" value={teamContext.nombre} />}
            </div>
          </aside>
        </div>
      )}

      {protocolo === "ISAK" && step === 1 && (
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

      {protocolo === "ISAK" && step === 2 && (
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

      {protocolo === "ISAK" && step === 3 && preview && (
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
            previous={previousSomatocarta ? { x: previousSomatocarta.somatocarta_x!, y: previousSomatocarta.somatocarta_y! } : undefined}
          />
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
        <Button color="light" onClick={() => step === 0 ? navigate(-1) : setStep((current) => current - 1)}>{step === 0 ? "Cancelar" : "Anterior"}</Button>
        <p className="text-sm text-gray-500">Paso {step + 1} de {steps.length}</p>
        {step < lastStep || !protocolo
          ? <Button onClick={goNext} disabled={busy}>Continuar</Button>
          : <Button onClick={handleSubmit} disabled={saving || busy}>{saving ? "Guardando…" : "Guardar evaluación antropométrica"}</Button>}
      </footer>
    </div>
  );
}