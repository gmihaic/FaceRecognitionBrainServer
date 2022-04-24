# PostgreSQL setup SQL
create database "smart-brain";

\c smart-brain

CREATE TABLE users(
    id serial PRIMARY KEY,
    name VARCHAR(100),
    email text UNIQUE NOT NULL,
    entries BIGINT DEFAULT 0,
    joined TIMESTAMP NOT NULL
);

CREATE TABLE login(
    id serial PRIMARY KEY,
    hash VARCHAR(100) NOT NULL,
    email text UNIQUE NOT NULL   
);

ALTER TABLE users ADD COLUMN country VARCHAR(100) NULL DEFAULT NULL;

CREATE TABLE image_detections(
    detect_id serial PRIMARY KEY,
    user_id BIGINT REFERENCES users (id),
    image_url text NOT NULL,    
    date TIMESTAMP
);

CREATE INDEX ON image_detections(date);

ALTER TABLE image_detections ADD COLUMN detections BIGINT DEFAULT 0;

ALTER TABLE image_detections ADD COLUMN detect_type VARCHAR(20) DEFAULT 'face';

ALTER TABLE image_detections ADD COLUMN detect_data TEXT NOT NULL;