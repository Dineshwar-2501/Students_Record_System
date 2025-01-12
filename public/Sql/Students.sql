CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255) NOT NULL,
    batch VARCHAR(255) NOT NULL,
    regid VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from login.students;
ALTER TABLE students ADD (proctor_id INT,
    FOREIGN KEY (proctor_id) REFERENCES Proctors(proctor_id) ON DELETE SET NULL
) ;
ALTER TABLE students RENAME COLUMN id TO student_id