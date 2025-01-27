// Load environment variables from .env file
require('dotenv').config();

// Load scheduler
require('./jobs/scheduler');

// Required modules
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const mysql12 = require('mysql2/promise'); // Use promise-based MySQL2
const { sendMail } = require('./utils/email');
const fs = require('fs');
const multer = require('multer');
const csvParser = require('csv-parser');
const db = require('./config/database');

// Create an Express app
const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;


// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

// Serve static files (HTML and CSS)
app.use(express.static(path.join(__dirname, 'public')));

const router = express.Router();
const proctorRoutes = require('./routes/proctorRoutes');
app.use(proctorRoutes);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});
// Static files from public folder
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session setup
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure:false ,maxAge: 3600000 } // Default to 1 hour
}));

// Import your database config and connect

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
//console.log(process.env)

db.getConnection()
    .then(connection => {
        console.log('Connected to MySQL Database');
        connection.release(); 
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err);
    });


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/registerStudent', (req, res) => res.sendFile(path.join(__dirname, 'public', 'registerStudent.html')));
app.get('/registerProctor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'registerProctor.html')));
app.get('/forgotpassword', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgotpassword.html')));
app.get('/resetpassword', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resetpassword.html')));
app.get('/proctorDashboard', (req, res) => {
    console.log('Accessing Proctor Dashboard. Session Info:', req.session);
    
    if (req.session.userId && req.session.role === 'proctor') {
        console.log('Proctor authorized. Loading dashboard...');
        res.sendFile(path.join(__dirname, 'public', 'proctorDashboard.html'));
    } else {
        console.log('Unauthorized access attempt to Proctor Dashboard. Redirecting to login.');
        res.redirect('/');
    }
});
app.get('/getProctorStudents', async (req, res) => {
    try {
        const query = `
            SELECT proctor_id, regid, name 
            FROM students
            ORDER BY proctor_id, regid
        `;

        // Use `await` to handle promise-based queries
        const [results] = await db.query(query);

        res.send(results);
    } catch (err) {
        console.error('Error fetching proctor and students:', err);
        res.status(500).send({ message: 'Database query failed.' });
    }
});

app.get('/getStudentTableTemplate', (req, res) => {
    res.json({ subjects: global.tableTemplate || [] });
});

app.get('/studentDashboard', (req, res) => {
    console.log('Accessing Student Dashboard. Session Info:', req.session);

    if (req.session.userId && req.session.role === 'student') {
        console.log('Student authorized. Loading dashboard...');
        res.sendFile(path.join(__dirname, 'public', 'studentDashboard.html'));
    } else {
        console.log('Unauthorized access attempt to Student Dashboard. Redirecting to login.');
        res.redirect('/');
    }
});

app.get('/getStudentsByYear/:year_of_study', async (req, res) => {
    const year_of_study = req.params.year_of_study; // Get the year_of_study from the URL parameters
    console.log(`Fetching students for year_of_study: ${year_of_study}`);
    try {
        const sql = 'SELECT student_id, regid, name FROM students WHERE year_of_study = ?'; // Ensure 'year_of_study' exists
        const [rows] = await db.execute(sql, [year_of_study]);
        res.json(rows); // Return the list of students in JSON format
    } catch (error) {
        console.error('Error fetching students by year_of_study:', error);
        res.status(500).json({ message: 'Error fetching students.' });
    }
});

// Endpoint to assign proctor to students
app.post('/assignProctor', async (req, res) => {
    const { students } = req.body;
    const proctor_id = req.session.proctor_id; // Retrieve proctor_id from session

    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'No students selected for assignment.' });
    }

    if (!proctor_id) {
        return res.status(400).json({ message: 'Proctor ID is required.' });
    }

    try {
        await Promise.all(students.map(async (studentId) => {
            const sql = 'UPDATE students SET proctor_id = ? WHERE student_id = ?';
            await db.execute(sql, [proctor_id, studentId]);
        }));

        res.json({ message: 'Proctor assigned successfully.' });
    } catch (error) {
        console.error('Error assigning proctor:', error);
        res.status(500).json({ message: 'An error occurred while assigning the proctor.' });
    }
});


