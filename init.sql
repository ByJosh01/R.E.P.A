-- MySQL Script adaptado para Docker (Schema: repa)
-- Basado en tu versión local funcional

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema repa
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `repa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `repa` ;

-- -----------------------------------------------------
-- Table `repa`.`sistema_conservacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`sistema_conservacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `conservacion_hielera` TINYINT(1) NULL DEFAULT NULL,
  `conservacion_hielera_cantidad` INT(11) NULL DEFAULT NULL,
  `conservacion_refrigerado` TINYINT(1) NULL DEFAULT NULL,
  `conservacion_refrigerado_cantidad` INT(11) NULL DEFAULT NULL,
  `conservacion_otros` TEXT NULL DEFAULT NULL,
  `conservacion_otros_cantidad` INT(11) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `conservacion_cuartofrio` TINYINT(1) NULL DEFAULT NULL,
  `conservacion_cuartofrio_cantidad` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`embarcaciones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`embarcaciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `embarcacion_madera` TINYINT(1) NULL DEFAULT NULL,
  `embarcacion_madera_cantidad` INT(11) NULL DEFAULT NULL,
  `embarcacion_fibra_vidrio` TINYINT(1) NULL DEFAULT NULL,
  `embarcacion_fibra_vidrio_cantidad` INT(11) NULL DEFAULT NULL,
  `embarcacion_metal` TINYINT(1) NULL DEFAULT NULL,
  `embarcacion_metal_cantidad` INT(11) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`tipo_estanques`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`tipo_estanques` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `rustico` TINYINT(1) NULL DEFAULT '0',
  `rustico_cantidad` INT(11) NULL DEFAULT NULL,
  `rustico_dimensiones` VARCHAR(255) NULL DEFAULT NULL,
  `geomembrana` TINYINT(1) NULL DEFAULT '0',
  `geomembrana_cantidad` INT(11) NULL DEFAULT NULL,
  `geomembrana_dimensiones` VARCHAR(255) NULL DEFAULT NULL,
  `concreto` TINYINT(1) NULL DEFAULT '0',
  `concreto_cantidad` INT(11) NULL DEFAULT NULL,
  `concreto_dimensiones` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`instalacion_hidraulica_aireacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`instalacion_hidraulica_aireacion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `hidraulica_bomba_agua` TINYINT(1) NULL DEFAULT NULL,
  `hidraulica_bomba_agua_cantidad` INT(11) NULL DEFAULT NULL,
  `hidraulica_aireador` TINYINT(1) NULL DEFAULT NULL,
  `hidraulica_aireador_cantidad` INT(11) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`instrumentos_medicion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`instrumentos_medicion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `instrumento_temperatura` TINYINT(1) NULL DEFAULT NULL,
  `instrumento_oxigeno` TINYINT(1) NULL DEFAULT NULL,
  `instrumento_ph` TINYINT(1) NULL DEFAULT NULL,
  `instrumento_otros` TEXT NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `instrumento_temperatura_cantidad` INT(11) NULL DEFAULT NULL,
  `instrumento_oxigeno_cantidad` INT(11) NULL DEFAULT NULL,
  `instrumento_ph_cantidad` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `curp` VARCHAR(18) NOT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `creado_en` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `token_restablecimiento` VARCHAR(100) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `rol` ENUM('solicitante', 'superadmin', 'admin') NOT NULL DEFAULT 'solicitante',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `curp_UNIQUE` (`curp` ASC) VISIBLE,
  INDEX `fk_usuarios_solicitantes` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`solicitantes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`solicitantes` (
  `solicitante_id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `nombre` VARCHAR(150) NULL DEFAULT NULL,
  `apellido_paterno` VARCHAR(100) NULL DEFAULT NULL,
  `apellido_materno` VARCHAR(100) NULL DEFAULT NULL,
  `rfc` VARCHAR(13) NULL DEFAULT NULL,
  `curp` VARCHAR(18) NULL DEFAULT NULL,
  `telefono` VARCHAR(10) NULL DEFAULT NULL,
  `correo_electronico` VARCHAR(50) NULL DEFAULT NULL,
  `nombre_representante_legal` VARCHAR(100) NULL DEFAULT NULL,
  `actividad` VARCHAR(100) NULL DEFAULT NULL,
  `entidad_federativa` VARCHAR(100) NULL DEFAULT NULL,
  `municipio` VARCHAR(100) NULL DEFAULT NULL,
  `localidad` VARCHAR(100) NULL DEFAULT NULL,
  `colonia` VARCHAR(15) NULL DEFAULT NULL,
  `codigo_postal` VARCHAR(100) NULL DEFAULT NULL,
  `calle` VARCHAR(150) NULL DEFAULT NULL,
  `no_exterior` VARCHAR(150) NULL DEFAULT NULL,
  `no_interior` VARCHAR(50) NULL DEFAULT NULL,
  `fecha_actualizacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `anexo1_completo` TINYINT(1) NOT NULL DEFAULT '0',
  `numero_integrantes` INT(11) NULL DEFAULT NULL,
  `anexo2_completo` TINYINT(1) NULL DEFAULT '0',
  `anexo3_completo` TINYINT(1) NULL DEFAULT '0',
  `anexo4_completo` TINYINT(1) NULL DEFAULT '0',
  `anexo5_completo` TINYINT(1) NULL DEFAULT '0',
  PRIMARY KEY (`solicitante_id`),
  UNIQUE INDEX `usuario_id_UNIQUE` (`usuario_id` ASC) VISIBLE,
  CONSTRAINT `fk_solicitantes_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `repa`.`usuarios` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- AGREGAMOS LA FK QUE FALTABA EN USUARIOS AHORA QUE SOLICITANTES EXISTE
ALTER TABLE `repa`.`usuarios` 
ADD CONSTRAINT `fk_usuarios_solicitantes`
  FOREIGN KEY (`solicitante_id`)
  REFERENCES `repa`.`solicitantes` (`solicitante_id`);


-- -----------------------------------------------------
-- Table `repa`.`equipo_transporte`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`equipo_transporte` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `transporte_lancha` TINYINT(1) NULL DEFAULT NULL,
  `transporte_lancha_cantidad` INT(11) NULL DEFAULT NULL,
  `transporte_camioneta` TINYINT(1) NULL DEFAULT NULL,
  `transporte_camioneta_cantidad` INT(11) NULL DEFAULT NULL,
  `transporte_cajafria` TINYINT(1) NULL DEFAULT NULL,
  `transporte_cajafria_cantidad` INT(11) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`unidad_produccion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`unidad_produccion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `tipo_estanque_id` INT(11) NULL DEFAULT NULL,
  `instrumento_id` INT(11) NULL DEFAULT NULL,
  `sistema_conservacion_id` INT(11) NULL DEFAULT NULL,
  `equipo_transporte_id` INT(11) NULL DEFAULT NULL,
  `embarcacion_id` INT(11) NULL DEFAULT NULL,
  `instalacion_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_estanques` (`tipo_estanque_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_instrumentos` (`instrumento_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_conservacion` (`sistema_conservacion_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_transporte` (`equipo_transporte_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_embarcaciones_acu` (`embarcacion_id` ASC) VISIBLE,
  INDEX `fk_unidad_produccion_hidraulica` (`instalacion_id` ASC) VISIBLE,
  CONSTRAINT `fk_unidad_produccion_conservacion`
    FOREIGN KEY (`sistema_conservacion_id`)
    REFERENCES `repa`.`sistema_conservacion` (`id`),
  CONSTRAINT `fk_unidad_produccion_embarcaciones_acu`
    FOREIGN KEY (`embarcacion_id`)
    REFERENCES `repa`.`embarcaciones` (`id`),
  CONSTRAINT `fk_unidad_produccion_estanques`
    FOREIGN KEY (`tipo_estanque_id`)
    REFERENCES `repa`.`tipo_estanques` (`id`),
  CONSTRAINT `fk_unidad_produccion_hidraulica`
    FOREIGN KEY (`instalacion_id`)
    REFERENCES `repa`.`instalacion_hidraulica_aireacion` (`id`),
  CONSTRAINT `fk_unidad_produccion_instrumentos`
    FOREIGN KEY (`instrumento_id`)
    REFERENCES `repa`.`instrumentos_medicion` (`id`),
  CONSTRAINT `fk_unidad_produccion_solicitante`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_unidad_produccion_transporte`
    FOREIGN KEY (`equipo_transporte_id`)
    REFERENCES `repa`.`equipo_transporte` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`datos_tecnicos_acuacultura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`datos_tecnicos_acuacultura` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` INT(11) NOT NULL,
  `instalacion_propia` ENUM('si', 'no') NULL DEFAULT NULL,
  `contrato_arrendamiento_anios` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'Años de arrendamiento. Solo si la instalación no es propia.',
  `dimensiones_unidad_produccion` TEXT NULL DEFAULT NULL,
  `tipo` ENUM('comercial', 'didactica', 'investigacion', 'fomento') NULL DEFAULT NULL,
  `especies` JSON NULL DEFAULT NULL COMMENT 'Almacena un objeto con las especies seleccionadas y el campo "otras". Ej: {"seleccionadas": ["mojarra"], "otras": "Carpa"}',
  `tipo_instalacion` ENUM('granja', 'centro_acuicola', 'laboratorio') NULL DEFAULT NULL,
  `sistema_produccion` ENUM('intensivo', 'semi_intensivo', 'extensivo', 'hiperintensivo') NULL DEFAULT NULL,
  `produccion_anual_valor` DECIMAL(10,2) NULL DEFAULT NULL COMMENT 'El valor numérico de la producción.',
  `produccion_anual_unidad` ENUM('kilogramos', 'toneladas', 'miles_toneladas') NULL DEFAULT NULL COMMENT 'La unidad de medida para la producción.',
  `certificados` JSON NULL DEFAULT NULL COMMENT 'Almacena un objeto con los certificados seleccionados y sus descripciones. Ej: {"sanidad": "Certificado XYZ", "ninguno": true}',
  `unidad_produccion_id` INT(11) NULL DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `solicitante_id_UNIQUE` (`solicitante_id` ASC) VISIBLE,
  INDEX `fk_datos_acuacultura_solicitante_idx` (`solicitante_id` ASC) VISIBLE,
  INDEX `fk_acuacultura_unidad_produccion` (`unidad_produccion_id` ASC) VISIBLE,
  CONSTRAINT `fk_acuacultura_unidad_produccion`
    FOREIGN KEY (`unidad_produccion_id`)
    REFERENCES `repa`.`unidad_produccion` (`id`),
  CONSTRAINT `fk_datos_acuacultura_solicitante`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = 'Almacena los datos técnicos de acuacultura correspondientes al Anexo 4.';


-- -----------------------------------------------------
-- Table `repa`.`datos_tecnicos_pesca`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`datos_tecnicos_pesca` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `lugar` VARCHAR(100) NULL DEFAULT NULL,
  `localidad_captura` VARCHAR(100) NULL DEFAULT NULL,
  `municipio_captura` VARCHAR(100) NULL DEFAULT NULL,
  `localidad_desembarque` VARCHAR(100) NULL DEFAULT NULL,
  `municipio_desembarque` VARCHAR(100) NULL DEFAULT NULL,
  `pesqueria` VARCHAR(100) NULL DEFAULT NULL,
  `tipo_pesqueria` VARCHAR(100) NULL DEFAULT NULL,
  `arte_pesca` VARCHAR(255) NULL DEFAULT NULL,
  `especies_objetivo` VARCHAR(100) NULL DEFAULT NULL,
  `certificados_solicitantes` VARCHAR(100) NULL DEFAULT NULL,
  `nivel_produccion_anual` VARCHAR(200) NULL DEFAULT NULL,
  `fecha_actualizacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `sitio_desembarque` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `solicitante_id` (`solicitante_id` ASC) VISIBLE,
  CONSTRAINT `datos_tecnicos_pesca_ibfk_1`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`embarcaciones_menores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`embarcaciones_menores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_embarcacion` VARCHAR(100) NULL DEFAULT NULL,
  `matricula` VARCHAR(50) NULL DEFAULT NULL,
  `tonelaje_neto` VARCHAR(100) NULL DEFAULT NULL,
  `marca` VARCHAR(100) NULL DEFAULT NULL,
  `numero_serie` VARCHAR(100) NULL DEFAULT NULL,
  `potencia_hp` VARCHAR(50) NULL DEFAULT NULL,
  `puerto_base` VARCHAR(100) NULL DEFAULT NULL,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `fecha_actualizacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `solicitante_id` (`solicitante_id` ASC) VISIBLE,
  CONSTRAINT `embarcaciones_menores_ibfk_1`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`integrantes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`integrantes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_completo` VARCHAR(150) NULL DEFAULT NULL,
  `rfc` VARCHAR(18) NULL DEFAULT NULL,
  `curp` VARCHAR(18) NULL DEFAULT NULL,
  `sexo` INT(11) NULL DEFAULT NULL,
  `ultimo_grado_estudio` VARCHAR(100) NULL DEFAULT NULL,
  `actividad_desempeña` VARCHAR(100) NULL DEFAULT NULL,
  `localidad` VARCHAR(100) NULL DEFAULT NULL,
  `municipio` VARCHAR(100) NULL DEFAULT NULL,
  `telefono` VARCHAR(100) NULL DEFAULT NULL,
  `fecha_actualizacion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `solicitante_id` (`solicitante_id` ASC) VISIBLE,
  CONSTRAINT `integrantes_ibfk_1`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`password_reset_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`password_reset_tokens` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `repa`.`unidad_pesquera`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repa`.`unidad_pesquera` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` INT(11) NULL DEFAULT NULL,
  `emb_madera` TINYINT(1) NULL DEFAULT NULL,
  `emb_madera_cantidad` INT(11) NULL DEFAULT NULL,
  `emb_fibra` TINYINT(1) NULL DEFAULT NULL,
  `emb_fibra_cantidad` INT(11) NULL DEFAULT NULL,
  `emb_metal` TINYINT(1) NULL DEFAULT NULL,
  `emb_metal_cantidad` INT(11) NULL DEFAULT NULL,
  `motores` TINYINT(1) NULL DEFAULT NULL,
  `motores_cantidad` INT(11) NULL DEFAULT NULL,
  `cons_hielera` TINYINT(1) NULL DEFAULT NULL,
  `cons_hielera_cantidad` INT(11) NULL DEFAULT NULL,
  `cons_refrigerador` TINYINT(1) NULL DEFAULT NULL,
  `cons_refrigerador_cantidad` INT(11) NULL DEFAULT NULL,
  `cons_cuartofrio` TINYINT(1) NULL DEFAULT NULL,
  `cons_cuartofrio_cantidad` INT(11) NULL DEFAULT NULL,
  `trans_camioneta` TINYINT(1) NULL DEFAULT NULL,
  `trans_camioneta_cantidad` INT(11) NULL DEFAULT NULL,
  `trans_cajafria` TINYINT(1) NULL DEFAULT NULL,
  `trans_cajafria_cantidad` INT(11) NULL DEFAULT NULL,
  `trans_camion` TINYINT(1) NULL DEFAULT NULL,
  `trans_camion_cantidad` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `solicitante_id_idx` (`solicitante_id` ASC) VISIBLE,
  CONSTRAINT `fk_unidad_pesquera_solicitante`
    FOREIGN KEY (`solicitante_id`)
    REFERENCES `repa`.`solicitantes` (`solicitante_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- --- INICIO: AÑADIR SUPERADMIN (USUARIO 'Miguel Gil') ---

-- 1. Insertamos el usuario con el ROL de 'superadmin'
INSERT INTO `repa`.`usuarios` 
(
  `id`, `curp`, `email`, `password`, `creado_en`, 
  `token_restablecimiento`, `solicitante_id`, `rol`
) 
VALUES 
(
  6, 'EANJ031206HNESCSA7', 'byjoshmcpeyt456@gmail.com', 
  '$2b$10$KndhACCv29g1PNqu8HWWBOhsFebRk6eGG.DU2SqBYNXOsAHaIVq7i', 
  '2025-09-09 16:21:06', NULL, NULL, 'superadmin'
);

-- 2. Insertamos su perfil de solicitante correspondiente
INSERT INTO `repa`.`solicitantes`
(
  `solicitante_id`, `usuario_id`, `nombre`, `apellido_paterno`, `apellido_materno`, 
  `rfc`, `curp`, `telefono`, `correo_electronico`, `nombre_representante_legal`, 
  `actividad`, `entidad_federativa`, `municipio`, `localidad`, `colonia`, 
  `codigo_postal`, `calle`, `no_exterior`, `no_interior`, `fecha_actualizacion`, 
  `anexo1_completo`, `numero_integrantes`
)
VALUES
(
  2, 6, 'Miguel Gil', 'Herrera Nochebuena', 'Hernandez', 
  'RARM831030828', 'EANJ031206HNESCSA7', '2321331550', 'byjoshmcpeyt456@gmail.com', 'Jesus Antonio Mejia', 
  'pesca', 'Mexico', 'Veracruz', 'POZA RICA DE HIDALGO', 'Mecatepec', 
  '93600', 'MECATEPEC #101 BLVD ADOLFO RUIZ CORTINES', '90', '23', '2025-09-10 17:13:32', 
  1, 32
);

-- 3. Actualizamos la referencia cruzada
UPDATE `repa`.`usuarios` SET `solicitante_id` = 2 WHERE `id` = 6;
UPDATE `repa`.`solicitantes` SET `usuario_id` = 6 WHERE `solicitante_id` = 2;