ALTER TABLE "lesion" ADD COLUMN "fase_readaptacion" VARCHAR(30) NOT NULL DEFAULT 'Fase 1',
ADD COLUMN "fecha_alta_real" DATE;

UPDATE "lesion" SET "fase_readaptacion" = 'Alta Médica', "fecha_alta_real" = "fecha_fin"
WHERE "alta_medica" = true;