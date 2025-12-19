-- Respaldo adaptado para Docker (Schema: repa)
-- Limpieza de referencias a 'test' y ajustes de compatibilidad

SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

-- Creación del Schema Correcto para Docker
CREATE SCHEMA IF NOT EXISTS `repa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `repa`;

--
-- Table structure for table `datos_tecnicos_acuacultura`
--

DROP TABLE IF EXISTS `datos_tecnicos_acuacultura`;
CREATE TABLE `datos_tecnicos_acuacultura` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` int(11) NOT NULL,
  `instalacion_propia` enum('si','no') COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `contrato_arrendamiento_anios` int(10) unsigned DEFAULT NULL COMMENT 'Años de arrendamiento. Solo si la instalación no es propia.',
  `dimensiones_unidad_produccion` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `tipo` enum('comercial','didactica','investigacion','fomento') COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `especies` json DEFAULT NULL COMMENT 'Almacena un objeto con las especies seleccionadas y el campo "otras". Ej: {"seleccionadas": ["mojarra"], "otras": "Carpa"}',
  `tipo_instalacion` enum('granja','centro_acuicola','laboratorio') COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `sistema_produccion` enum('intensivo','semi_intensivo','extensivo','hiperintensivo') COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `produccion_anual_valor` decimal(10,2) DEFAULT NULL COMMENT 'El valor numérico de la producción.',
  `produccion_anual_unidad` enum('kilogramos','toneladas','miles_toneladas') COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'La unidad de medida para la producción.',
  `certificados` json DEFAULT NULL COMMENT 'Almacena un objeto con los certificados seleccionados y sus descripciones. Ej: {"sanidad": "Certificado XYZ", "ninguno": true}',
  `unidad_produccion_id` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`),
  KEY `fk_datos_acuacultura_solicitante_idx` (`solicitante_id`),
  KEY `fk_acuacultura_unidad_produccion` (`unidad_produccion_id`),
  CONSTRAINT `fk_acuacultura_unidad_produccion` FOREIGN KEY (`unidad_produccion_id`) REFERENCES `repa`.`unidad_produccion` (`id`),
  CONSTRAINT `fk_datos_acuacultura_solicitante` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014 COMMENT='Almacena los datos técnicos de acuacultura correspondientes al Anexo 4.';

--
-- Dumping data for table `datos_tecnicos_acuacultura`
--

LOCK TABLES `datos_tecnicos_acuacultura` WRITE;
INSERT INTO `datos_tecnicos_acuacultura` VALUES
(1,28,'no',NULL,NULL,'didactica','{\"otras\": \"\", \"seleccionadas\": [\"mojarra\", \"caracol\"]}','granja','semi_intensivo',2.00,NULL,'{\"buenas_practicas\": \"\", \"inocuidad\": \"\", \"otros\": \"\", \"sanidad\": \"\", \"seleccionados\": []}',NULL,'2025-10-24 06:43:45','2025-11-19 04:14:21'),
(3,31,'si',33,'111x444',NULL,'{\"otras\": \"\", \"seleccionadas\": [\"mojarra\", \"caracol\", \"tilapia\"]}','granja','hiperintensivo',NULL,NULL,'{\"buenas_practicas\": \"a\", \"inocuidad\": \"ejemplo\", \"otros\": \"\", \"sanidad\": \"X certificado\", \"seleccionados\": [\"sanidad\", \"inocuidad\", \"buenas_practicas\"]}',NULL,'2025-10-29 02:11:14','2025-10-29 02:56:37'),
(60014,90033,'si',4,NULL,NULL,'{\"otras\": \"\", \"seleccionadas\": []}',NULL,NULL,NULL,NULL,'{\"buenas_practicas\": \"\", \"inocuidad\": \"\", \"otros\": \"\", \"sanidad\": \"\", \"seleccionados\": []}',NULL,'2025-12-04 02:22:38','2025-12-04 02:22:38'),
(90014,120033,'si',7,NULL,'comercial','{\"otras\": \"\", \"seleccionadas\": [\"langostino\", \"mojarra\", \"caracol\", \"tilapia\"]}','centro_acuicola','extensivo',100.00,'kilogramos','{\"buenas_practicas\": \"\", \"inocuidad\": \"\", \"otros\": \"\", \"sanidad\": \"X certificado\", \"seleccionados\": [\"sanidad\"]}',NULL,'2025-12-18 23:43:55','2025-12-18 23:44:52');
UNLOCK TABLES;

--
-- Table structure for table `datos_tecnicos_pesca`
--

DROP TABLE IF EXISTS `datos_tecnicos_pesca`;
CREATE TABLE `datos_tecnicos_pesca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lugar` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `localidad_captura` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `municipio_captura` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `localidad_desembarque` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `municipio_desembarque` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `pesqueria` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `tipo_pesqueria` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `arte_pesca` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `especies_objetivo` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `certificados_solicitantes` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `nivel_produccion_anual` varchar(200) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `solicitante_id` int(11) DEFAULT NULL,
  `sitio_desembarque` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitante_id` (`solicitante_id`),
  CONSTRAINT `datos_tecnicos_pesca_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=90006;

--
-- Dumping data for table `datos_tecnicos_pesca`
--

LOCK TABLES `datos_tecnicos_pesca` WRITE;
INSERT INTO `datos_tecnicos_pesca` VALUES
(1,'','Veracruz ','','','','Escama,Crustáceos',NULL,'','Langostino/Acamaya,Almeja','','','2025-10-24 06:43:19',28,''),
(2,'Puerto de Tuxpan','Tuxpan','Tuxpan','Tuxpan','Tuxpan','Escama','Comercial','Red agallera:1,Linea y anzuelos:3,Manual:1','Escama','Sanidad,Otros','5 Toneladas','2025-10-25 05:58:10',29,'Puerto de Tuxpan'),
(3,'Mexico','Veracruz','Mexico','','','Escama,Crustáceos,Moluscos','Comercial','Red agallera:3,Red tendal:33,Atarraya:33','Escama,Langostino/Acamaya','Inocuidad Buenas Practicas','','2025-10-25 19:37:07',31,'Poza Rica'),
(4,'Mexico','Veracruz','Mexico','','','',NULL,'','','','','2025-11-01 19:59:36',2,'Poza Rica'),
(5,'','Veracruz','','','','',NULL,'','','','','2025-11-10 08:53:30',26,'Veracruz '),
(30006,'Mexico','Veracruz','Mexico','Veracruz','Mexico','Crustáceos,Moluscos',NULL,'','','','','2025-12-04 02:22:22',90033,'Poza Rica'),
(60006,'Mexico','Veracruz','Mexico','Veracruz','Mexico','Escama,Crustáceos,Moluscos','Comercial','Red agallera:3,Red tendal:33,Atarraya:33,Gancho:9','Escama,Almeja,Caracol','Sanidad','100 Kilogramos','2025-12-18 23:43:16',120033,'Poza Rica');
UNLOCK TABLES;

--
-- Table structure for table `embarcaciones`
--

DROP TABLE IF EXISTS `embarcaciones`;
CREATE TABLE `embarcaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `embarcacion_madera` tinyint(1) DEFAULT NULL,
  `embarcacion_madera_cantidad` int(11) DEFAULT NULL,
  `embarcacion_fibra_vidrio` tinyint(1) DEFAULT NULL,
  `embarcacion_fibra_vidrio_cantidad` int(11) DEFAULT NULL,
  `embarcacion_metal` tinyint(1) DEFAULT NULL,
  `embarcacion_metal_cantidad` int(11) DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `embarcaciones`
