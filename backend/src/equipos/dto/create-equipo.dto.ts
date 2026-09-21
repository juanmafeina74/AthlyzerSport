import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, MaxLength } from 'class-validator';

export class CreateEquipoDto {
  @IsInt()
  @IsPositive()
  id_temporada!: number;

  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_categoria?: number;

  @IsOptional()
  @IsDateString()
  fecha_creacion?: string;
}