app.get('/getProctorDetails', async (req, res) => {
    try {
        const proctorId = req.session.userId; // Retrieve from session
        const [proctor] = await db.execute('SELECT name, designation FROM proctors WHERE proctor_id = ?', [proctorId]);
        const [students] = await db.execute('SELECT student_id, name FROM students WHERE proctor_id = ?', [proctorId]);
        
        if (proctor[0]) {
            res.json({
                proctorName: proctor[0].name,
                designation: proctor[0].designation,
                students
            });
        } else {
            res.status(404).json({ message: "Proctor not found" });
        }
    } catch (error) {
        console.error("Error retrieving proctor details:", error);
        res.status(500).json({ message: "An error occurred while fetching proctor details" });
    }
});

app.get('/getStudentDetails/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const [student] = await db.execute('SELECT * FROM students WHERE student_id = ?', [studentId]);
        if (student[0]) {
            res.json(student[0]);
        } else {
            res.status(404).json({ message: "Student not found" });
        }
    } catch (error) {
        console.error("Error retrieving student details:", error);
        res.status(500).json({ message: "An error occurred while fetching student details" });
    }
});

// fuck with this menu
// Endpoint to get assigned students (Existing)
app.get('/api/getAssignedStudents', async (req, res) => {
    try {
        // Assuming `userId` is the proctor's ID stored in the session after login
        const proctorId = req.session.userId;

        // Fetch proctor's information
        const [proctorResult] = await db.execute(
            'SELECT name, designation FROM proctors WHERE proctor_id = ?',
            [proctorId]
        );

        if (proctorResult.length === 0) {
            return res.status(404).json({ message: 'Proctor not found.' });
        }

        const proctor = proctorResult[0];

        // Fetch assigned students
        const [students] = await db.execute(
            'SELECT student_id, name FROM students WHERE proctor_id = ?',
            [proctorId]
        );

        // Respond with the proctor info and list of students
        res.json({ proctor, students });
    } catch (error) {
        console.error('Error fetching assigned students:', error);
        res.status(500).json({ message: 'An error occurred while fetching assigned students.' });
    }
});

app.get('/getStudentAndSubjects/:studentId', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        // Fetch the student's data from the students table
        const [studentData] = await db.query(
            'SELECT year_of_study, regid, student_id FROM students WHERE student_id = ?',
            [studentId]
        );

        if (studentData.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const studentYear = studentData[0].year_of_study;

        // Validate student year
        if (!studentYear || studentYear < 1 || studentYear > 4) {
            return res.status(400).json({ error: 'Invalid or missing year of study for the student.' });
        }

        // Determine semesters based on student year
        const semesters = [
            studentYear * 2 - 1, // Odd semester for the year
            studentYear * 2      // Even semester for the year
        ];

        // Fetch subjects based on the calculated semesters
        const [subjects] = await db.query(
            'SELECT semester, subject_name, subject_code, credit FROM semester_subjects WHERE semester IN (?)',
            [semesters]
        );

        // Return the student and subjects data
        res.status(200).json({
            success: true,
            data: {
                student: studentData[0],
                subjects
            }
        });
    } catch (error) {
        console.error('Error fetching student and subjects:', error);
        res.status(500).json({ error: 'Failed to fetch student data.' });
    }
});

