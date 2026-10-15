BEGIN;

ALTER TABLE "jugador"
    ADD COLUMN "id_posicion_preferida" INTEGER;

ALTER TABLE "jugador_equipo"
    ADD COLUMN "id_posicion" INTEGER;

CREATE INDEX "idx_jugador_posicion_preferida" ON "jugador"("id_posicion_preferida");
CREATE INDEX "idx_jugador_equipo_posicion" ON "jugador_equipo"("id_posicion");

ALTER TABLE "jugador"
    ADD CONSTRAINT "jugador_id_posicion_preferida_fkey"
    FOREIGN KEY ("id_posicion_preferida") REFERENCES "posicion"("id_posicion")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "jugador_equipo"
    ADD CONSTRAINT "jugador_equipo_id_posicion_fkey"
    FOREIGN KEY ("id_posicion") REFERENCES "posicion"("id_posicion")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;