export type PreviewInput = {
  peso_kg: number;
  talla_cm: number;
  pliegue_tricipital: number;
  pliegue_subescapular: number;
  pliegue_supraespinal: number;
  pliegue_abdominal: number;
  pliegue_muslo: number;
  pliegue_pantorrilla: number;
  pliegue_bicipital?: number;
  pliegue_cresta_iliaca?: number;
  perimetro_brazo_flexionado?: number;
  perimetro_pantorrilla?: number;
  diametro_biepicondilar_humero?: number;
  diametro_biepicondilar_femur?: number;
};

export type PreviewResults = {
  imc: number;
  sumatoria6: number;
  sumatoria8?: number;
  porcentajeGrasa: number;
  grasaKg: number;
  endomorfia: number;
  mesomorfia?: number;
  ectomorfia: number;
  somatocartaX?: number;
  somatocartaY?: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculatePreview(input: PreviewInput): PreviewResults {
  const sumatoria6 =
    input.pliegue_tricipital +
    input.pliegue_subescapular +
    input.pliegue_supraespinal +
    input.pliegue_abdominal +
    input.pliegue_muslo +
    input.pliegue_pantorrilla;
  const faulknerSum =
    input.pliegue_tricipital +
    input.pliegue_subescapular +
    input.pliegue_supraespinal +
    input.pliegue_abdominal;
  const correctedEndomorphySum =
    (input.pliegue_tricipital + input.pliegue_subescapular + input.pliegue_supraespinal) *
    (170.18 / input.talla_cm);
  const endomorfia =
    -0.7182 +
    0.1451 * correctedEndomorphySum -
    0.00068 * correctedEndomorphySum ** 2 +
    0.0000014 * correctedEndomorphySum ** 3;
  const heightWeightRatio = input.talla_cm / Math.cbrt(input.peso_kg);
  const ectomorfia =
    heightWeightRatio >= 40.75
      ? 0.732 * heightWeightRatio - 28.58
      : heightWeightRatio > 38.25
        ? 0.463 * heightWeightRatio - 17.63
        : 0.1;
  const porcentajeGrasa = faulknerSum * 0.153 + 5.783;
  const result: PreviewResults = {
    imc: round(input.peso_kg / (input.talla_cm / 100) ** 2),
    sumatoria6: round(sumatoria6),
    porcentajeGrasa: round(porcentajeGrasa),
    grasaKg: round(input.peso_kg * (porcentajeGrasa / 100)),
    endomorfia: round(Math.max(0.1, endomorfia)),
    ectomorfia: round(Math.max(0.1, ectomorfia)),
  };

  if (input.pliegue_bicipital !== undefined && input.pliegue_cresta_iliaca !== undefined) {
    result.sumatoria8 = round(
      sumatoria6 + input.pliegue_bicipital + input.pliegue_cresta_iliaca,
    );
  }

  if (
    input.perimetro_brazo_flexionado !== undefined &&
    input.perimetro_pantorrilla !== undefined &&
    input.diametro_biepicondilar_humero !== undefined &&
    input.diametro_biepicondilar_femur !== undefined
  ) {
    const correctedArm = input.perimetro_brazo_flexionado - input.pliegue_tricipital / 10;
    const correctedCalf = input.perimetro_pantorrilla - input.pliegue_pantorrilla / 10;
    result.mesomorfia = round(
      Math.max(
        0.1,
        0.858 * input.diametro_biepicondilar_humero +
          0.601 * input.diametro_biepicondilar_femur +
          0.188 * correctedArm +
          0.161 * correctedCalf -
          0.131 * input.talla_cm +
          4.5,
      ),
    );
    result.somatocartaX = round(result.ectomorfia - result.endomorfia);
    result.somatocartaY = round(2 * result.mesomorfia - (result.endomorfia + result.ectomorfia));
  }

  return result;
}