// Check if a student has a proctor
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/check-proctor', async (req, res) => {
    const studentId = req.session.userId; // Assume student ID is stored in session
    if (!studentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = 'SELECT proctor_id FROM students WHERE student_id = ?';
    try {
        const [results] = await db.execute(query, [studentId]);
        const hasProctor = results.length > 0 && results[0].proctor_id !== null;
        res.json({ hasProctor });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
    }
});
// Hidden Button|| Don't need This
app.post('/api/select-proctor', async (req, res) => {
    const studentId = req.session.userId; // Assume student ID is stored in session
    const { proctorId } = req.body;
    console.log("Student ID:", studentId);
    console.log("Proctor ID:", proctorId);
    if (!studentId || !proctorId) {
        return res.status(400).json({ success: false, message: 'Bad Request: Missing student or proctor ID.' });
    }

    try {
        // Check if the student already has a proctor assigned
        const [existingProctor] = await db.execute(
            'SELECT proctor_id FROM students WHERE student_id = ?', 
            [studentId]
        );

        if (existingProctor.length > 0 && existingProctor[0].proctor_id) {
            return res.json({ success: false, message: 'Proctor already assigned.' });
        }

        // Update the student's proctor_id
        const [results] = await db.execute(
            'UPDATE students SET proctor_id = ? WHERE student_id = ?', 
            [proctorId, studentId]
        );

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Proctor selected successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Student not found or no changes made.' });
        }
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
    }
});

