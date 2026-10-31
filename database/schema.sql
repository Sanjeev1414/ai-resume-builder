-- =====================================================================
--  AI Resume Builder - database setup (MySQL 8+)
-- =====================================================================
--  Run once as an admin user (e.g. root):
--      mysql -u root -p < database/schema.sql
--  or open this file in MySQL Workbench and click "Execute".
--
--  It creates:
--    1. the database   resume_analyzer
--    2. an app user    resume_app  (change the password below!)
--    3. all tables, indexes and foreign keys
--
--  Then start the backend with:
--      SPRING_PROFILES_ACTIVE=mysql  DB_USERNAME=resume_app  DB_PASSWORD=<the password below>
--
--  Safe to re-run: everything uses IF NOT EXISTS.
--  (The app can also create these tables itself on first start - this
--   script is for setting the database up by hand.)
-- =====================================================================

-- ---------- 1. Database ----------
CREATE DATABASE IF NOT EXISTS resume_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ---------- 2. Application user ----------
-- Change 'ChangeMe_Strong#Pass1' to your own strong password.
CREATE USER IF NOT EXISTS 'resume_app'@'%' IDENTIFIED BY 'ChangeMe_Strong#Pass1';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON resume_analyzer.* TO 'resume_app'@'%';
FLUSH PRIVILEGES;

USE resume_analyzer;

-- ---------- 3. Tables ----------

-- Registered users. Passwords are stored only as BCrypt hashes.
CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    email               VARCHAR(254) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    password_changed_at DATETIME(6)  NULL,      -- login tokens issued before this are rejected
    created_at          DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB;

-- One-time password reset links (only a SHA-256 hash of the token is stored).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at    DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Resume analyses (AI match score + ATS check). result_json holds the full AI report.
CREATE TABLE IF NOT EXISTS analyses (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    resume_file_name VARCHAR(255) NOT NULL,
    job_description  LONGTEXT     NOT NULL,
    match_score      INT          NOT NULL,
    result_json      LONGTEXT     NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_analyses_user (user_id, created_at),
    CONSTRAINT fk_analyses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- The resume PDF behind each analysis, and the AI-tailored resume generated from it (one per analysis).
CREATE TABLE IF NOT EXISTS analysis_resumes (
    analysis_id   BIGINT      NOT NULL,
    pdf           LONGBLOB    NOT NULL,
    tailored_json LONGTEXT    NULL,
    tailored_at   DATETIME(6) NULL,
    PRIMARY KEY (analysis_id),
    CONSTRAINT fk_analysis_resumes_analysis FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- AI-generated cover letters (editable by the user).
CREATE TABLE IF NOT EXISTS cover_letters (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    company_name VARCHAR(120) NULL,
    job_title    VARCHAR(120) NULL,
    tone         VARCHAR(20)  NOT NULL,             -- professional | enthusiastic | concise
    subject      VARCHAR(255) NOT NULL,
    content      LONGTEXT     NOT NULL,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_cover_letters_user (user_id, created_at),
    CONSTRAINT fk_cover_letters_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- AI interview question sets. result_json holds focus areas + questions.
CREATE TABLE IF NOT EXISTS interview_preps (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    job_title    VARCHAR(120) NULL,
    company_name VARCHAR(120) NULL,
    result_json  LONGTEXT     NOT NULL,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_interview_preps_user (user_id, created_at),
    CONSTRAINT fk_interview_preps_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Job tracker entries.
CREATE TABLE IF NOT EXISTS job_applications (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    company    VARCHAR(120) NOT NULL,
    role       VARCHAR(120) NOT NULL,
    status     ENUM ('WISHLIST','APPLIED','INTERVIEW','OFFER','REJECTED') NOT NULL,
    location   VARCHAR(120) NULL,
    job_url    VARCHAR(500) NULL,
    applied_on DATE         NULL,
    notes      LONGTEXT     NULL,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_job_applications_user (user_id, updated_at),
    CONSTRAINT fk_job_applications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Resume Builder drafts (one per user, stored as the form's JSON).
CREATE TABLE IF NOT EXISTS resume_documents (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    data_json  LONGTEXT    NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_resume_documents_user UNIQUE (user_id),
    CONSTRAINT fk_resume_documents_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------- Check ----------
SHOW TABLES;
