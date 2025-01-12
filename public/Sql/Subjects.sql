CREATE TABLE Subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT,
    subject_name VARCHAR(100),
    subject_code VARCHAR(10),
    credits INT,
    FOREIGN KEY (semester_id) REFERENCES Semesters(semester_id) ON DELETE CASCADE
);
