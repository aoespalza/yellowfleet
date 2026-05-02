-- Fix YellowFleet admin password
-- First delete any existing user
DELETE FROM "User" WHERE username = 'admin';

-- Insert admin user with correct bcrypt hash for 'admin123'
-- Hash: $2a$10$gAwBOLAu6CR/v4LWIaq6mO3.toTLtN8FF5RCTS1Dg40JPeYssxGGW
INSERT INTO "User" (id, username, password, email, role, "createdAt", "updatedAt") 
VALUES ('b0000000-0000-0000-0000-000000000001', 'admin', E'\\$2a$10$gAwBOLAu6CR/v4LWIaq6mO3.toTLtN8FF5RCTS1Dg40JPeYssxGGW', 'admin@yellowfleet.com', 'ADMIN', NOW(), NOW());