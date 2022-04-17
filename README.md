# Backend for a face recognition app using Node.js, React and the Clarifai API

# Data can be stored in PostgreSQL (default) or in mongoDB.

# Create a server.env
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
