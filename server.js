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
const csv = require('csv-parser'); // For CSV files
const xlsx = require('xlsx'); // For Excel files


// Create an Express app
const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });
const proctorRoutes = require('./routes/proctorRoutes');
app.use(proctorRoutes);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Static files from public folder
app.use(express.static(path.join(__dirname, 'public')));
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
const db = require('./config/database');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/getStudentsByYear/:year', async (req, res) => {
    const year = req.params.year; // Get the year from the URL parameters
    console.log(`Fetching students for year: ${year}`);
    try {
        const sql = 'SELECT student_id, regid, name FROM students WHERE year_of_study = ?'; // Ensure 'year_of_study' exists
        const [rows] = await db.execute(sql, [year]);
        res.json(rows); // Return the list of students in JSON format
    } catch (error) {
        console.error('Error fetching students by year:', error);
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


// Check if a student has a proctor

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

// app.get('/studentListPage', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'studentList.html'));
// });

// // Student List Route
// app.get('/studentList', async (req, res) => {
//     try {
//         const [students] = await db.execute('SELECT student_id, name FROM students');
//         res.json(students);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error');
//     }
// });

// Endpoint to get students by year
// Fetch Students by Year (Using Query Parameter Instead of URL Parameter)
// Endpoint to get students by year


app.post('/forgotpassword', async (req, res) => {
    const { email, role } = req.body;
    const tableName = role === 'proctor' ? 'proctors' : 'students';

    try {
        const [results] = await db.execute(`SELECT * FROM ${tableName} WHERE email = ?`, [email]);

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const code = Math.floor(Math.random() * 900000) + 100000; // Generate a 6-digit code

        await db.execute(`UPDATE ${tableName} SET reset_code = ?, reset_code_expiry = NOW() + INTERVAL 15 MINUTE WHERE email = ?`, [code, email]);
        
        // Send reset code via email
        await sendMail(email, 'Password Reset Code', `Your password reset code is ${code}. It will expire in 15 minutes.`);

        return res.json({ message: 'Reset code sent to your email' }); // Respond with a message

    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).send('Server error');
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
                            [row.name, row.email, row.department,row.batch,row.regid, hashedPassword,row.year]
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


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
