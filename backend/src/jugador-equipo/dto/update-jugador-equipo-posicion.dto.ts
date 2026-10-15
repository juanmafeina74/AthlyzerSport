import { IsInt, Min, ValidateIf } from 'class-validator';

export class UpdateJugadorEquipoPosicionDto {
  @ValidateIf((_data: UpdateJugadorEquipoPosicionDto, value: unknown) => value !== null)
  @IsInt()
  @Min(1)
  id_posicion!: number | null;
}