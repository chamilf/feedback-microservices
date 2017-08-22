drop database if exists qmatic_cloud;
drop user if exists qp_cloud;

CREATE USER qp_cloud PASSWORD 'qp_cloud';

CREATE DATABASE qmatic_cloud WITH OWNER = qp_cloud ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8' TABLESPACE = pg_default TEMPLATE template0;

GRANT ALL ON DATABASE qmatic_cloud to qp_cloud;

ALTER DATABASE qmatic_cloud SET search_path TO qp_cloud;

\connect qmatic_cloud qp_cloud;

CREATE SCHEMA cloud_mycoolservice AUTHORIZATION qp_cloud;