// Name of student  and proctor acquired
app.get('/api/student-dashboard-info', async (req, res) => {
    const studentId = req.session.userId;

    if (!studentId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const [results] = await db.execute(
            `SELECT students.name AS studentName, proctors.name AS proctorName 
             FROM students 
             LEFT JOIN proctors ON students.proctor_id = proctors.proctor_id 
             WHERE students.student_id = ?`, 
            [studentId]
        );

        if (results.length > 0) {
            const { studentName, proctorName } = results[0];
            res.json({ studentName, proctorName });
        } else {
            res.status(404).json({ message: 'Student or proctor not found' });
        }
    } catch (error) {
        console.error('Error fetching dashboard info:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

//Select students manualy 



// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

//POST

// Handle student registration
app.post('/registerStudent', async (req, res) => {
    const { name, email, department,batch, year_of_study, regid, password } = req.body;

    try {
        // Check if Register No. is unique
        const [existingStudent] = await db.execute('SELECT * FROM students WHERE regid = ?', [regid]);
        if (existingStudent.length > 0) {
            return res.status(400).send('Register No. already exists!');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new student
        await db.execute('INSERT INTO students (name, email, department, batch, year_of_study, regid, password) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [name, email, department, batch, year_of_study, regid, hashedPassword]);

        res.status(200).send('Student registered successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Handle Proctor registration
app.post('/registerProctor', async (req, res) => {
    const { name, email, designation, staffId, password } = req.body;

    try {
        // Check if Staff ID is unique
        const [existingProctor] = await db.execute('SELECT * FROM proctors WHERE staffId = ?', [staffId]);
        if (existingProctor.length > 0) {
            return res.status(400).send('Staff ID already exists!');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new proctor into database
        await db.execute('INSERT INTO proctors (name, email, designation, staffId, password) VALUES (?, ?, ?, ?, ?)', 
        [name, email, designation, staffId, hashedPassword]);

        res.status(200).send('Proctor registered successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

//login route
app.post('/login', async (req, res) => {
    const { email, pswd, role, rememberMe } = req.body;
    console.log('Login attempt:', { email, role });

    try {
        let user;

        // Fetch user based on the role
        if (role === 'student') {
            const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
            user = rows[0];
        } else if (role === 'proctor') {
            const [rows] = await db.execute('SELECT * FROM proctors WHERE email = ?', [email]);
            user = rows[0];
        } else {
            return res.status(400).json({ message: 'Invalid role selected!' });
        }

        console.log('Retrieved user:', user);
        
        if (!user) {
            return res.status(400).json({ message: 'User not found!' });
        }

        // Check if password is provided
        if (!pswd) {
            return res.status(400).json({ message: 'Password is required!' });
        }

        // Check password
        const match = await bcrypt.compare(pswd, user.password);
        console.log('User Password Hash:', user.password);
        console.log('Entered Password:', pswd);

        if (match) {
            // Store user ID and role in session
            req.session.userId = role === 'proctor' ? user.proctor_id : user.student_id;
            req.session.role = role;

            // Set cookie expiration if 'rememberMe' is checked
            if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 3600000; // 30 days
            }
            if (role === 'proctor') {
                req.session.proctor_id = user.proctor_id;
            }
            

            // Define redirection URL based on the role
            const redirectUrl = role === 'student' ? '/studentDashboard' : '/proctorDashboard';

            // Send the user ID along with the response
            const responseUserId = role === 'proctor' ? user.proctor_id : user.student_id;
            
            req.session.save(() => {
                console.log('Session after login:', req.session);
                res.status(200).json({
                    success: true,
                    role,
                    message: 'Login successful!',
                    redirectUrl,
                    userId: responseUserId
                });
            });
            
        } else {
            console.log(`Invalid password attempt for user: ${email}`);

            return res.status(400).json({ message: 'Invalid password!' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'An error occurred, please try again.' });
    }
});
// app.get('/proctorListPage', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'proctorList.html'));
// });

// Proctor List Route
app.get('/proctorList', async (req, res) => {
    try {
        const [proctors] = await db.execute('SELECT proctor_id, name FROM proctors');
        res.json(proctors);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

const rateLimiter = require('express-rate-limit'); // Optional: Rate limiting middleware

// Apply rate limiter to the forgot password route
const forgotPasswordLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 5 requests per windowMs
    message: 'Too many password reset attempts. Please try again later.',
});

app.post('/forgotpassword', forgotPasswordLimiter, async (req, res) => {
    const { email, role } = req.body;

    // Validate role
    if (!['student', 'proctor'].includes(role)) {
        return res.status(400).send('Invalid role provided');
    }

    const tableName = role === 'proctor' ? 'proctors' : 'students';

    try {
        // Check if user exists
        const [results] = await db.execute(`SELECT * FROM ${tableName} WHERE email = ?`, [email]);
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Generate reset code
        const code = Math.floor(Math.random() * 900000) + 100000; // 6-digit random code

        // Update reset code and expiry in the database
        await db.execute(
            `UPDATE ${tableName} 
             SET reset_code = ?, reset_code_expiry = NOW() + INTERVAL 15 MINUTE 
             WHERE email = ?`,
            [code, email]
        );

        // Send email with reset code
        try {
            await sendMail(
                email,
                'Password Reset Code',
                `Your password reset code is ${code}. It will expire in 15 minutes.`
            );
            return res.json({ message: 'Reset code sent to your email' });
        } catch (mailError) {
            console.error('Error sending reset email:', mailError);
            return res.status(500).send('Failed to send reset email. Please try again.');
        }
    } catch (error) {
        console.error('Error in forgot password:', error);
        return res.status(500).send('Server error');
    }
});


// Handle Reset Password
app.post('/resetpassword', async (req, res) => {
    const { email, role, code, newPassword } = req.body;
    const tableName = role === 'proctor' ? 'proctors' : 'students';

    try {
        const [results] = await db.execute(`SELECT * FROM ${tableName} WHERE email = ? AND reset_code = ? AND reset_code_expiry > NOW()`, [email, code]);

        if (results.length === 0) {
            return res.status(400).send('Invalid or expired reset code');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(`UPDATE ${tableName} SET password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?`, [hashedPassword, email]);

        return res.json({ message: 'SuccessFully resetted' }); // Respond with a message

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Server error');
    }
});

// Route for importing student data
app.post('/importStudentData', upload.single('studentFile'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    if (req.file.mimetype === 'text/csv') {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        // Validate the student data
                        if (!row.email.endsWith('@jerusalemengg.ac.in') || !/^[a-zA-Z]+$/.test(row.name)) {
                            throw new Error('Invalid email or name format for student.');
                        }
                        if (!/^\d+$/.test(row.regid)) {
                            throw new Error('Register No should be numeric.');
                        }
                        if (!row.password) {
                            throw new Error('Password is required for student.');
                        }

                        // Encrypt the password
                        const hashedPassword = await bcrypt.hash(row.password, saltRounds);

                        // Insert the student into the database
                        await db.execute(
                            'INSERT INTO students (name,email,department,batch,regid,password,year_of_study) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [row.name, row.email, row.department,row.batch,row.regid, hashedPassword,row.year_of_study]
                        );
                    }
                    res.send('Student data imported successfully.');
                } catch (error) {
                   
                    const errorMessage=error.sqlMessage|| 'Error importing student data.';
                    res.status(500).send({message:errorMessage,error:error.message});
                } finally {
                    // Cleanup: Delete the uploaded file after processing
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting uploaded student file:', err);
                        }
                    });
                }
            });
    } else {
        res.status(400).send('Invalid file type. Please upload a CSV file for students.');
    }
});

// Route for importing proctor data
app.post('/importProctorData', upload.single('proctorFile'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    if (req.file.mimetype === 'text/csv') {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        // Validate the proctor data
                        if (!row.email.endsWith('@jerusalemengg.ac.in') || !/^[a-zA-Z]+$/.test(row.name)) {
                            throw new Error('Invalid email or name format for proctor.');
                        }
                        if (!/^\d{4}$/.test(row.staffid)) {
                            throw new Error('Staff ID should be exactly 4 digits.');
                        }
                        if (!row.password) {
                            throw new Error('Password is required for proctor.');
                        }

                        // Encrypt the password
                        const hashedPassword = await bcrypt.hash(row.password, saltRounds);

                        // Insert the proctor into the database
                        await db.execute(
                            'INSERT INTO proctors (name,email,password,staffid,designation) VALUES (?, ?, ?, ?, ?)',
                            [row.name, row.email, hashedPassword, row.staffid,row.designation]
                        );
                    }
                    res.send('Proctor data imported successfully.');
                } catch (error) {
                   
                    const errorMessage=error.sqlMessage|| 'Error importing proctor data.';
                    res.status(500).send({message:errorMessage,error:error.message});
                } finally {
                    // Cleanup: Delete the uploaded file after processing
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting uploaded proctor file:', err);
                        }
                    });
                }
            });
    } else {
        res.status(400).send('Invalid file type. Please upload a CSV file for proctors.');
    }
});

// Save academic data for a student
app.post('/saveStudentAcademics', async (req, res) => {
    const { studentId, academicData } = req.body;

    if (!studentId || !academicData || academicData.length === 0) {
        return res.status(400).json({ message: 'Invalid data or missing parameters.' });
    }

    try {
        const values = academicData.map(data => [
            studentId,
            data.regid,
            data.subject,
            data.subject_code,
            data.credit,
            data.semester,
            data.year_of_study,
            data.attendance_1 || null,
            data.attendance_2 || null,
            data.test_1 || null,
            data.test_2 || null,
            data.grades || null,
            data.internal_marks || null,
        ]);

        const query = `
            INSERT INTO student_academics 
            (student_id, regid, subject, subject_code, credit, semester, year_of_study, 
            attendance_1, attendance_2, test_1, test_2, grades, internal_marks)
            VALUES ? 
            ON DUPLICATE KEY UPDATE
                subject = VALUES(subject),
                subject_code = VALUES(subject_code),
                credit = VALUES(credit),
                semester = VALUES(semester),
                year_of_study = VALUES(year_of_study),
                attendance_1 = COALESCE(VALUES(attendance_1), attendance_1),
                attendance_2 = COALESCE(VALUES(attendance_2), attendance_2),
                test_1 = COALESCE(VALUES(test_1), test_1),
                test_2 = COALESCE(VALUES(test_2), test_2),
                grades = COALESCE(VALUES(grades), grades),
                internal_marks = COALESCE(VALUES(internal_marks), internal_marks);
        `;

        const flatValues = values;
        await db.query(query, [flatValues]);

        res.json({ message: 'Student academic data saved successfully.' });
    } catch (error) {
        console.error('Error saving academic data:', error);
        res.status(500).json({ message: 'Failed to save academic data.' });
    }
});

app.post('/uploadMarks', upload.single('marksFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;  // Path to the uploaded file
    const marksData = [];

    // Read and parse the CSV file
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            marksData.push({
                regid: row.regid?.trim(),
                subject_code: row.subject_code?.trim(),
                test1: row.test1 ? parseInt(row.test1.trim(), 10) : null,
                test2: row.test2 ? parseInt(row.test2.trim(), 10) : null,
                attendance1: row.attendance1 ? parseInt(row.attendance1.trim(), 10) : null,
                attendance2: row.attendance2 ? parseInt(row.attendance2.trim(), 10) : null,
                grade: row.grade?.trim(),
                internal_marks: row.internal_marks ? parseInt(row.internal_marks.trim(), 10) : null,
                semester: parseInt(row.semester?.trim(), 10),
            });
        })
        .on('end', async () => {
            console.log('CSV parsing completed:', marksData);

            try {
                // Insert or update marks in the database
                const query = `
                    INSERT INTO marks(regid, subject_code, test1, test2, attendance1, attendance2, grade, internal_marks, semester)
                    VALUES ?
                    ON DUPLICATE KEY UPDATE
                        test1 = VALUES(test1),
                        test2 = VALUES(test2),
                        attendance1 = VALUES(attendance1),
                        attendance2 = VALUES(attendance2),
                        grade = VALUES(grade),
                        internal_marks = VALUES(internal_marks)
                `;

                // Prepare data for bulk insertion into the database
                const values = marksData.map((row) => [
                    row.regid,
                    row.subject_code,
                    row.test1,
                    row.test2,
                    row.attendance1,
                    row.attendance2,
                    row.grade,
                    row.internal_marks,
                    row.semester,
                ]);

                // Assuming you have a `db.query` method to interact with your database
                await db.query(query, [values]);

                // Delete the uploaded file after processing
                fs.unlinkSync(filePath);

                res.json({ message: 'Marks data uploaded and updated successfully.' });
            } catch (error) {
                console.error('Error updating marks data:', error);
                res.status(500).json({ message: 'Error updating marks data.' });
            }
        })
        .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            res.status(500).json({ message: 'Failed to parse CSV file.' });
        });
});

