-- SQL Script to create the leads table
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    bhk VARCHAR(50) DEFAULT 'Not Specified',
    message TEXT,
    source VARCHAR(255) DEFAULT 'Website Form',
    status VARCHAR(50) DEFAULT 'New',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