--

LOCK TABLES `embarcaciones` WRITE;
INSERT INTO `embarcaciones` VALUES
(1,0,NULL,0,NULL,0,NULL,28),
(3,1,222,0,NULL,0,NULL,31),
(60014,0,NULL,0,NULL,0,NULL,90033),
(90014,0,NULL,0,NULL,0,NULL,120033);
UNLOCK TABLES;

--
-- Table structure for table `embarcaciones_menores`
--

DROP TABLE IF EXISTS `embarcaciones_menores`;
CREATE TABLE `embarcaciones_menores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_embarcacion` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `matricula` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `tonelaje_neto` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `marca` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `numero_serie` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `potencia_hp` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `puerto_base` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `solicitante_id` (`solicitante_id`),
  CONSTRAINT `embarcaciones_menores_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120006;

--
-- Dumping data for table `embarcaciones_menores`
--

LOCK TABLES `embarcaciones_menores` WRITE;
INSERT INTO `embarcaciones_menores` VALUES
(1,'Barco Tempestad','6ª BA-2-53-21','10','REYNOL','456548715','200','Tuxpan',29,'2025-10-25 06:08:09'),
(2,'Jose Ceron Garcia Lopez Doriga','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo ',31,'2025-10-25 19:00:36'),
(3,'Joshua Emmanuel Estrada Nochebuena','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo',28,'2025-10-25 20:12:54'),
(4,'Jose Ceron Garcia Lopez Doriga','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo ',31,'2025-10-29 02:12:20'),
(5,'Jose Ceron Garcia Lopez Doriga','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo ',31,'2025-10-29 02:56:46'),
(6,'Jose Ceron Garcia Lopez Doriga','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo',28,'2025-11-14 01:20:37'),
(30006,'Jose Ceron Garcia Lopez Doriga','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo',90033,'2025-12-04 02:23:06'),
(60006,'Laura Bozo Rodriguez','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo',28,'2025-12-15 20:07:27'),
(90006,'Laura Bozo Rodriguez','6ª BA-3-5111-25','1','Esketch','997788','30','ejemplo',120033,'2025-12-18 23:45:08');
UNLOCK TABLES;

--
-- Table structure for table `equipo_transporte`
--

DROP TABLE IF EXISTS `equipo_transporte`;
CREATE TABLE `equipo_transporte` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transporte_lancha` tinyint(1) DEFAULT NULL,
  `transporte_lancha_cantidad` int(11) DEFAULT NULL,
  `transporte_camioneta` tinyint(1) DEFAULT NULL,
  `transporte_camioneta_cantidad` int(11) DEFAULT NULL,
  `transporte_cajafria` tinyint(1) DEFAULT NULL,
  `transporte_cajafria_cantidad` int(11) DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `equipo_transporte`
