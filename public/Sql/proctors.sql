CREATE TABLE proctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    designation VARCHAR(255) NOT NULL,
    staffId VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from login.proctors;
ALTER TABLE proctors ADD proctorcode int DEFAULT 1307; 
ALTER TABLE proctors RENAME COLUMN id TO proctor_id;

ALTER TABLE   proctors DROP COLUMN proctorcode; 