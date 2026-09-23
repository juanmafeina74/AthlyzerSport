import { authHeaders } from "./auth.service";

const API = "http://localhost:3000/api/mediciones-antropometricas";

export type MedicionAntropometricaInput = {
  id_jugador: number;
  fecha: string;
  peso_kg: number;
  talla_cm: number;
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
  perimetro_cintura?: number;
  perimetro_cadera?: number;
  perimetro_muslo_medio?: number;
  perimetro_pantorrilla?: number;
  diametro_biepicondilar_humero?: number;
  diametro_biepicondilar_femur?: number;
  diametro_biestiloideo?: number;
  observaciones?: string;
};

export type MedicionAntropometrica = MedicionAntropometricaInput & {
  id_medicion: number;
  id_evaluador: number;
  sumatoria_6_pliegues: number;
  sumatoria_8_pliegues?: number | null;
  porcentaje_grasa: number;
  porcentaje_musculo?: number | null;
  somatotipo_endomorfia: number;
  somatotipo_mesomorfia?: number | null;
  somatotipo_ectomorfia: number;
  somatocarta_x?: number | null;
  somatocarta_y?: number | null;
};

async function getByPlayer(idJugador: number): Promise<MedicionAntropometrica[]> {
  const response = await fetch(`${API}/jugador/${idJugador}`, { headers: authHeaders() });

  if (!response.ok) {
    throw new Error("No se pudo cargar el historial antropométrico.");
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