--

LOCK TABLES `equipo_transporte` WRITE;
INSERT INTO `equipo_transporte` VALUES
(1,0,NULL,0,NULL,0,NULL,28),
(3,0,NULL,0,NULL,0,NULL,31),
(60014,0,NULL,0,NULL,0,NULL,90033),
(90014,0,NULL,0,NULL,0,NULL,120033);
UNLOCK TABLES;

--
-- Table structure for table `instalacion_hidraulica_aireacion`
--

DROP TABLE IF EXISTS `instalacion_hidraulica_aireacion`;
CREATE TABLE `instalacion_hidraulica_aireacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hidraulica_bomba_agua` tinyint(1) DEFAULT NULL,
  `hidraulica_bomba_agua_cantidad` int(11) DEFAULT NULL,
  `hidraulica_aireador` tinyint(1) DEFAULT NULL,
  `hidraulica_aireador_cantidad` int(11) DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `instalacion_hidraulica_aireacion`
--

LOCK TABLES `instalacion_hidraulica_aireacion` WRITE;
INSERT INTO `instalacion_hidraulica_aireacion` VALUES
(1,0,NULL,0,NULL,28),
(3,0,NULL,0,NULL,31),
(60014,0,NULL,0,NULL,90033),
(90014,0,NULL,0,NULL,120033);
UNLOCK TABLES;

--
-- Table structure for table `instrumentos_medicion`
--

