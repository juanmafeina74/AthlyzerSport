import { authHeaders } from "./auth.service";
import { toApiError } from "./apiError";
import type { ProtocoloAntropometrico } from "./equipos.service";

const API = "http://localhost:3000/api/mediciones-antropometricas";

export type IsakMeasurements = {
  talla_sentado_cm?: number;
  pliegue_tricipital: number;
  pliegue_subescapular: number;
  pliegue_supraespinal: number;
  pliegue_abdominal: number;
  pliegue_muslo: number;
  pliegue_pantorrilla: number;
  pliegue_bicipital?: number;
  pliegue_cresta_iliaca?: number;
  perimetro_brazo_relajado?: number;
  perimetro_brazo_flexionado?: number;
  perimetro_cadera?: number;
  perimetro_muslo_medio?: number;
  perimetro_pantorrilla?: number;
  diametro_biepicondilar_humero?: number;
  diametro_biepicondilar_femur?: number;
  diametro_biestiloideo?: number;
};

type CommonInput = {
  id_jugador: number;
  fecha?: string;
  peso_kg: number;
  talla_cm: number;
  perimetro_cintura?: number;
  observaciones?: string;
  id_equipo?: number;
  version_protocolo_antropometrico?: number;
};

export type MedicionAntropometricaInput =
  | (CommonInput & { protocolo: "BASICA" })
  | (CommonInput & IsakMeasurements & { protocolo: "ISAK" });

type Nullable<T> = { [K in keyof T]-?: T[K] | null };

export type MedicionAntropometrica = Nullable<IsakMeasurements> & {
  id_medicion: number;
  id_jugador: number;
  id_equipo: number | null;
  id_evaluador: number;
  protocolo: ProtocoloAntropometrico;
  fecha: string;
  peso_kg: number;
  talla_cm: number;
  perimetro_cintura: number | null;
  observaciones: string | null;
  sumatoria_6_pliegues: number | null;
  sumatoria_8_pliegues: number | null;
  porcentaje_grasa: number | null;
  porcentaje_musculo: number | null;
  somatotipo_endomorfia: number | null;
  somatotipo_mesomorfia: number | null;
  somatotipo_ectomorfia: number | null;
  somatocarta_x: number | null;
  somatocarta_y: number | null;
  evaluador?: { id_usuario: number; nombre: string };
};

async function getByPlayer(idJugador: number): Promise<MedicionAntropometrica[]> {
  const response = await fetch(`${API}/jugador/${idJugador}`, { headers: authHeaders() });

  if (!response.ok) {
    throw await toApiError(response, "No se pudo cargar el historial antropométrico.");
  }

  return response.json();
}

async function create(data: MedicionAntropometricaInput) {
  return fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export default { create, getByPlayer };