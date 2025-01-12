CREATE TABLE Achievements (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    achievement_name VARCHAR(255),
    upload_date DATE,
    certificate_url VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);