DROP TABLE IF EXISTS `instrumentos_medicion`;
CREATE TABLE `instrumentos_medicion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instrumento_temperatura` tinyint(1) DEFAULT NULL,
  `instrumento_oxigeno` tinyint(1) DEFAULT NULL,
  `instrumento_ph` tinyint(1) DEFAULT NULL,
  `instrumento_otros` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  `instrumento_temperatura_cantidad` int(11) DEFAULT NULL,
  `instrumento_oxigeno_cantidad` int(11) DEFAULT NULL,
  `instrumento_ph_cantidad` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `instrumentos_medicion`
--

LOCK TABLES `instrumentos_medicion` WRITE;
INSERT INTO `instrumentos_medicion` VALUES
(1,0,0,0,NULL,28,NULL,NULL,NULL),
(3,1,0,0,NULL,31,1,NULL,NULL),
(60014,0,0,0,NULL,90033,NULL,NULL,NULL),
(90014,0,0,0,NULL,120033,NULL,NULL,NULL);
UNLOCK TABLES;

--
-- Table structure for table `integrantes`
--

DROP TABLE IF EXISTS `integrantes`;
CREATE TABLE `integrantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `rfc` varchar(18) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `curp` varchar(18) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `sexo` int(11) DEFAULT NULL,
  `ultimo_grado_estudio` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `actividad_desempeña` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `localidad` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `municipio` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `telefono` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `solicitante_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitante_id` (`solicitante_id`),
  CONSTRAINT `integrantes_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=180006;

--
-- Dumping data for table `integrantes`
--

