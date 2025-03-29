-- Schema for telegram anonymous chat app database
-- This will create collections for users, chats and searching_users

-- Create users table (for document-style storage)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create searching_users table
CREATE TABLE IF NOT EXISTS searching_users (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create store_items table
CREATE TABLE IF NOT EXISTS store_items (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger to update the updated_at timestamp on all tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all tables
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_chats_timestamp
BEFORE UPDATE ON chats
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_searching_users_timestamp
BEFORE UPDATE ON searching_users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_groups_timestamp
BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_store_items_timestamp
BEFORE UPDATE ON store_items
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS users_key_idx ON users (key);
CREATE INDEX IF NOT EXISTS chats_key_idx ON chats (key);
CREATE INDEX IF NOT EXISTS searching_users_key_idx ON searching_users (key);
CREATE INDEX IF NOT EXISTS groups_key_idx ON groups (key);
CREATE INDEX IF NOT EXISTS store_items_key_idx ON store_items (key);