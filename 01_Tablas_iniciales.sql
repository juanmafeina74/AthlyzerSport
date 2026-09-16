CREATE TABLE temporada (
    id_temporada SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(50) NOT NULL
);

CREATE INDEX idx_temporada_estado ON temporada (estado);


CREATE TABLE equipo (
    id_equipo SERIAL PRIMARY KEY,
    id_temporada INT NOT NULL REFERENCES temporada(id_temporada) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    fecha_creacion DATE NOT NULL
);

CREATE INDEX idx_equipo_temporada ON equipo (id_temporada);

CREATE TABLE posicion (
    id_posicion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10)
);

CREATE TABLE jugador (
    id_jugador SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    foto TEXT
);

CREATE INDEX idx_jugador_nombre ON jugador (nombre, apellidos);

CREATE TABLE jugador_equipo (
    id_jugador_equipo SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugador(id_jugador) ON DELETE CASCADE,
    id_equipo INT NOT NULL REFERENCES equipo(id_equipo) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    dorsal INT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_jugador_equipo_jugador ON jugador_equipo (id_jugador);
CREATE INDEX idx_jugador_equipo_equipo ON jugador_equipo (id_equipo);
CREATE INDEX idx_jugador_equipo_activo ON jugador_equipo (activo);

CREATE TABLE lesion (
    id_lesion SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugador(id_jugador) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    tipo_lesion VARCHAR(100),
    zona_corporal VARCHAR(100),
    gravedad VARCHAR(50),
    alta_medica BOOLEAN DEFAULT FALSE,
    observaciones TEXT
);

CREATE INDEX idx_lesion_jugador ON lesion (id_jugador);
CREATE INDEX idx_lesion_tipo ON lesion (tipo_lesion);

CREATE TABLE medicion_antropometrica (
    id_medicion SERIAL PRIMARY KEY,
    id_jugador INT NOT NULL REFERENCES jugador(id_jugador) ON DELETE CASCADE,
    fecha_medicion DATE NOT NULL,
    peso NUMERIC(5,2),
    altura NUMERIC(5,2),
    grasa_corporal NUMERIC(5,2),
    masa_muscular NUMERIC(5,2),
    observaciones TEXT
);

CREATE INDEX idx_medicion_jugador ON medicion_antropometrica (id_jugador);
CREATE INDEX idx_medicion_fecha ON medicion_antropometrica (fecha_medicion);