LOCK TABLES `integrantes` WRITE;
INSERT INTO `integrantes` VALUES
(1,'Janet Nochebuena Hernandez','RARM831030828','HEGG560427MVZRRL04',0,'Licenciatura','Ejemplo','Ejemplo','Ejemplo','7821968092','2025-10-23 23:01:38',26),
(2,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-10-25 04:31:32',28),
(3,'Emeterio Perez Ortiz','PEOH770625D45','PEOH770625HHGRJV45',1,'Licenciatura','tecnico','Poza Rica','Poza Rica de Hidalgo ','7821368993','2025-10-25 05:54:24',29),
(4,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-10-25 19:36:55',31),
(5,'Thistan Presa Laureano','GAMA770712H74','EANJ031206HNESCS90',1,'Universidad Técnica','Mecánico ','Poza Rica de Hidalgo','Veracruz','7821968092','2025-10-25 20:08:27',28),
(30006,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-11-19 04:06:45',60033),
(60006,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-12-04 02:21:52',90033),
(90006,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-12-18 23:42:24',120033),
(120006,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-12-19 22:48:15',2),
(150006,'Jesus Huerto Perez','RARM831030828','EANJ031206HNESCS10',1,'Secundaria','Empleado','Poza Rica De Hidalgo','Veracruzxz','7821968092','2025-12-19 22:57:30',2);
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expires` timestamp NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=60012;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
INSERT INTO `password_reset_tokens` VALUES
(8,'joshuaguapeton456@outlook.com','f450a7390e10dbd4d7bdadb2ae80ec8e265f55aa5243f901520408cfa07c89e9','2025-10-25 19:13:26'),
(9,'byjoshmcpeyt456@gmail.com','d93656c7f8445070b762100034c1d6846ac37819bf509aad5cd237c7db291c85','2025-10-25 19:20:24'),
(30012,'byjoshmcpeyt900@gmail.com','235dcbc1002326d52497fb13123a529dc89c515477967b551914230415b05c4d','2025-12-03 18:43:40');
UNLOCK TABLES;

--
-- Table structure for table `sistema_conservacion`
--

DROP TABLE IF EXISTS `sistema_conservacion`;
CREATE TABLE `sistema_conservacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conservacion_hielera` tinyint(1) DEFAULT NULL,
  `conservacion_hielera_cantidad` int(11) DEFAULT NULL,
  `conservacion_refrigerado` tinyint(1) DEFAULT NULL,
  `conservacion_refrigerado_cantidad` int(11) DEFAULT NULL,
  `conservacion_otros` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `conservacion_otros_cantidad` int(11) DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  `conservacion_cuartofrio` tinyint(1) DEFAULT NULL,
  `conservacion_cuartofrio_cantidad` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `sistema_conservacion`
--

LOCK TABLES `sistema_conservacion` WRITE;
INSERT INTO `sistema_conservacion` VALUES
(1,0,NULL,0,NULL,NULL,NULL,28,0,NULL),
(3,0,NULL,0,NULL,NULL,NULL,31,0,NULL),
(60014,0,NULL,0,NULL,NULL,NULL,90033,0,NULL),
(90014,0,NULL,0,NULL,NULL,NULL,120033,0,NULL);
UNLOCK TABLES;

--
-- Table structure for table `solicitantes`
--

DROP TABLE IF EXISTS `solicitantes`;
CREATE TABLE `solicitantes` (
  `solicitante_id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `apellido_paterno` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `apellido_materno` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `rfc` varchar(13) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `curp` varchar(18) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `telefono` varchar(10) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `correo_electronico` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `nombre_representante_legal` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `actividad` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `entidad_federativa` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `municipio` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `localidad` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `colonia` varchar(15) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `codigo_postal` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `calle` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `no_exterior` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `no_interior` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `anexo1_completo` tinyint(1) NOT NULL DEFAULT '0',
  `numero_integrantes` int(11) DEFAULT NULL,
  `anexo2_completo` tinyint(1) DEFAULT '0',
  `anexo3_completo` tinyint(1) DEFAULT '0',
  `anexo4_completo` tinyint(1) DEFAULT '0',
  `anexo5_completo` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`solicitante_id`),
  UNIQUE KEY `usuario_id_UNIQUE` (`usuario_id`),
  CONSTRAINT `fk_solicitantes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `repa`.`usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=180033;

--
-- Dumping data for table `solicitantes`
--

LOCK TABLES `solicitantes` WRITE;
INSERT INTO `solicitantes` VALUES
(2,6,'Jose Antonio','Garcia','Mejia','RARM831030828','EANJ031206HNESCSA7','2321331550','joseantonio.garcia@itspozarica.edu.mx','Jesus Antonio Mejia','ambas','Mexico','Veracruz','POZA RICA DE HIDALGO','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','90','23','2025-09-10 00:00:00',1,32,1,1,0,0),
(26,30,'Jose','De Jesus Huerta','Uchua','RARM831030828','EANJ031206HNESCS77','7821968092','byjoshmcpeyt900@gmail.com','Jose Antonio','ambas','Chiapas','Poza Rica ','Hudalgo','Lomas','93200','Mecatepec','33333333','1','2025-10-23 00:00:00',1,2,0,1,0,0),
(27,31,'Ejemplozzzz',NULL,NULL,'RODF9307277N1','PETA031103HVZRMNA2',NULL,'calextamariz@gmail.com',NULL,'ambas',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-24 02:26:36',0,NULL,0,0,0,0),
(28,32,'Jose','Borja','Lopez ddd','AUIH520912TO6','EANJ031206HNESCSA9','7821968092','npesta129@gmail.com','Ruben García Juárez ','ambas','México ','Veracruz','Veracruz','Adolfo ','92500','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINEZ','2613','90','2025-10-24 00:00:00',1,1,1,1,1,1),
(29,33,'Antonio Garcia','Garcia','Mejia','GAMA770712H74','GAMA770712HHGRJN18','7821368993','jagcicipn@gmail.com','Jose Antonio Garcia Mejia','ambas','Veracruz','Poza Rica de Hidalgo ','Poza Rica','Laureles','42050','Araucarias Edif 4','Depto 501','','2025-10-25 00:00:00',1,2,0,0,0,0),
(31,35,'Carlos Diaz','Martinez','Moreno','RARM831030823','EANJ031206HNESCS88','7821668092','joshuaguapeton456@outlook.com','Jesus Antonio Mejia','ambas','Mexico','Veracruz','POZA RICA DE HIDALGO','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','2','11','2025-10-25 00:00:00',1,3,1,1,1,1),
(30033,30037,'JANET','NOCHEBUENA','HERNANDEZ','RODF9307277N1','EANJ031206HNESCS22','2321330984','gdelsunix@gmail.com','Jesus Antonio Mejia','ambas','Mexico','Veracruz','Veracruz','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','2','11','2025-11-16 00:00:00',1,2,0,0,0,0),
(60033,60037,'Carlos','Diaz Martinez','Moreno','RARM831030823','EANJ031206HNESCS99','7821668092','sunix2920@gmail.com','Jesus Antonio Mejia','ambas','Mexico','Veracruz','POZA RICA DE HIDALGO','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','2','11','2025-11-19 00:00:00',1,3,1,0,0,0),
(90033,90037,'Jose Antonio','Garcia','Mejia','RARM831030828','EANJ031206HNESCS66','2321331550','212t0208@itsm.edu.mx','Jesus Antonio Mejia','ambas','Mexico','Veracruz','POZA RICA DE HIDALGO','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','90','23','2025-12-04 00:00:00',1,32,1,1,1,1),
(120033,120037,'Jesus Adolfo','Lopez','Cruz','AUIH520912TO6','EANJ031206HNESCS29','7821967092','itzmasterk456@gmail.com','Ejemplo de rep','ambas','Mexico','Veracruz','POZA RICA DE HIDALGO','Mecatepec','93600','MECATEPEC 101 BLVD ADOLFO RUIZ CORTINES','90','23','2025-12-18 00:00:00',1,1,1,1,1,0),
(150033,150037,NULL,NULL,NULL,NULL,'UELM660219HVZTPR09',NULL,'utrerame@hotmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-19 00:49:22',0,NULL,0,0,0,0);
UNLOCK TABLES;

--
-- Table structure for table `tipo_estanques`
--

DROP TABLE IF EXISTS `tipo_estanques`;
CREATE TABLE `tipo_estanques` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` int(11) DEFAULT NULL,
  `rustico` tinyint(1) DEFAULT '0',
  `rustico_cantidad` int(11) DEFAULT NULL,
  `rustico_dimensiones` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `geomembrana` tinyint(1) DEFAULT '0',
  `geomembrana_cantidad` int(11) DEFAULT NULL,
  `geomembrana_dimensiones` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `concreto` tinyint(1) DEFAULT '0',
  `concreto_cantidad` int(11) DEFAULT NULL,
  `concreto_dimensiones` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `tipo_estanques`
--

LOCK TABLES `tipo_estanques` WRITE;
INSERT INTO `tipo_estanques` VALUES
(1,28,1,200,'20x20',0,NULL,NULL,0,NULL,NULL),
(3,31,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL),
(60014,90033,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL),
(90014,120033,1,9,'90x90',1,9,NULL,0,NULL,NULL);
UNLOCK TABLES;

--
-- Table structure for table `unidad_pesquera`
--

DROP TABLE IF EXISTS `unidad_pesquera`;
CREATE TABLE `unidad_pesquera` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` int(11) DEFAULT NULL,
  `emb_madera` tinyint(1) DEFAULT NULL,
  `emb_madera_cantidad` int(11) DEFAULT NULL,
  `emb_fibra` tinyint(1) DEFAULT NULL,
  `emb_fibra_cantidad` int(11) DEFAULT NULL,
  `emb_metal` tinyint(1) DEFAULT NULL,
  `emb_metal_cantidad` int(11) DEFAULT NULL,
  `motores` tinyint(1) DEFAULT NULL,
  `motores_cantidad` int(11) DEFAULT NULL,
  `cons_hielera` tinyint(1) DEFAULT NULL,
  `cons_hielera_cantidad` int(11) DEFAULT NULL,
  `cons_refrigerador` tinyint(1) DEFAULT NULL,
  `cons_refrigerador_cantidad` int(11) DEFAULT NULL,
  `cons_cuartofrio` tinyint(1) DEFAULT NULL,
  `cons_cuartofrio_cantidad` int(11) DEFAULT NULL,
  `trans_camioneta` tinyint(1) DEFAULT NULL,
  `trans_camioneta_cantidad` int(11) DEFAULT NULL,
  `trans_cajafria` tinyint(1) DEFAULT NULL,
  `trans_cajafria_cantidad` int(11) DEFAULT NULL,
  `trans_camion` tinyint(1) DEFAULT NULL,
  `trans_camion_cantidad` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitante_id_idx` (`solicitante_id`),
  CONSTRAINT `fk_unidad_pesquera_solicitante` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=90006;

--
-- Dumping data for table `unidad_pesquera`
--

LOCK TABLES `unidad_pesquera` WRITE;
INSERT INTO `unidad_pesquera` VALUES
(1,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
(2,29,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0),
(3,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
(4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
(5,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
(30006,90033,0,0,0,0,0,0,0,0,1,33,0,0,0,0,0,0,0,0,0,0),
(60006,120033,1,900,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
UNLOCK TABLES;

--
-- Table structure for table `unidad_produccion`
--

DROP TABLE IF EXISTS `unidad_produccion`;
CREATE TABLE `unidad_produccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitante_id` int(11) DEFAULT NULL,
  `tipo_estanque_id` int(11) DEFAULT NULL,
  `instrumento_id` int(11) DEFAULT NULL,
  `sistema_conservacion_id` int(11) DEFAULT NULL,
  `equipo_transporte_id` int(11) DEFAULT NULL,
  `embarcacion_id` int(11) DEFAULT NULL,
  `instalacion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitante_id_UNIQUE` (`solicitante_id`),
  KEY `fk_unidad_produccion_estanques` (`tipo_estanque_id`),
  KEY `fk_unidad_produccion_instrumentos` (`instrumento_id`),
  KEY `fk_unidad_produccion_conservacion` (`sistema_conservacion_id`),
  KEY `fk_unidad_produccion_transporte` (`equipo_transporte_id`),
  KEY `fk_unidad_produccion_embarcaciones_acu` (`embarcacion_id`),
  KEY `fk_unidad_produccion_hidraulica` (`instalacion_id`),
  CONSTRAINT `fk_unidad_produccion_conservacion` FOREIGN KEY (`sistema_conservacion_id`) REFERENCES `repa`.`sistema_conservacion` (`id`),
  CONSTRAINT `fk_unidad_produccion_embarcaciones_acu` FOREIGN KEY (`embarcacion_id`) REFERENCES `repa`.`embarcaciones` (`id`),
  CONSTRAINT `fk_unidad_produccion_estanques` FOREIGN KEY (`tipo_estanque_id`) REFERENCES `repa`.`tipo_estanques` (`id`),
  CONSTRAINT `fk_unidad_produccion_hidraulica` FOREIGN KEY (`instalacion_id`) REFERENCES `repa`.`instalacion_hidraulica_aireacion` (`id`),
  CONSTRAINT `fk_unidad_produccion_instrumentos` FOREIGN KEY (`instrumento_id`) REFERENCES `repa`.`instrumentos_medicion` (`id`),
  CONSTRAINT `fk_unidad_produccion_solicitante` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_unidad_produccion_transporte` FOREIGN KEY (`equipo_transporte_id`) REFERENCES `repa`.`equipo_transporte` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=120014;

--
-- Dumping data for table `unidad_produccion`
--

LOCK TABLES `unidad_produccion` WRITE;
INSERT INTO `unidad_produccion` VALUES
(1,28,NULL,NULL,NULL,NULL,NULL,NULL),
(3,31,NULL,NULL,NULL,NULL,NULL,NULL),
(60014,90033,NULL,NULL,NULL,NULL,NULL,NULL),
(90014,120033,NULL,NULL,NULL,NULL,NULL,NULL);
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curp` varchar(18) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `token_restablecimiento` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `solicitante_id` int(11) DEFAULT NULL,
  `rol` enum('solicitante','superadmin','admin') COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'solicitante',
  PRIMARY KEY (`id`),
  UNIQUE KEY `curp_UNIQUE` (`curp`),
  KEY `fk_usuarios_solicitantes` (`solicitante_id`),
  CONSTRAINT `fk_usuarios_solicitantes` FOREIGN KEY (`solicitante_id`) REFERENCES `repa`.`solicitantes` (`solicitante_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=180037;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
INSERT INTO `usuarios` VALUES
(6,'EANJ031206HNESCSA7','joseantonio.garcia@itspozarica.edu.mx','$2b$10$EIBC8OfwhUSRPqNA9mCCV.qkdSWSXBeUHmKLP2KO0vckBtTppcHg6','2025-09-09 16:21:06',NULL,2,'superadmin'),
(30,'EANJ031206HNESCS77','byjoshmcpeyt900@gmail.com','$2b$10$VlJOwEtDjyeNcEYqZVV8uuh0AQo029zjA6FE33I5DrBMgTPZzbGzC','2025-10-23 22:57:11',NULL,NULL,'solicitante'),
(31,'PETA031103HVZRMNA2','calextamariz@gmail.com','$2b$10$9wNkOKGxau5UCKR9N4rz/efjw870JB.kVelgJFQk1bnOADGNpm98u','2025-10-24 02:26:36',NULL,NULL,'solicitante'),
(32,'EANJ031206HNESCSA9','npesta129@gmail.com','$2b$10$.0NrnkUW2QTSBpW5M9Coy.2eiF7DUg8Od22oyGmJ/Ar/nXiB9MWm2','2025-10-24 06:40:29',NULL,NULL,'solicitante'),
(33,'GAMA770712HHGRJN18','jagcicipn@gmail.com','$2b$10$S6Fgu9q2cWhW4Ai7eJS1suM5MG10i0gILqk61QKhHgEH/GyE1vJGy','2025-10-25 04:00:50',NULL,NULL,'solicitante'),
(35,'EANJ031206HNESCS88','joshuaguapeton456@outlook.com','$2b$10$h8kaF7rfyi4pyMTOVUOmHeHIavRHnhugxYXkNQcp95xPWtw3sAJuK','2025-10-25 18:59:38',NULL,NULL,'solicitante'),
(30037,'EANJ031206HNESCS22','gdelsunix@gmail.com','$2b$10$bNvck6aYOcvLJPKh2jS2bOOcghZGFG7CMtF6oOJpjyl7AcInNeSzS','2025-11-16 06:54:16',NULL,NULL,'solicitante'),
(60037,'EANJ031206HNESCS99','sunix2920@gmail.com','$2b$10$kKJDb8sziOPaUR9MHZwQDOXEt50mYRD4U09VlQU4tqB0Cv2Q5aHGu','2025-11-19 04:05:27',NULL,NULL,'admin'),
(90037,'EANJ031206HNESCS66','212t0208@itsm.edu.mx','$2b$10$oqK6sdPsRH6oeDQTpWjkeOSlSRsoEZKHQmCqx0fKkEPP2Kq4ys4B2','2025-12-04 02:20:46',NULL,NULL,'solicitante'),
(120037,'EANJ031206HNESCS29','itzmasterk456@gmail.com','$2b$10$IGVXmWW2UPCrRYhJFZ59O.xz2twc/.zFrpo.WDJ.CGVG.NX3CMEY2','2025-12-18 23:39:38',NULL,NULL,'solicitante'),
(150037,'UELM660219HVZTPR09','utrerame@hotmail.com','$2b$10$F5rjg0Zpkhdx19/.VokJHeuVwsGAuY6QxCJBQ2z3wBQv.n1t9br4S','2025-12-19 00:49:22',NULL,NULL,'solicitante');
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;