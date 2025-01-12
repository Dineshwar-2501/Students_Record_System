CREATE TABLE Marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    test1 INT,
    test1_attendance DECIMAL(5,2),
    test2 INT,
    test2_attendance DECIMAL(5,2),
    test3 INT,
    test3_attendance DECIMAL(5,2),
    internal_marks INT,
    grade CHAR(2),
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
);
