import { IsIn } from 'class-validator';

export const FASES_READAPTACION = ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4', 'Alta Médica'] as const;

export class CambiarFaseDto {
  @IsIn(FASES_READAPTACION)
  fase: string;
}