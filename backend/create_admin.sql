-- Script para crear usuario admin
-- Ejecutar en PostgreSQL (pgAdmin, DBeaver, psql, etc.)

INSERT INTO "User" (id, username, password, email, role, "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(), 
  'admin', 
  '$2a$10$gAwBOLAu6CR/v4LWIaq6mO3.toTLtN8FF5RCTS1Dg40JPeYssxGGW', 
  'admin@yellowfleet.cl', 
  'ADMIN', 
  NOW(), 
  NOW()
);

-- Verificar que se creó
SELECT id, username, email, role FROM "User";
