import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, MaxLength, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  @MaxLength(150)
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(1)
  password!: string;

  @IsInt()
  @IsPositive()
  id_rol!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
