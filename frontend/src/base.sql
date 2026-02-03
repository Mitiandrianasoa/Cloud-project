-- =====================================
-- INIT SQL pour projet gestion utilisateurs / road issues / logs
-- Compatible synchronisation Firebase
-- =====================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- TABLES ROLES
-- =====================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL -- VISITOR, USER, MANAGER
);

INSERT INTO roles (name) VALUES
('VISITOR'),
('USER'),
('MANAGER');

-- =====================================
-- TABLE USERS
-- =====================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- peut être local UUID ou Firebase UID
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT,            -- pour comptes locaux
    name VARCHAR(100),
    role_id INT REFERENCES roles(id),
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- LOCAL ou FIREBASE
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Compte manager par défaut
INSERT INTO users (id, email, password_hash, name, role_id, provider)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'manager@local.app',
    crypt('ChangeMe123!', gen_salt('bf')),
    'Manager Principal',
    (SELECT id FROM roles WHERE name='MANAGER'),
    'LOCAL'
);

-- =====================================
-- TABLE ROAD_ISSUES (signalements)
-- =====================================DROP TABLE IF EXISTS road_issues;
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(50);
CREATE TABLE road_issues (
    -- On utilise VARCHAR pour accepter les IDs Firebase (ex: "5P4TthUY...") 
    -- tout en gardant une génération auto pour le PUSH local
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Si tes utilisateurs sont aussi synchronisés, VARCHAR est plus prudent ici
    user_id VARCHAR(50), 
    
    title TEXT NOT NULL,
    description TEXT,
    
    -- Métriques pour la gestion de travaux
    surface NUMERIC,
    budget NUMERIC,
    company TEXT,
    
    -- Priorité (Urgent, Moyen, Faible)
    niveau_danger VARCHAR(20) DEFAULT 'MOYEN', 
    
    -- État d'avancement (EN_ATTENTE, VALIDER, TERMINE)
    status VARCHAR(20) DEFAULT 'EN_ATTENTE', 
    
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE imageRoadIssues (
    id SERIAL PRIMARY KEY,
    road_issue_id VARCHAR(50) REFERENCES road_issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);
-- Index pour accélérer les recherches par statut (utile pour les stats)
CREATE INDEX idx_road_issues_danger ON road_issues(niveau_danger);
-- 1. Supprimer la contrainte de clé étrangère temporairement si elle existe dans sync_logs
ALTER TABLE sync_logs ALTER COLUMN entity_id TYPE VARCHAR(50);

-- 2. Changer le type de l'ID dans road_issues
ALTER TABLE road_issues ALTER COLUMN id TYPE VARCHAR(50);

-- 3. Si tu as d'autres tables liées, fais de même.
-- Exemple de signalement initial
INSERT INTO road_issues (user_id, title, description, surface, budget, company, status, latitude, longitude)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Rue principale endommagée',
    'Trou sur la route à proximité du marché central',
    50,
    500000,
    'Entreprise X',
    'NOUVEAU',
    -18.9149,
    47.5316
);

-- =====================================
-- TABLE SYNC_LOGS
-- =====================================
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    entity VARCHAR(50) NOT NULL,          -- user, road_issue
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('PUSH','PULL','UPDATE')),
    data JSONB,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / SUCCESS / FAILED
    created_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP
);

-- =====================================
-- TABLE SYNC_META
-- Pour stocker le dernier log Firebase traité
-- =====================================
CREATE TABLE sync_meta (
    entity VARCHAR(50) PRIMARY KEY,
    last_firebase_log BIGINT DEFAULT 0
);

INSERT INTO sync_meta (entity, last_firebase_log) VALUES
('users', 0),
('road_issues', 0);



