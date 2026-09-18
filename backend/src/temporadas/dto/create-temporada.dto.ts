import { IsDateString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTemporadaDto {
  @IsNotEmpty({ message: 'El nombre de la temporada es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida.' })
  fecha_inicio!: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida.' })
  fecha_fin!: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(50)
  estado?: string;
}
