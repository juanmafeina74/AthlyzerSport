import { describe, expect, it } from 'vitest';
import { calculateAnthropometricResults } from './antropometria.calculator.js';

const completeInput = {
  peso_kg: 74.5,
  talla_cm: 178,
  pliegue_tricipital: 8,
  pliegue_subescapular: 10,
  pliegue_supraespinal: 7,
  pliegue_abdominal: 12,
  pliegue_muslo: 11,
  pliegue_pantorrilla: 7,
  pliegue_bicipital: 5,
  pliegue_cresta_iliaca: 9,
  perimetro_brazo_flexionado: 34,
  perimetro_pantorrilla: 37,
  diametro_biepicondilar_humero: 7,
  diametro_biepicondilar_femur: 9.5,
};

describe('calculateAnthropometricResults', () => {
  it('calcula sumatorias, grasa Faulkner y somatotipo Heath-Carter', () => {
    expect(calculateAnthropometricResults(completeInput)).toEqual({
      sumatoria_6_pliegues: 55,
      sumatoria_8_pliegues: 69,
      porcentaje_grasa: 11.44,
      somatotipo_endomorfia: 2.38,
      somatotipo_mesomorfia: 4.98,
      somatotipo_ectomorfia: 2.39,
      somatocarta_x: 0.01,
      somatocarta_y: 5.19,
    });
  });

  it('omite resultados que dependen de mediciones opcionales ausentes', () => {
    const {
      pliegue_bicipital: _pliegueBicipital,
      pliegue_cresta_iliaca: _pliegueCrestaIliaca,
      perimetro_brazo_flexionado: _brazo,
      perimetro_pantorrilla: _pantorrilla,
      diametro_biepicondilar_humero: _humero,
      diametro_biepicondilar_femur: _femur,
      ...requiredInput
    } = completeInput;

    const results = calculateAnthropometricResults(requiredInput);

    expect(results.sumatoria_8_pliegues).toBeUndefined();
    expect(results.somatotipo_mesomorfia).toBeUndefined();
    expect(results.somatocarta_x).toBeUndefined();
    expect(results.somatocarta_y).toBeUndefined();
  });
});