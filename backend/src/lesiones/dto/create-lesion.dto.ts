import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateLesionDto {
  @IsInt()
  @Min(1)
  id_jugador: number;

  @IsDateString()
  fecha_inicio: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipo_lesion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  zona_corporal: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}