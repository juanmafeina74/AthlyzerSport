import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { EquiposModule } from './equipos/equipos.module.js';
import { JugadoresModule } from './jugadores/jugadores.module.js';
import { TemporadasModule } from './temporadas/temporadas.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['backend/.env', '.env'],
      isGlobal: true,
    }),
    AuthModule,
    EquiposModule,
    JugadoresModule,
    TemporadasModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
