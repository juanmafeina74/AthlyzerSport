-- CreateTable
CREATE TABLE "Jugador" (
    "id_jugador" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "foto" TEXT,

    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id_jugador")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id_equipo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id_equipo")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_dni_key" ON "Jugador"("dni");
