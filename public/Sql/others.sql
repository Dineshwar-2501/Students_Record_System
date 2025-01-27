CREATE TABLE login.login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    role ENUM('student', 'proctor') NOT NULL,
    attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    grade VARCHAR(2) NOT NULL,
    FOREIGN KEY (studentId) REFERENCES students(id)
);

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE login.proctors;
TRUNCATE TABLE login.students;
SET FOREIGN_KEY_CHECKS = 1;

select * from student_academics;
CREATE TABLE student_academics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    regid VARCHAR(50),
    subject VARCHAR(255),
    credit INT,
    sub_code VARCHAR(50),
    semester INT NULL,
    year INT NULL,
    attendance_1 INT NULL,
    attendance_2 INT NULL,
    test_1 INT NULL,
    test_2 INT NULL,
    grades VARCHAR(5) NULL,
    internal_marks INT NULL,
    FOREIGN KEY (regid) REFERENCES students(regid) ON DELETE CASCADE
    
);

CREATE TABLE semester_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    credit INT NOT NULL,
    UNIQUE (semester, subject_code) -- Prevent duplicate subjects for the same semester
    
);
INSERT INTO semester_subjects (semester, subject_name, subject_code, credit)
VALUES
-- Semester 1
(1, 'Mathematics 1', 'MATH101', 4),
(1, 'Physics 1', 'PHYS101', 3),
(1, 'Chemistry 1', 'CHEM101', 3),
(1, 'English 1', 'ENG101', 2),
(1, 'Computer Programming', 'CS101', 4),

-- Semester 2
(2, 'Mathematics 2', 'MATH102', 4),
(2, 'Physics 2', 'PHYS102', 3),
(2, 'Chemistry 2', 'CHEM102', 3),
(2, 'English 2', 'ENG102', 2),
(2, 'Data Structures', 'CS102', 4),

-- Semester 3
(3, 'Mathematics 3', 'MATH201', 4),
(3, 'Digital Logic', 'ECE201', 3),
(3, 'Object-Oriented Programming', 'CS201', 4),
(3, 'Database Management Systems', 'CS202', 3),
(3, 'Software Engineering', 'CS203', 3),

-- Semester 4
(4, 'Discrete Mathematics', 'MATH202', 4),
(4, 'Operating Systems', 'CS301', 4),
(4, 'Computer Networks', 'CS302', 3),
(4, 'Microprocessors', 'ECE202', 3),
(4, 'Theory of Computation', 'CS303', 3),

-- Semester 5
(5, 'Artificial Intelligence', 'CS401', 4),
(5, 'Machine Learning', 'CS402', 4),
(5, 'Web Development', 'CS403', 3),
(5, 'Cloud Computing', 'CS404', 3),
(5, 'Cybersecurity', 'CS405', 3),

-- Semester 6
(6, 'Compiler Design', 'CS501', 4),
(6, 'Data Mining', 'CS502', 4),
(6, 'Big Data Analytics', 'CS503', 3),
(6, 'IoT', 'CS504', 3),
(6, 'Blockchain Technology', 'CS505', 3),

-- Semester 7
(7, 'Advanced Algorithms', 'CS601', 4),
(7, 'Distributed Systems', 'CS602', 4),
(7, 'Mobile App Development', 'CS603', 3),
(7, 'DevOps', 'CS604', 3),
(7, 'Research Project 1', 'CS605', 3),

-- Semester 8
(8, 'Deep Learning', 'CS701', 4),
(8, 'Quantum Computing', 'CS702', 4),
(8, 'Ethical Hacking', 'CS703', 3),
(8, 'Natural Language Processing', 'CS704', 3),
(8, 'Research Project 2', 'CS705', 3);

ALTER TABLE student_academics
ADD CONSTRAINT unique_student_subject
UNIQUE (student_id, semester, subject_code);

ALTER TABLE student_academics
RENAME COLUMN year TO year_of_study;

select* from semester_subjects;

ALTER TABLE student_academics
MODIFY COLUMN attendance_1 FLOAT DEFAULT NULL,
MODIFY COLUMN attendance_2 FLOAT DEFAULT NULL,
MODIFY COLUMN test_1 FLOAT DEFAULT NULL,
MODIFY COLUMN test_2 FLOAT DEFAULT NULL,
MODIFY COLUMN grade VARCHAR(2) DEFAULT NULL,
MODIFY COLUMN internal_marks INT DEFAULT NULL;

ALTER TABLE student_academics
ADD PRIMARY KEY (student_id, regid);
ALTER TABLE student_academics
DROP PRIMARY KEY;
ALTER TABLE student_academics
ADD UNIQUE KEY unique_student_academic (student_id, regid, subject_code, semester);



