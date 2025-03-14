const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Adjust path as needed to your database connection

// Endpoint to get students by year
router.get('/getStudentsByYear', async (req, res) => {
    const year = req.query.year;
    
    try {
        const [students] = await db.query(
            'SELECT student_id, name FROM students WHERE year_of_study = ?',
            [year]
        );

        res.json(students);
    } catch (error) {
        console.error("Error fetching students by year:", error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

module.exports = router;