app.post('/addSubject', async (req, res) => {
    const { semester, subject_name, subject_code, credit } = req.body;

    if (!semester || !subject_name || !subject_code || !credit) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        await db.query(`
            INSERT INTO semester_subjects (semester, subject_name, subject_code, credit)
            VALUES (?, ?, ?, ?)`,
            [semester, subject_name, subject_code, credit]
        );

        res.json({ message: 'Subject added successfully.' });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ message: 'Error adding subject.' });
    }
});

app.post('/deleteSubject', async (req, res) => {
    const { semester, subject_code } = req.body;

    if (!semester || !subject_code) {
        return res.status(400).json({ message: 'Semester and Subject Code are required.' });
    }

    try {
        await db.query(`
            DELETE FROM semester_subjects
            WHERE semester = ? AND subject_code = ?`,
            [semester, subject_code]
        );

        res.json({ message: 'Subject deleted successfully.' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Error deleting subject.' });
    }
});

app.post('/deleteProctorAssignments', async (req, res) => {
    try {
        const proctorId = req.session.userId; // Proctor ID from session

        await db.query(`
            UPDATE students
            SET proctor_id = NULL
            WHERE proctor_id = ?`,
            [proctorId]
        );

        res.json({ message: 'Proctor assignments deleted successfully.' });
    } catch (error) {
        console.error('Error deleting proctor assignments:', error);
        res.status(500).json({ message: 'Error deleting proctor assignments.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});




