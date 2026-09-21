import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @MinLength(1)
  password!: string;
}
