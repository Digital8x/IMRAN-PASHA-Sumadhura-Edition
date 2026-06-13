-- Run these queries to update the existing leads table with advanced tracking fields:

ALTER TABLE leads
ADD COLUMN ip_address VARCHAR(45) NULL AFTER status,
ADD COLUMN city VARCHAR(100) NULL,
ADD COLUMN country VARCHAR(100) NULL,
ADD COLUMN country_code VARCHAR(10) NULL,
ADD COLUMN country_flag VARCHAR(10) NULL,
ADD COLUMN device_type VARCHAR(50) NULL,
ADD COLUMN browser VARCHAR(50) NULL,
ADD COLUMN user_agent TEXT NULL,
ADD COLUMN utm_source VARCHAR(100) NULL,
ADD COLUMN utm_medium VARCHAR(100) NULL,
ADD COLUMN utm_campaign VARCHAR(100) NULL,
ADD COLUMN utm_term VARCHAR(100) NULL,
ADD COLUMN utm_content VARCHAR(100) NULL,
ADD COLUMN refer_url TEXT NULL,
ADD COLUMN page_url TEXT NULL;
