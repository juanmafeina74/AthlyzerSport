BEGIN;

CREATE TYPE "ProtocoloAntropometrico" AS ENUM ('BASICA', 'ISAK');

ALTER TABLE "equipo"
    ADD COLUMN "protocolo_antropometrico" "ProtocoloAntropometrico" NOT NULL DEFAULT 'ISAK',
    ADD COLUMN "version_protocolo_antropometrico" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "equipo" ALTER COLUMN "protocolo_antropometrico" SET DEFAULT 'BASICA';

ALTER TABLE "medicion_antropometrica"
    ADD COLUMN "protocolo" "ProtocoloAntropometrico" NOT NULL DEFAULT 'ISAK',
    ADD COLUMN "id_equipo" INTEGER,
    ALTER COLUMN "pliegue_tricipital" DROP NOT NULL,
    ALTER COLUMN "pliegue_subescapular" DROP NOT NULL,
    ALTER COLUMN "pliegue_supraespinal" DROP NOT NULL,
    ALTER COLUMN "pliegue_abdominal" DROP NOT NULL,
    ALTER COLUMN "pliegue_muslo" DROP NOT NULL,
    ALTER COLUMN "pliegue_pantorrilla" DROP NOT NULL;

ALTER TABLE "medicion_antropometrica" ALTER COLUMN "protocolo" DROP DEFAULT;

CREATE INDEX "idx_medicion_equipo" ON "medicion_antropometrica"("id_equipo");

ALTER TABLE "medicion_antropometrica"
    ADD CONSTRAINT "medicion_antropometrica_id_equipo_fkey"
    FOREIGN KEY ("id_equipo") REFERENCES "equipo"("id_equipo")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "equipo" DROP CONSTRAINT "equipo_id_temporada_fkey";
ALTER TABLE "equipo"
    ADD CONSTRAINT "equipo_id_temporada_fkey"
    FOREIGN KEY ("id_temporada") REFERENCES "temporada"("id_temporada")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;