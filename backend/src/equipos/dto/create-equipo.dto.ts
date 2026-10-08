import { ProtocoloAntropometrico } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, MaxLength, ValidateIf } from 'class-validator';

export class CreateEquipoDto {
  @IsInt()
  @IsPositive()
  id_temporada!: number;

  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @ValidateIf((_data: CreateEquipoDto, value: unknown) => value !== undefined)
  @IsEnum(ProtocoloAntropometrico)
  protocolo_antropometrico?: ProtocoloAntropometrico;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_categoria?: number;

  @IsOptional()
  @IsDateString()
  fecha_creacion?: string;
}
