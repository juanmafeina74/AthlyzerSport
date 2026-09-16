-- CreateTable
CREATE TABLE "categoria" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- Preserve existing non-empty category names before replacing the text column.
INSERT INTO "categoria" ("nombre")
SELECT DISTINCT TRIM("categoria")
FROM "equipo"
WHERE "categoria" IS NOT NULL AND TRIM("categoria") <> '';

-- AlterTable
ALTER TABLE "equipo" ADD COLUMN "id_categoria" INTEGER;

UPDATE "equipo" AS equipo
SET "id_categoria" = categoria."id_categoria"
FROM "categoria" AS categoria
WHERE TRIM(equipo."categoria") = categoria."nombre";

ALTER TABLE "equipo" DROP COLUMN "categoria";

-- CreateIndex
CREATE INDEX "idx_equipo_categoria" ON "equipo"("id_categoria");

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;
