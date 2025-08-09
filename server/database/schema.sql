-- Survey Platform Database Schema

-- Users table (survey creators and respondents)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Surveys table
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_responses BOOLEAN DEFAULT false,
    requires_login BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'radio', 'checkbox', 'dropdown', 'rating', 'scale', 'date', 'email'
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    options JSONB, -- For storing multiple choice options, rating scales, etc.
    validation_rules JSONB, -- Min/max length, regex patterns, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question options (alternative to storing in JSONB)
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(500) NOT NULL,
    option_value VARCHAR(255),
    order_index INTEGER NOT NULL
);

-- Conditional logic rules
CREATE TABLE question_conditions (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    source_question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    target_question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    condition_type VARCHAR(20) NOT NULL, -- 'show_if', 'hide_if', 'skip_to'
    condition_operator VARCHAR(20) NOT NULL, -- 'equals', 'not_equals', 'contains', 'greater_than', 'less_than'
    condition_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey responses (completed surveys)
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    respondent_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous
    respondent_email VARCHAR(255), -- For anonymous responses
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    is_complete BOOLEAN DEFAULT false
);

-- Individual question answers
CREATE TABLE question_answers (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_value VARCHAR(255),
    selected_options JSONB, -- For multiple choice answers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_surveys_creator ON surveys(creator_id);
CREATE INDEX idx_questions_survey ON questions(survey_id);
CREATE INDEX idx_questions_order ON questions(survey_id, order_index);
CREATE INDEX idx_question_conditions_survey ON question_conditions(survey_id);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_question_answers_response ON question_answers(response_id);
CREATE INDEX idx_question_answers_question ON question_answers(question_id);

-- Sample data for testing
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@example.com', '$2b$10$hash', 'Admin User', 'admin'),
('user@example.com', '$2b$10$hash', 'Test User', 'user');