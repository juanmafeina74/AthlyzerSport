import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePosicionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  abreviatura?: string | null;
}