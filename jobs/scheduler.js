const cron = require('node-cron');
const db = require('../database'); // Assuming you have a database connection setup

// Function to promote students to the next year in June
const updateStudentsYear = async () => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();

        // Check if it's June (months are zero-indexed, so June is 5)
        if (currentMonth === 5) {
            // Update students who are not in the 4th year
            const query = `UPDATE students SET year_of_study = year_of_study + 1 WHERE year_of_study < 4`;

            const [result] = await db.execute(query);
            console.log('Student years updated successfully!', result);
        }
    } catch (err) {
        console.error('Error updating student years:', err);
    }
};

// Schedule the job to run at midnight on June 1st every year
cron.schedule('0 0 1 6 *', updateStudentsYear);
