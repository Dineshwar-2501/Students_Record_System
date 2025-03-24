const express = require("express");
const router = express.Router();
const updateGpaCgpa = require("../utils/updateGpaCgpa");

router.post("/update-gpa-cgpa", async (req, res) => {
    try {
        const { studentId } = req.body;
        await updateGpaCgpa(studentId);
        res.json({ success: true, message: "GPA & CGPA updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating GPA & CGPA:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
