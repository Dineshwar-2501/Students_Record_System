require('dotenv').config();// Load environment variables from .env file
require('./jobs/scheduler');// Load scheduler of students year

// Required modules
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const mysql12 = require('mysql2/promise'); 
const { sendMail } = require('./utils/email');
const fs = require('fs');
const multer = require('multer');
const csvParser = require('csv-parser');
const db = require('./config/database');
const csv = require('csv-parser');
const crypto = require("crypto");
const router = express.Router();
const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;
const studentRoutes = require("./routes/StudentRoutes");
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, PDF, and CSV are allowed!'), false);
    }
};


const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter, // Allow up to 5MB files
});

// Middleware Setup
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/", studentRoutes); // Use student routes
app.use("/uploads", express.static("uploads"));



// Load Routes After Middleware
const proctorRoutes = require('./routes/proctorRoutes');
app.use(proctorRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});


// Session setup
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,  // Set to true if using HTTPS
        httpOnly: true, 
        maxAge: 3600000 
    }
}));


function checkAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

app.get('/studentDashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'studentDashboard.html'));
});

app.get('/proctorDashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'proctorDashboard.html'));
});

app.get('/adminDashboard', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'adminDashboard.html'));
});

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

//routes to pages
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
app.get('/adminDashboard', (req, res) => {
    console.log('Accessing Admin Dashboard. Session Info:', req.session);
    
    if (req.session.userId && req.session.role === 'admin') {
        console.log('Admin authorized. Loading dashboard...');
        res.sendFile(path.join(__dirname, 'public', 'adminDashboard.html'));
    } else {
        console.log('Unauthorized access attempt to admin Dashboard. Redirecting to login.');
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


// Endpoint to get assigned students (Existing)


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
    try {
        console.log("🔥 Received Student Registration Data:", req.body); // Debugging log

        const { name, email, department, batch, year_of_study, regid, password, phone_number, parent_phone_number } = req.body;

        if (!name || !email || !department || !batch || !year_of_study || !regid || !password || !phone_number || !parent_phone_number) {
            console.error("❌ Error: Missing required fields!");
            return res.status(400).json({ message: "All fields are required!" });
        }

        // ✅ Check if the student already exists
        const [existingStudent] = await db.execute("SELECT * FROM students WHERE email = ? OR regid = ?", [email, regid]);
        if (existingStudent.length > 0) {
            return res.status(400).json({ message: "Student already registered!" });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new student
        await db.execute(
            "INSERT INTO students (name, email, department, batch, year_of_study, regid, password, phone_number, parent_phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, email, department, batch, year_of_study, regid, hashedPassword, phone_number, parent_phone_number]
        );

        res.status(201).json({ message: "Student registered successfully!" });

    } catch (error) {
        console.error("❌ Error registering student:", error);
        res.status(500).json({ message: "Error registering student." });
    }
});


// Handle Proctor registration
app.post('/registerProctor', async (req, res) => {
    try {
        console.log("🔥 Received Proctor Registration Data:", req.body); // Debugging log

        const { name, email, designation,  password, phone_number,department } = req.body;

        if (!name || !email || !designation  || !password || !phone_number||!department) {
            console.error("❌ Error: Missing required fields!");
            return res.status(400).json({ message: "All fields are required!" });
        }

        // ✅ Check if the proctor already exists
        const [existingProctor] = await db.execute("SELECT * FROM proctors WHERE email = ? ", [email]);
        if (existingProctor.length > 0) {
            return res.status(400).json({ message: "Proctor already registered!" });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new proctor
        await db.execute(
            "INSERT INTO proctors (name, email, designation,  password, phone_number,department) VALUES (?, ?, ?, ?, ?, ?)",
            [name, email, designation, hashedPassword, phone_number,department]
        );

        res.status(201).json({ message: "Proctor registered successfully!" });

    } catch (error) {
        console.error("❌ Error registering proctor:", error);
        res.status(500).json({ message: "Error registering proctor." });
    }
});


app.post('/login', async (req, res) => {
    const { email, pswd, role, rememberMe } = req.body;
    console.log('Login attempt:', { email, role });

    try {
        let user;
        let query;

        // Fetch user based on the role
        if (role === 'student') {
            query = 'SELECT * FROM students WHERE email = ?';
        } else if (role === 'proctor') {
            query = 'SELECT * FROM proctors WHERE email = ?';
        } else if (role === 'admin') {
            query = 'SELECT * FROM admins WHERE email = ?';
        } else {
            return res.status(400).json({ message: 'Invalid role selected!' });
        }

        const [rows] = await db.execute(query, [email]);
        user = rows[0];

        console.log('Retrieved user:', user);

        if (!user) {
            return res.status(400).json({ message: 'User not found!' });
        }

        if (!pswd) {
            return res.status(400).json({ message: 'Password is required!' });
        }

        let match = false;

        // 🔹 Students & Proctors - Use bcrypt only
        if (role === 'student' || role === 'proctor') {
            match = await bcrypt.compare(pswd, user.password);
        }

        // 🔹 Admins - Try bcrypt first, then SHA-256
        if (role === 'admin') {
            if (user.password.startsWith("$2b$")) {
                // Password is bcrypt-hashed, compare using bcrypt
                match = await bcrypt.compare(pswd, user.password);
            } else {
                // Password is SHA-256 hashed, compare using SHA2()
                const sha256Hash = crypto.createHash("sha256").update(pswd).digest("hex");
                match = sha256Hash === user.password;
            }
        }

        console.log('User Password Hash:', user.password);
        console.log('Entered Password:', pswd);

        if (match) {
            // Store user ID and role in session
            if (role === 'proctor') {
                req.session.userId = user.proctor_id;
                req.session.proctor_id = user.proctor_id;
            } else if (role === 'student') {
                req.session.userId = user.student_id;
            } else if (role === 'admin') {
                req.session.userId = user.admin_id;
                req.session.admin_id = user.admin_id;  // Ensure admin_id is stored
                req.session.department = user.department || null; // Store department for admins
            }

            req.session.role = role;

            // Set cookie expiration based on 'rememberMe'
            req.session.cookie.maxAge = rememberMe 
                ? 30 * 24 * 60 * 60 * 1000  // 30 days
                : 1 * 60 * 60 * 1000;  // 1 hour

            // Define redirection URL based on role
            let redirectUrl = role === 'student' ? '/studentDashboard' :
                              role === 'proctor' ? '/proctorDashboard' :
                              '/adminDashboard';

            const responseUserId = role === 'proctor' ? user.proctor_id : 
                                   role === 'student' ? user.student_id : 
                                   user.admin_id;

            req.session.save(() => {
                console.log('Session after login:', req.session);
                res.status(200).json({
                    success: true,
                    role,
                    message: 'Login successful!',
                    redirectUrl,
                    userId: responseUserId,
                    department: req.session.department || 'N/A' // Return department info if available
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
    if (!['student', 'proctor','admin'].includes(role)) {
        return res.status(400).send('Invalid role provided');
    }
                const tableName = 
                role === 'proctor' ? 'proctors' : 
                role === 'admin' ? 'admins' : 'students';

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

    // Check if required fields are present
    if (!email || !role || !code || !newPassword) {
        return res.status(400).send('Missing required fields');
    }

    const tableName = 
        role === 'proctor' ? 'proctors' : 
        role === 'admin' ? 'admins' : 'students';

    try {
        console.log('Checking user with email:', email); // Log for debugging
        const [results] = await db.execute(
            `SELECT * FROM ${tableName} WHERE email = ? AND reset_code = ? AND reset_code_expiry > NOW()`, 
            [email, code]
        );

        if (results.length === 0) {
            return res.status(400).send('Invalid or expired reset code');
        }

        // Hash the new password and update it in the database
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            `UPDATE ${tableName} SET password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?`, 
            [hashedPassword, email]
        );

        return res.json({ message: 'Password successfully reset' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Server error');
    }
});

// ───Admin ─────────────────
// Route for importing student data
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
                        if (!row.email.endsWith('@jerusalemengg.ac.in') || !/^[a-zA-Z\s]+$/.test(row.name)) {
                            throw new Error('Invalid email or name format for proctor.');
                        }
                       
                        if (!row.password) {
                            throw new Error('Password is required for proctor.');
                        }
                        if (!/^\d{10}$/.test(row.phone_number)) {
                            throw new Error('Phone number must be 10 digits.');
                        }

                        // Encrypt the password
                        const hashedPassword = await bcrypt.hash(row.password, saltRounds);

                        // Insert the proctor into the database
                        await db.execute(
                            `INSERT INTO proctors (name, email, password, designation, phone_number,department) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [row.name, row.email, hashedPassword,  row.designation, row.phone_number, row.department,]
                        );
                    }
                    res.send('Proctor data imported successfully.');
                } catch (error) {
                    const errorMessage = error.sqlMessage || 'Error importing proctor data.';
                    res.status(500).send({ message: errorMessage, error: error.message });
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


// Route for importing proctor data
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
                        if (!row.email.endsWith('@jerusalemengg.ac.in') || !/^[a-zA-Z\s]+$/.test(row.name)) {
                            throw new Error('Invalid email or name format for student.');
                        }
                        if (!/^\d+$/.test(row.regid)) {
                            throw new Error('Register No should be numeric.');
                        }
                        if (!row.password) {
                            throw new Error('Password is required for student.');
                        }
                        if (!/^\d{10}$/.test(row.phone_number)) {
                            throw new Error('Phone number must be 10 digits.');
                        }
                        if (!/^\d{10}$/.test(row.parent_phone_number)) {
                            throw new Error('Parent phone number must be 10 digits.');
                        }

                        // Encrypt the password
                        const hashedPassword = await bcrypt.hash(row.password, saltRounds);

                        // Insert the student into the database
                        await db.execute(
                            `INSERT INTO students 
                            (name, email, department, batch, regid, password, year_of_study, phone_number, parent_phone_number) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [row.name, row.email, row.department, row.batch, row.regid, hashedPassword, row.year_of_study, row.phone_number, row.parent_phone_number]
                        );
                    }
                    res.send('Student data imported successfully.');
                } catch (error) {
                    const errorMessage = error.sqlMessage || 'Error importing student data.';
                    res.status(500).send({ message: errorMessage, error: error.message });
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



app.post('/addSubject', async (req, res) => {
    const { semester, subject_name, subject_code, credit, batch } = req.body;
    const department = req.session.department; // Ensure subjects are department-specific

    if (!semester || !subject_name || !subject_code || !credit || !batch) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        await db.execute(
            `INSERT INTO semester_subjects (semester, subject_name, subject_code, credit, department, batch)
             VALUES (?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name), credit = VALUES(credit), semester = VALUES(semester)`,
            [semester, subject_name, subject_code, credit, department, batch]
        );

        res.json({ message: 'Subject added successfully.' });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ message: 'Error adding subject.' });
    }
});

app.post('/deleteSubject', async (req, res) => {
    const { semester, subject_code, batch } = req.body;
    const department = req.session.department; // Ensure department-specific deletion

    if (!semester || !subject_code || !batch) {
        return res.status(400).json({ message: 'Semester, Subject Code, and Batch are required.' });
    }

    try {
        const [result] = await db.execute(
            `DELETE FROM semester_subjects
             WHERE semester = ? AND subject_code = ? AND batch = ? AND department = ?`,
            [semester, subject_code, batch, department]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No matching subject found.' });
        }

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


// app.post('/updateAllStudentMarks', async (req, res) => {
//     try {
//         // 🔹 Step 1: Get all students and subjects from student_academics
//         const [studentsSubjects] = await db.execute(
//             "SELECT regid, subject_code FROM student_academics"
//         );

//         if (studentsSubjects.length === 0) {
//             return res.status(404).json({ message: "No student academic records found!" });
//         }

//         let updatedCount = 0;

//         // 🔹 Step 2: Loop through each student & subject
//         for (const record of studentsSubjects) {
//             const { regid, subject_code } = record;

//             // 🔹 Step 3: Get marks from marks table
//             const [marks] = await db.execute(
//                 "SELECT test1, test2, attendance1, attendance2, grade, internal_marks FROM marks WHERE regid = ? AND subject_code = ?",
//                 [regid, subject_code]
//             );

//             // 🔹 Step 4: Update student_academics with marks (or set NULL if not found)
//             if (marks.length > 0) {
//                 await db.execute(
//                     `UPDATE student_academics 
//                      SET test1 = ?, test2 = ?, attendance1 = ?, attendance2 = ?, grades = ?, internal_marks = ?
//                      WHERE regid = ? AND subject_code = ?`,
//                     [marks[0].test1, marks[0].test2, marks[0].attendance1, marks[0].attendance2, marks[0].grade, marks[0].internal_marks, regid, subject_code]
//                 );
//                 updatedCount++;
//             } else {
//                 // If no marks found, update with NULL values
//                 await db.execute(
//                     `UPDATE student_academics 
//                      SET test1 = NULL, test2 = NULL, attendance1 = NULL, attendance2 = NULL, grades = NULL, internal_marks = NULL
//                      WHERE regid = ? AND subject_code = ?`,
//                     [regid, subject_code]
//                 );
//             }
//         }

//         res.status(200).json({ message: `Marks updated for ${updatedCount} records.` });

//     } catch (error) {
//         console.error("Error updating student marks:", error);
//         res.status(500).json({ message: "Error updating student marks", error: error.message });
//     }
// });

// Get Proctors by Department


app.get('/getProctorsByDepartment', async (req, res) => {
    try {
        const adminDepartment = req.session.department; // Get department from session
        if (!adminDepartment) {
            return res.status(400).json({ message: "Admin department not found." });
        }

        const [proctors] = await db.execute(
            "SELECT proctor_id, name, designation, department FROM proctors WHERE department = ?",
            [adminDepartment]
        );
        if (proctors.length === 0) {
            return res.status(404).json({ message: "No proctors found in this department." });
        }

        res.json(proctors);
    } catch (error) {
        console.error("Error fetching proctors:", error);
        res.status(500).json({ message: "Error fetching proctors" });
    }
});

// Get Students by Year
app.post('/getStudentsByYear', async (req, res) => {
    try {
        const { year } = req.body;
        const department = req.session.department;

        const [students] = await db.execute(
            "SELECT student_id, COALESCE(name, 'N/A') AS name, COALESCE(regid, 'N/A') AS regid FROM students WHERE year_of_study = ? AND department = ?", 
            [year, department]
        );

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Error fetching students" });
    }
});

// Remove Proctor from Assigned Students
app.post('/removeProctorFromStudents', async (req, res) => {
    try {
        const { proctor_id } = req.body;

        if (!proctor_id) {
            return res.status(400).json({ message: "Proctor ID is required!" });
        }

        // Remove proctor_id (set to NULL) for students assigned to this proctor
        await db.execute("UPDATE students SET proctor_id = NULL WHERE proctor_id = ?", [proctor_id]);

        res.json({ message: "Proctor unassigned from students successfully!" });
    } catch (error) {
        console.error("Error removing proctor from students:", error);
        res.status(500).json({ message: "Error unassigning proctor." });
    }
});

// Get Subjects by Department
app.post('/getSubjectsByBatch', async (req, res) => {
    try {
        const { batch } = req.body;
        const department = req.session.department; // Get admin's department

        if (!batch || !department) {
            return res.status(400).json({ message: "Batch and department are required!" });
        }

        const [subjects] = await db.execute(
            `SELECT subject_name, subject_code, credit, semester, batch, department 
             FROM semester_subjects 
             WHERE batch = ? AND department = ?`,
            [batch, department]
        );

        if (subjects.length === 0) {
            return res.status(404).json({ message: "No subjects found for this batch." });
        }

        res.json(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Error fetching subjects" });
    }
});


// Update Subjects in Both Tables
app.post('/updateSubjects', async (req, res) => {
    try {
        const { subjects, batch } = req.body;
        const department = req.session.department;

        if (!batch || !department) {
            return res.status(400).json({ message: "Batch and department are required!" });
        }

        for (const subject of subjects) {
            const { subjectCode, subjectName, newSubjectCode, credits, semester } = subject;

            // ✅ Update semester_subjects table (for selected batch & department)
            await db.execute(
                `UPDATE semester_subjects 
                 SET subject_name = ?, subject_code = ?, credit = ?, semester = ? 
                 WHERE subject_code = ? AND batch = ? AND department = ?`,
                [subjectName, newSubjectCode, credits, semester, subjectCode, batch, department]
            );

            // ✅ Update student_academics table (for students in the batch)
            await db.execute(
                `UPDATE student_academics 
                 SET subject = ?, subject_code = ?, credit = ?, semester = ? 
                 WHERE subject_code = ? AND batch = ?`,
                [subjectName, newSubjectCode, credits, semester, subjectCode, batch]
            );
        }

        res.json({ message: "Subjects updated successfully!" });
    } catch (error) {
        console.error("Error updating subjects:", error);
        res.status(500).json({ message: "Error updating subjects" });
    }
});



app.post('/uploadSubjects', upload.single('subjectFile'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded!" });
    }
    const filePath = req.file.path;
    console.log("Uploaded file path:", filePath);

    try {
        const department = req.session.department;  // Admin's department
        const results = [];

        // Read CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const row of results) {
                        // ✅ Validate CSV fields
                        if (!row.semester || !row.subject_name || !row.subject_code || !row.credit || !row.batch) {
                            throw new Error('Missing required fields in CSV.');
                        }

                        // ✅ Ensure the subject belongs to the correct department
                        if (row.department !== department) {
                            throw new Error(`Invalid department: ${row.department}. You can only upload subjects for ${department}.`);
                        }

                        // ✅ Check if the subject already exists for this batch & department
                        const [existing] = await db.execute(
                            `SELECT id FROM semester_subjects WHERE subject_code = ? AND batch = ? AND department = ?`,
                            [row.subject_code, row.batch, department]
                        );

                        if (existing.length > 0) {
                            // ✅ Update existing subject for this batch
                            await db.execute(
                                `UPDATE semester_subjects 
                                 SET subject_name = ?, credit = ?, semester = ?
                                 WHERE subject_code = ? AND batch = ? AND department = ?`,
                                [row.subject_name, row.credit, row.semester, row.subject_code, row.batch, department]
                            );
                        } else {
                            // ✅ Insert new subject for this batch
                            await db.execute(
                                `INSERT INTO semester_subjects (semester, subject_name, subject_code, credit, department, batch) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [row.semester, row.subject_name, row.subject_code, row.credit, department, row.batch]
                            );
                        }
                    }

                    res.json({ message: "Subjects uploaded successfully!" });

                } catch (error) {
                    res.status(500).json({ message: "Error processing CSV file.", error: error.message });
                } finally {
                    // Cleanup: Delete the uploaded file after processing
                    fs.unlink(filePath, (err) => { if (err) console.error("Error deleting file:", err); });
                }
            });

    } catch (error) {
        res.status(500).json({ message: "Error uploading file.", error: error.message });
    }
});


//assign proctor
app.get('/getProctors', async (req, res) => {
    try {
        const [proctors] = await db.execute("SELECT proctor_id, name, designation, department FROM proctors");

        console.log("Fetched Proctors from DB:", proctors);  // Debugging

        if (!Array.isArray(proctors)) {
            return res.json([]);
        }

        res.json(proctors);
    } catch (error) {
        console.error("Error fetching proctors:", error);
        res.status(500).json({ message: "Error fetching proctors", error: error.message });
    }
});

app.get('/getUniqueBatches', async (req, res) => {
    try {
        const [batches] = await db.execute("SELECT DISTINCT batch FROM students");
        if (!Array.isArray(batches)) {
            return res.status(500).json({ message: "Invalid data format received from database." });
        }
        
        res.json(batches);
    } catch (error) {
        res.status(500).json({ message: "Error fetching batches" });
    }
});

app.post('/getStudentsByBatchYear', async (req, res) => {
    try {
        const { batch, year } = req.body;
        const department = req.session.department; // 🔥 Get admin's department

        if (!batch || !year || !department) {
            return res.status(400).json({ message: "Batch, year, and department are required." });
        }

        // Fetch only students in the same department, batch, and year
        const [students] = await db.execute(
            "SELECT student_id, name, regid FROM students WHERE batch = ? AND year_of_study = ? AND department = ? ORDER BY regid",
            [batch, year, department]
        );

        if (!Array.isArray(students)) {
            return res.status(500).json({ message: "Invalid data format received from database." });
        }

        res.json(students);
    } catch (error) {
        console.error("❌ Error fetching students:", error);
        res.status(500).json({ message: "Error fetching students." });
    }
});


app.post('/assignProctor', async (req, res) => {
    try {
        console.log("🔥 Received Assign Proctor Request:", req.body); // Debugging log

        const { proctor_id, student_ids } = req.body;

        if (!proctor_id || !student_ids || student_ids.length === 0) {
            return res.status(400).json({ message: "Missing proctor or students." });
        }

        // ✅ Validate proctor exists
        const [proctor] = await db.execute("SELECT proctor_id FROM proctors WHERE proctor_id = ?", [proctor_id]);
        if (proctor.length === 0) {
            return res.status(404).json({ message: "Proctor not found." });
        }

        console.log("✅ Found Proctor:", proctor); // Debugging log

        // ✅ Validate students exist
        const [students] = await db.execute(
            "SELECT student_id FROM students WHERE student_id IN (?)",
            [student_ids]
        );

        console.log("✅ Found Students in Query:", students.map(s => s.student_id)); // Debugging log

        // // ✅ Log missing students
        // let foundStudentIds = students.map(s => s.student_id);
        // let missingStudents = student_ids.filter(id => !foundStudentIds.includes(parseInt(id)));

        // console.log("❌ Missing Students:", missingStudents); // Debugging log

        // if (students.length !== student_ids.length) {
        //     return res.status(404).json({ 
        //         message: "One or more students not found.", 
        //         missing_students: missingStudents 
        //     });
        // }

        // ✅ Assign the proctor to each student
        for (const student_id of student_ids) {
            await db.execute("UPDATE students SET proctor_id = ? WHERE student_id = ?", [proctor_id, student_id]);
        }

        res.json({ message: "Proctor assigned successfully!" });

    } catch (error) {
        console.error("❌ Error assigning proctor:", error);
        res.status(500).json({ message: "Error assigning proctor." });
    }
});



app.post('/assignSubjectsByDepartment', async (req, res) => {
    try {
        const { batch } = req.body;
        const department = req.session.department;

        if (!department || !batch) {
            return res.status(400).json({ message: "Department and batch are required!" });
        }

        // 🔹 Fetch all students from the given batch & department
        const [students] = await db.execute(
            "SELECT student_id, regid, year_of_study FROM students WHERE batch = ? AND department = ?",
            [batch, department]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found for this batch and department." });
        }

        // 🔹 Fetch all subjects from the given batch & department
        const [subjects] = await db.execute(
            "SELECT subject_name, subject_code, semester, credit FROM semester_subjects WHERE batch = ? AND department = ?",
            [batch, department]
        );

        if (subjects.length === 0) {
            return res.status(404).json({ message: "No subjects found for this batch and department." });
        }

        // 🔹 Insert subjects into student_academics for each student
        for (const student of students) {
            for (const subject of subjects) {
                await db.execute(
                    `INSERT INTO student_academics (student_id, regid, subject, subject_code, semester, credit, year_of_study, department, batch) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE subject = VALUES(subject), credit = VALUES(credit), semester = VALUES(semester), year_of_study = VALUES(year_of_study)`,
                    [
                        student.student_id, student.regid, subject.subject_name, subject.subject_code,
                        subject.semester, subject.credit, student.year_of_study, department, batch
                    ]
                );
            }
        }

        res.json({ message: "Subjects assigned to students successfully!" });

    } catch (error) {
        console.error("Error assigning subjects:", error);
        res.status(500).json({ message: "Error assigning subjects." });
    }
});


app.get('/getBatchesByDepartment', async (req, res) => {
    try {
        const department = req.session.department;

        if (!department) {
            console.log("Error: Admin department not found in session.");
            return res.status(400).json({ message: "Admin department not found." });
        }

        console.log("Fetching batches for department:", department);

        const [batches] = await db.execute(
            "SELECT DISTINCT batch FROM students WHERE department = ?",
            [department]
        );

        console.log("Batches found:", batches);

        res.json(batches);
    } catch (error) {
        console.error("Error fetching department-specific batches:", error);
        res.status(500).json({ message: "Error fetching batches." });
    }
});
app.get('/getAdminDepartment', async (req, res) => {
    try {
        if (!req.session.department) {
            console.log("Error: No department found in session.");
            return res.status(400).json({ message: "Admin department not found." });
        }

        console.log("Admin department fetched:", req.session.department);
        res.json({ department: req.session.department });
    } catch (error) {
        console.error("Error fetching admin department:", error);
        res.status(500).json({ message: "Error fetching admin department." });
    }
});



// ─── PROCTOR ─────────────────
app.get('/getAssignedStudents', async (req, res) => {
    try {
        const proctorId = req.session.proctor_id;
        const [proctor] = await db.execute("SELECT name, designation FROM proctors WHERE proctor_id = ?", [proctorId]);
        const [students] = await db.execute("SELECT student_id, name, regid FROM students WHERE proctor_id = ?", [proctorId]);

        res.json({
            proctorName: proctor[0].name,
            designation: proctor[0].designation,
            students
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching students." });
    }
});

// ─── FETCH STUDENT ACADEMIC RECORD ─────────────────
app.get('/getStudentAcademicRecord/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Fetch student details
        const [student] = await db.execute(
            "SELECT name, regid FROM students WHERE student_id = ?", 
            [studentId]
        );

        // If student does not exist
        if (student.length === 0) {
            return res.status(404).json({ message: "Student not found." });
        }

        // Fetch academic records
        const [subjects] = await db.execute(
            "SELECT * FROM student_academics WHERE student_id = ?", 
            [studentId]
        );

        res.json({ 
            student: student[0], 
            subjects 
        });

    } catch (error) {
        console.error("Error loading academic records:", error);
        res.status(500).json({ message: "Error loading academic records." });
    }
});


// ─── UPDATE MARKS & RECALCULATE GPA/CGPA ─────────────────
app.post('/updateStudentMarks', async (req, res) => {
    try {
        const { studentId, semester, updates } = req.body;

        // 🔹 Update Marks in student_academics Table
        for (const data of updates) {
            await db.execute(
                `UPDATE student_academics 
                 SET attendance1 = ?, attendance2 = ?, test1 = ?, test2 = ?, grades = ?, internal_marks = ?
                 WHERE student_id = ? AND subject_code = ? AND semester = ?`,
                [data.attendance1, data.attendance2, data.test1, data.test2, data.grade, data.internal, studentId, data.subject_code, semester]
            );
        }

        // 🔹 Recalculate GPA for the Semester
        const [gpaResult] = await db.execute(`
            SELECT 
                SUM(
                    CASE 
                        WHEN grades = 'O' THEN 10 * s.credit
                        WHEN grades = 'A+' THEN 9 * s.credit
                        WHEN grades = 'A' THEN 8 * s.credit
                        WHEN grades = 'B+' THEN 7 * s.credit
                        WHEN grades = 'B' THEN 6 * s.credit
                        WHEN grades = 'C' THEN 5 * s.credit
                        ELSE 0
                    END
                ) / NULLIF(SUM(CASE WHEN grades != 'U' THEN s.credit ELSE 0 END), 0) AS gpa
            FROM student_academics sa
            JOIN semester_subjects s ON sa.subject_code = s.subject_code
            WHERE sa.student_id = ? AND sa.semester = ?
            GROUP BY sa.student_id, sa.semester;
        `, [studentId, semester]);

        const gpa = gpaResult.length > 0 ? gpaResult[0].gpa : 0;

        // 🔹 Recalculate CGPA for the Student
        const [cgpaResult] = await db.execute(`
            SELECT SUM(gpa) / COUNT(gpa) AS cgpa
            FROM (
                SELECT sa.student_id, sa.semester,
                    SUM(
                        CASE 
                            WHEN grades = 'O' THEN 10 * s.credit
                            WHEN grades = 'A+' THEN 9 * s.credit
                            WHEN grades = 'A' THEN 8 * s.credit
                            WHEN grades = 'B+' THEN 7 * s.credit
                            WHEN grades = 'B' THEN 6 * s.credit
                            WHEN grades = 'C' THEN 5 * s.credit
                            ELSE 0
                        END
                    ) / NULLIF(SUM(CASE WHEN grades != 'U' THEN s.credit ELSE 0 END), 0) AS gpa
                FROM student_academics sa
                JOIN semester_subjects s ON sa.subject_code = s.subject_code
                WHERE sa.student_id = ? AND sa.semester <= ?
                GROUP BY sa.student_id, sa.semester
            ) AS all_gpas;
        `, [studentId, semester]);

        const cgpa = cgpaResult.length > 0 ? cgpaResult[0].cgpa : 0;

        // 🔹 Store GPA & CGPA in student_academics Table
        await db.execute(`
            UPDATE student_academics 
            SET gpa = ?, cgpa = ?
            WHERE student_id = ? AND semester = ?;
        `, [gpa, cgpa, studentId, semester]);

        res.json({ message: `Marks updated for Semester ${semester}. GPA & CGPA recalculated and stored.` });

    } catch (error) {
        console.error("Error updating marks & recalculating GPA/CGPA:", error);
        res.status(500).json({ message: "Error updating marks & GPA/CGPA." });
    }
});



app.get('/getGpaCgpa', async (req, res) => {
    try {
        const { studentId, semester } = req.query;

        // 🔹 Fetch the **average** GPA for the requested semester (ensures one value)
        const [gpaRow] = await db.execute(
            `SELECT AVG(gpa) AS gpa FROM student_academics WHERE student_id = ? AND semester = ?`,
            [studentId, semester]
        );

        // 🔹 Fetch the **average** CGPA (ensures one value)
        const [cgpaRow] = await db.execute(
            `SELECT AVG(cgpa) AS cgpa FROM student_academics WHERE student_id = ?`,
            [studentId]
        );

        // 🔹 Convert to fixed decimal (if not null)
        const gpa = gpaRow[0].gpa !== null ? Number(gpaRow[0].gpa).toFixed(2) : "--";
        const cgpa = cgpaRow[0].cgpa !== null ? Number(cgpaRow[0].cgpa).toFixed(2) : "--";

        res.json({ gpa, cgpa });

    } catch (error) {
        console.error("Error fetching GPA/CGPA:", error);
        res.status(500).json({ gpa: "--", cgpa: "--" });
    }
});


// ─── FETCH STUDENT ACHIEVEMENTS ─────────────────

router.post("/uploadAchievement", upload.single("file"), async (req, res) => {
    try {
        const { student_id, title } = req.body;
        const filePath = `/uploads/${req.file.filename}`;

        if (!student_id || !title || !req.file) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Save to Database
        const sql = `INSERT INTO student_achievements (student_id, title, file_path) VALUES (?, ?, ?)`;
        await db.query(sql, [student_id, title, filePath]);

        res.json({ success: true, message: "Achievement uploaded successfully!" });
    } catch (error) {
        console.error("Error uploading achievement:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});



// 📌 API to Get Student Achievements
router.get('/getStudentAchievements/:student_id', async (req, res) => {
    const { student_id } = req.params;
    try {
        const [achievements] = await db.query('SELECT id, title, file_path FROM student_achievements WHERE student_id = ?', [student_id]);
        res.json(achievements);
    } catch (error) {
        console.error("Error fetching achievements:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// 📌 API to Download Achievement File
router.get('/downloadAchievement/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('SELECT file_path FROM student_achievements WHERE id = ?', [id]);
        if (result.length === 0) return res.status(404).json({ message: "File not found" });

        const filePath = path.join(__dirname, '../', result[0].file_path);
        res.download(filePath);
    } catch (error) {
        console.error("Error downloading achievement:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});



// ─── PROFILE UPDATE ─────────────────

app.get('/getProctorProfile', async (req, res) => {
    try {
        const proctorId = req.session.proctor_id;
        if (!proctorId) {
            return res.status(401).json({ message: "Unauthorized. Please log in again." });
        }

        const [proctor] = await db.execute("SELECT name, email, designation, phone_number FROM proctors WHERE proctor_id = ?", [proctorId]);
        if (proctor.length === 0) {
            return res.status(404).json({ message: "Proctor not found." });
        }

        res.json(proctor[0]); // Send the proctor's details
    } catch (error) {
        console.error("Error fetching proctor profile:", error);
        res.status(500).json({ message: "Error fetching profile." });
    }
});
app.post('/updateProctorProfile', async (req, res) => {
    try {
        const proctorId = req.session.proctor_id;
        if (!proctorId) {
            return res.status(401).json({ message: "Unauthorized. Please log in again." });
        }

        const { name, email, designation, phone_number } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push("name = ?");
            values.push(name);
        }
        if (email) {
            updates.push("email = ?");
            values.push(email);
        }
        if (designation) {
            updates.push("designation = ?");
            values.push(designation);
        }
        if (phone_number) {
            updates.push("phone_number = ?");
            values.push(phone_number);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No changes provided." });
        }

        values.push(proctorId);
        const query = `UPDATE proctors SET ${updates.join(", ")} WHERE proctor_id = ?`;

        await db.execute(query, values);
        res.json({ success: true, message: "Profile updated successfully!" });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile." });
    }
});
//-----------------------------------CSV UPLOAD--------------
app.post('/uploadMarks', upload.single('marksFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const uploadPath = req.file.path;
        console.log(`File uploaded to ${uploadPath}`);

        const results = [];

        // Read and parse CSV using csv-parser
        fs.createReadStream(uploadPath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    const regid = (row.regid || '').trim();
                    const subject_code = (row.subject_code || '').trim();
                    const semester = parseInt(row.semester) || 0;
                    const test1 = parseFloat(row.test1) || 0;
                    const test2 = parseFloat(row.test2) || 0;
                    const attendance1 = parseFloat(row.attendance1) || 0;
                    const attendance2 = parseFloat(row.attendance2) || 0;
                    const grade = (row.grade || '').trim();
                    const internal_marks = parseInt(row.internal_marks) || 0;

                    // Validate required fields
                    if (!regid || !subject_code || semester === 0) {
                        console.log("Skipping row due to missing required fields:", row);
                        return;
                    }

                    results.push({ regid, subject_code, semester, test1, test2, attendance1, attendance2, grade, internal_marks });
                } catch (err) {
                    console.error("Error processing row:", err);
                }
            })
            .on('end', async () => {
                try {
                    if (results.length === 0) {
                        return res.status(400).json({ message: "No valid data found in CSV." });
                    }

                    // Prepare SQL query for insert/update
                    const sql = `
                        INSERT INTO marks (regid, subject_code, semester, test1, test2, attendance1, attendance2, grade, internal_marks) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                        test1 = VALUES(test1), 
                        test2 = VALUES(test2), 
                        attendance1 = VALUES(attendance1), 
                        attendance2 = VALUES(attendance2), 
                        grade = VALUES(grade), 
                        internal_marks = VALUES(internal_marks)`;

                    // Execute the query for each row
                    await Promise.all(results.map(data => 
                        db.query(sql, [data.regid, data.subject_code, data.semester, data.test1, data.test2, data.attendance1, data.attendance2, data.grade, data.internal_marks])
                    ));

                    // 🔹 **Auto-update student academics after marks update**
                    await autoUpdateStudentMarks();

                    res.send(`
                        <script>
                            alert("Marks uploaded and student academics updated successfully.");
                            window.location.reload();
                        </script>
                    `);
                } catch (dbErr) {
                    console.error("Database Error:", dbErr);
                    res.status(500).json({ message: "Error inserting/updating marks in the database." });
                } finally {
                    // Delete the uploaded file after processing
                    fs.unlinkSync(uploadPath);
                }
            });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


async function autoUpdateStudentMarks() {
    try {
        // 🔹 Step 1: Get all students and subjects from student_academics
        const [studentsSubjects] = await db.execute(
            "SELECT regid, subject_code FROM student_academics"
        );

        if (studentsSubjects.length === 0) {
            console.log("No student academic records found. Skipping update.");
            return;
        }

        let updatedCount = 0;

        // 🔹 Step 2: Loop through each student & subject
        for (const record of studentsSubjects) {
            const { regid, subject_code } = record;

            // 🔹 Step 3: Get marks from marks table
            const [marks] = await db.execute(
                "SELECT test1, test2, attendance1, attendance2, grade, internal_marks FROM marks WHERE regid = ? AND subject_code = ?",
                [regid, subject_code]
            );

            if (marks.length > 0) {
                // 🔹 Step 4: Update student_academics with marks
                await db.execute(
                    `UPDATE student_academics 
                     SET test1 = ?, test2 = ?, attendance1 = ?, attendance2 = ?, grades = ?, internal_marks = ?
                     WHERE regid = ? AND subject_code = ?`,
                    [marks[0].test1, marks[0].test2, marks[0].attendance1, marks[0].attendance2, marks[0].grade, marks[0].internal_marks, regid, subject_code]
                );
                updatedCount++;
            }
        }

        console.log(`Marks updated for ${updatedCount} students.`);
    } catch (error) {
        console.error("Error auto-updating student marks:", error);
    }
}

//-------------------------------------Students--------------------------------------------------

// app.get('/getStudentData', (req, res) => {
//     const studentId = req.query.studentId;
//     const semester = req.query.semester;

//     const query = 'SELECT * FROM student_academics WHERE student_id = ? AND semester = ?';
//     db.query(query, [studentId, semester], (err, results) => {
//         if (err) {
//             return res.status(500).send(err);
//         }
//         res.json(results);
//     });

// });


// router.get('/student/academics', async (req, res) => {
//     const { regid, semester } = req.query;

//     if (!regid || !semester) {
//         return res.status(400).json({ error: "Missing required parameters" });
//     }

//     try {
//         const query = `SELECT subject, credit, subject_code, attendance1, attendance2, test1, test2, grades, internal_marks 
//                        FROM student_academics 
//                        WHERE regid = ? AND semester = ? 
//                        ORDER BY subject_code`;
//         const [rows] = await db.execute(query, [regid, semester]);
//         res.json(rows);
//     } catch (error) {
//         console.error("Error fetching student academics:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// router.post('/uploadAchievement', upload.single('file'), async (req, res) => {
//     try {
//         const { title, regid } = req.body;
//         const fileUrl = `/uploads/${req.file.filename}`; // Store relative URL

//         if (!title || !regid) {
//             return res.status(400).send("Title and student ID are required.");
//         }

//         // Insert into database
//         await db.query('INSERT INTO achievements (regid, title, file_url) VALUES (?, ?, ?)', [regid, title, fileUrl]);

//         res.status(200).send("Achievement uploaded successfully.");
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Server error. Try again.");
//     }
// });

router.get('/student/academics/:studentId/:semester', async (req, res) => {
    const { studentId, semester } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT subject, credit, semester, attendance1, attendance2, test1, test2, grades, internal_marks, gpa, cgpa 
             FROM student_academics 
             WHERE student_id = ? AND semester = ?`, 
            [studentId, semester]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching academic data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Calculate GPA and CGPA for a student per semester
router.get('/student/gpa-cgpa/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT semester, ROUND(AVG(gpa), 3) AS gpa, ROUND(AVG(cgpa), 3) AS cgpa 
             FROM student_academics 
             WHERE student_id = ? 
             GROUP BY semester`,
            [studentId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error calculating GPA/CGPA:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Upload achievement file
router.post('/student/achievements/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', filePath: `/uploads/${req.file.filename}` });
});

// Fetch all uploaded achievements
router.get('/student/achievements', async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM student_achievements`);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/session', (req, res) => {
    if (req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ message: "Not logged in" });
    }
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

router.use((req, res) => {
    res.status(404).json({ success: false, message: "API not found" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
module.exports = router;

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
