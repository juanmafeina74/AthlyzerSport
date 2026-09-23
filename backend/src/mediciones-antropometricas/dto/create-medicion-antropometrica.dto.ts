import { IsISO8601, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMedicionAntropometricaDto {
  @IsInt()
  @Min(1)
  id_jugador!: number;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha debe tener formato ISO válido.' })
  fecha?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  peso_kg!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  talla_cm!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  talla_sentado_cm?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_tricipital!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_subescapular!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_supraespinal!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_abdominal!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_muslo!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_pantorrilla!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_bicipital?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  pliegue_cresta_iliaca?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_brazo_relajado?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_brazo_flexionado?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_cintura?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_cadera?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_muslo_medio?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  perimetro_pantorrilla?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  diametro_biepicondilar_humero?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  diametro_biepicondilar_femur?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  diametro_biestiloideo?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}