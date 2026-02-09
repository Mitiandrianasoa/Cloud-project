-- =====================================
-- NETTOYAGE (Optionnel pour repartir à zéro)
-- =====================================
DROP TABLE IF EXISTS block_user CASCADE;
DROP TABLE IF EXISTS sync_meta CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS imageRoadIssues CASCADE;
DROP TABLE IF EXISTS road_issues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- 1. TABLES ROLES
-- =====================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES ('VISITOR'), ('USER'), ('MANAGER');

-- =====================================
-- 2. TABLE USERS (Correction VARCHAR pour Firebase)
-- =====================================
CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY, -- Accepte UUID local ET UID Firebase
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT,
    name VARCHAR(100),
    role_id INT REFERENCES roles(id),
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Compte manager local par défaut
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
-- 3. TABLE ROAD_ISSUES
-- =====================================
CREATE TABLE road_issues (
    id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id VARCHAR(128) REFERENCES users(id), 
    title TEXT NOT NULL,
    description TEXT,
    surface NUMERIC,
    budget NUMERIC,
    company TEXT,
    niveau_danger VARCHAR(20) DEFAULT 'MOYEN', 
    status VARCHAR(20) DEFAULT 'EN_ATTENTE', 
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE imageRoadIssues (
    id SERIAL PRIMARY KEY,
    road_issue_id VARCHAR(128) REFERENCES road_issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

CREATE INDEX idx_road_issues_danger ON road_issues(niveau_danger);

-- =====================================
-- 4. TABLE SYNC_LOGS (Corrigé)
-- =====================================
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(128) NOT NULL, -- Doit être VARCHAR pour les IDs road_issues/users
    action VARCHAR(20) NOT NULL CHECK (action IN ('PUSH','PULL','UPDATE')),
    data JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP
);

-- =====================================
-- 5. TABLE SYNC_META
-- =====================================
CREATE TABLE sync_meta (
    entity VARCHAR(50) PRIMARY KEY,
    last_firebase_log BIGINT DEFAULT 0
);

INSERT INTO sync_meta (entity, last_firebase_log) VALUES ('users', 0), ('road_issues', 0);

-- =====================================
-- 6. TABLE BLOCK_USER
-- =====================================
CREATE TABLE block_user (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, 
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_by VARCHAR(128)
);

CREATE INDEX idx_block_user_uid ON block_user(user_id);

-- =====================================
-- 7. EXEMPLE DE DONNÉES
-- =====================================
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