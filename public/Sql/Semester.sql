CREATE TABLE Semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    semester_no INT NOT NULL,
    gpa DECIMAL(3,2),
    attendance_percentage DECIMAL(5,2),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);
