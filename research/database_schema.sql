-- Therapeuten CRM Datenbank Schema
-- PostgreSQL / Supabase kompatibel

-- Therapeuten (Nutzer)
CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    practice_name VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, cancelled
    subscription_expires_at TIMESTAMP
);

-- Patienten
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    email VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sitzungen (Termine)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    notes TEXT,
    transcription_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audio-Transkriptionen
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    audio_file_path VARCHAR(500) NOT NULL,
    raw_transcript TEXT,
    summary TEXT,
    duration_seconds INTEGER,
    language VARCHAR(10) DEFAULT 'de',
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Termine (Cal.com Integration)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    cal_com_event_id VARCHAR(255),
    appointment_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Templates für Zusammenfassungen
CREATE TABLE summary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log (Datenschutz/Compliance)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_transcriptions_therapist ON transcriptions(therapist_id);
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
