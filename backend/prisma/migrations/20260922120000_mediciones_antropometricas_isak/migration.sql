-- Existing measurements cannot be converted safely because evaluator and skinfold
-- values did not exist in the previous model.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "medicion_antropometrica" LIMIT 1) THEN
        RAISE EXCEPTION 'La migracion ISAK requiere respaldar y completar las mediciones antropometricas existentes antes de continuar';
    END IF;
END $$;

ALTER TABLE "medicion_antropometrica" RENAME COLUMN "fecha_medicion" TO "fecha";
ALTER TABLE "medicion_antropometrica" RENAME COLUMN "peso" TO "peso_kg";
ALTER TABLE "medicion_antropometrica" RENAME COLUMN "altura" TO "talla_cm";
ALTER TABLE "medicion_antropometrica" RENAME COLUMN "grasa_corporal" TO "porcentaje_grasa";
ALTER TABLE "medicion_antropometrica" RENAME COLUMN "masa_muscular" TO "porcentaje_musculo";

ALTER TABLE "medicion_antropometrica"
    ALTER COLUMN "fecha" TYPE TIMESTAMP(3) USING "fecha"::TIMESTAMP(3),
    ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "peso_kg" TYPE DOUBLE PRECISION USING "peso_kg"::DOUBLE PRECISION,
    ALTER COLUMN "peso_kg" SET NOT NULL,
    ALTER COLUMN "talla_cm" TYPE DOUBLE PRECISION USING "talla_cm"::DOUBLE PRECISION,
    ALTER COLUMN "talla_cm" SET NOT NULL,
    ALTER COLUMN "porcentaje_grasa" TYPE DOUBLE PRECISION USING "porcentaje_grasa"::DOUBLE PRECISION,
    ALTER COLUMN "porcentaje_musculo" TYPE DOUBLE PRECISION USING "porcentaje_musculo"::DOUBLE PRECISION,
    ADD COLUMN "id_evaluador" INTEGER NOT NULL,
    ADD COLUMN "talla_sentado_cm" DOUBLE PRECISION,
    ADD COLUMN "pliegue_tricipital" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_subescapular" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_supraespinal" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_abdominal" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_muslo" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_pantorrilla" DOUBLE PRECISION NOT NULL,
    ADD COLUMN "pliegue_bicipital" DOUBLE PRECISION,
    ADD COLUMN "pliegue_cresta_iliaca" DOUBLE PRECISION,
    ADD COLUMN "perimetro_brazo_relajado" DOUBLE PRECISION,
    ADD COLUMN "perimetro_brazo_flexionado" DOUBLE PRECISION,
    ADD COLUMN "perimetro_cintura" DOUBLE PRECISION,
    ADD COLUMN "perimetro_cadera" DOUBLE PRECISION,
    ADD COLUMN "perimetro_muslo_medio" DOUBLE PRECISION,
    ADD COLUMN "perimetro_pantorrilla" DOUBLE PRECISION,
    ADD COLUMN "diametro_biepicondilar_humero" DOUBLE PRECISION,
    ADD COLUMN "diametro_biepicondilar_femur" DOUBLE PRECISION,
    ADD COLUMN "diametro_biestiloideo" DOUBLE PRECISION,
    ADD COLUMN "sumatoria_6_pliegues" DOUBLE PRECISION,
    ADD COLUMN "sumatoria_8_pliegues" DOUBLE PRECISION,
    ADD COLUMN "somatotipo_endomorfia" DOUBLE PRECISION,
    ADD COLUMN "somatotipo_mesomorfia" DOUBLE PRECISION,
    ADD COLUMN "somatotipo_ectomorfia" DOUBLE PRECISION,
    ADD COLUMN "somatocarta_x" DOUBLE PRECISION,
    ADD COLUMN "somatocarta_y" DOUBLE PRECISION,
    ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL;

CREATE INDEX "idx_medicion_evaluador" ON "medicion_antropometrica"("id_evaluador");

ALTER TABLE "medicion_antropometrica"
    ADD CONSTRAINT "medicion_antropometrica_id_evaluador_fkey"
    FOREIGN KEY ("id_evaluador") REFERENCES "usuario"("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE;
