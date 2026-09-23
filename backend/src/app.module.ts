import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { EquiposModule } from './equipos/equipos.module.js';
import { JugadoresModule } from './jugadores/jugadores.module.js';
import { JugadorEquipoModule } from './jugador-equipo/jugador-equipo.module.js';
import { MedicionesAntropometricasModule } from './mediciones-antropometricas/mediciones-antropometricas.module.js';
import { TemporadasModule } from './temporadas/temporadas.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['backend/.env', '.env'],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    CategoriasModule,
    EquiposModule,
    JugadoresModule,
    JugadorEquipoModule,
    MedicionesAntropometricasModule,
    TemporadasModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
