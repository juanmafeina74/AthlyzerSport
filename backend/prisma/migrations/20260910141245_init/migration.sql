/*
  Warnings:

  - You are about to drop the `Equipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Jugador` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Equipo";

-- DropTable
DROP TABLE "Jugador";

-- CreateTable
CREATE TABLE "temporada" (
    "id_temporada" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" VARCHAR(50) NOT NULL,

    CONSTRAINT "temporada_pkey" PRIMARY KEY ("id_temporada")
);

-- CreateTable
CREATE TABLE "equipo" (
    "id_equipo" SERIAL NOT NULL,
    "id_temporada" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50),
    "fecha_creacion" DATE NOT NULL,

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("id_equipo")
);

-- CreateTable
CREATE TABLE "posicion" (
    "id_posicion" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "abreviatura" VARCHAR(10),

    CONSTRAINT "posicion_pkey" PRIMARY KEY ("id_posicion")
);

-- CreateTable
CREATE TABLE "jugador" (
    "id_jugador" SERIAL NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(150) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "foto" TEXT,

    CONSTRAINT "jugador_pkey" PRIMARY KEY ("id_jugador")
);

-- CreateTable
CREATE TABLE "jugador_equipo" (
    "id_jugador_equipo" SERIAL NOT NULL,
    "id_jugador" INTEGER NOT NULL,
    "id_equipo" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "dorsal" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jugador_equipo_pkey" PRIMARY KEY ("id_jugador_equipo")
);

-- CreateTable
CREATE TABLE "lesion" (
    "id_lesion" SERIAL NOT NULL,
    "id_jugador" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "tipo_lesion" VARCHAR(100),
    "zona_corporal" VARCHAR(100),
    "gravedad" VARCHAR(50),
    "alta_medica" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,

    CONSTRAINT "lesion_pkey" PRIMARY KEY ("id_lesion")
);

-- CreateTable
CREATE TABLE "medicion_antropometrica" (
    "id_medicion" SERIAL NOT NULL,
    "id_jugador" INTEGER NOT NULL,
    "fecha_medicion" DATE NOT NULL,
    "peso" DECIMAL(5,2),
    "altura" DECIMAL(5,2),
    "grasa_corporal" DECIMAL(5,2),
    "masa_muscular" DECIMAL(5,2),
    "observaciones" TEXT,

    CONSTRAINT "medicion_antropometrica_pkey" PRIMARY KEY ("id_medicion")
);

-- CreateIndex
CREATE INDEX "idx_temporada_estado" ON "temporada"("estado");

-- CreateIndex
CREATE INDEX "idx_equipo_temporada" ON "equipo"("id_temporada");

-- CreateIndex
CREATE UNIQUE INDEX "jugador_dni_key" ON "jugador"("dni");

-- CreateIndex
CREATE INDEX "idx_jugador_nombre" ON "jugador"("nombre", "apellidos");

-- CreateIndex
CREATE INDEX "idx_jugador_equipo_jugador" ON "jugador_equipo"("id_jugador");

-- CreateIndex
CREATE INDEX "idx_jugador_equipo_equipo" ON "jugador_equipo"("id_equipo");

-- CreateIndex
CREATE INDEX "idx_jugador_equipo_activo" ON "jugador_equipo"("activo");

-- CreateIndex
CREATE INDEX "idx_lesion_jugador" ON "lesion"("id_jugador");

-- CreateIndex
CREATE INDEX "idx_lesion_tipo" ON "lesion"("tipo_lesion");

-- CreateIndex
CREATE INDEX "idx_medicion_jugador" ON "medicion_antropometrica"("id_jugador");

-- CreateIndex
CREATE INDEX "idx_medicion_fecha" ON "medicion_antropometrica"("fecha_medicion");

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_id_temporada_fkey" FOREIGN KEY ("id_temporada") REFERENCES "temporada"("id_temporada") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jugador_equipo" ADD CONSTRAINT "jugador_equipo_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_jugador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jugador_equipo" ADD CONSTRAINT "jugador_equipo_id_equipo_fkey" FOREIGN KEY ("id_equipo") REFERENCES "equipo"("id_equipo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesion" ADD CONSTRAINT "lesion_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_jugador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_jugador") ON DELETE CASCADE ON UPDATE CASCADE;
