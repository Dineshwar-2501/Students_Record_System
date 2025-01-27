
$(document).ready(async function () {
    // Fetch and display proctor's information and assigned students
    try {
        const response = await $.get('/getProctorDetails');
        const { proctorName, designation, students } = response;

        // Display the proctor's name and designation
        $('#proctor-name').text(proctorName);
        $('#proctor-designation').text(designation);

        // Populate the student list with assigned students
        students.forEach(student => {
            $('#students-list').append(`
                <li data-id="${student.student_id}" class="student-item">
                    ${student.name}
                </li>
            `);
        });

        // Event listener for clicking a student in the list
        $('.student-item').on('click', function () {
            const studentId = $(this).data('id');
            loadStudentWorkspace(studentId); // Load student details in the workspace
        });

        // Trigger search on typing in the sidebar search input
        $('#sidebar-student-search').on('input', searchAssignedStudents);

    } catch (error) {
        console.error("Error loading proctor and student details:", error);
    }
});

// Function to load student details into the workspace
async function loadStudentWorkspace(studentId) {
    try {
        const studentDetails = await $.get(`/getStudentDetails/${studentId}`);
        $('#student-workspace').empty();

        // Populate the workspace with student details
        $('#student-workspace').append(`
            <h3>${studentDetails.name}</h3>
            <p>Registration ID: ${studentDetails.registrationId}</p>
            <p>Year: ${studentDetails.year}</p>
            <p>Grades: ${studentDetails.grades}</p>
        `);
    } catch (error) {
        console.error("Error loading student details:", error);
    }
}

// Function to search assigned students by name in the sidebar
function searchAssignedStudents() {
    const searchQuery = $('#sidebar-student-search').val().toLowerCase().trim();
    $('#students-list li').each(function () {
        const studentName = $(this).text().toLowerCase();
        $(this).toggle(studentName.includes(searchQuery));
    });
}


$(document).ready(function () {
    // Toggle settings menu
    $('#settings-icon').click(function (e) {
        e.stopPropagation(); // Prevent event bubbling
        $('#settings-menu').toggle();
    });

    // Close settings menu when clicking outside
    $(document).click(function (event) {
        if (!$(event.target).closest('#settings-icon').length && !$(event.target).closest('#settings-menu').length) {
            $('#settings-menu').hide();
        }
    });

    // Open Year Selection Modal
    $('#select-year-button').click(function () {
        $('#year-selection-modal').show();
    });

    // Close Year Selection Modal
    $('#close-year-modal').click(function () {
        $('#year-selection-modal').hide();
    });

    // Close Student Modal
    $('#close-student-modal').click(function () {
        $('#student-modal').hide();
    });

    // Close Import Student Modal
    $('#close-student-modal-import').click(function () {
        $('#import-student-modal').hide();
    });

    // Close Import Proctor Modal
    $('#close-proctor-modal').click(function () {
        $('#import-proctor-modal').hide();
    });

    // Open Import Student Modal
    $('#import-student-button').click(function () {
        $('#import-student-modal').show();
    });

    // Open Import Proctor Modal
    $('#import-proctor-button').click(function () {
        $('#import-proctor-modal').show();
    });

    // Year button click events to fetch students
    $('#btn-1styear').click(() => fetchStudentsByYear('1'));
    $('#btn-2ndyear').click(() => fetchStudentsByYear('2'));
    $('#btn-3rdyear').click(() => fetchStudentsByYear('3'));
    $('#btn-4thyear').click(() => fetchStudentsByYear('4'));

    // Function to fetch students by year
    function fetchStudentsByYear(year) {
        $('#year-selection-modal').hide();
        $('#student-year-heading').text("Student List");
        $('#student-search').val(''); // Clear previous search
        $('#student-modal').show();

        $.ajax({
            type: 'GET',
            url: `/getStudentsByYear/${year}`, // Updated to match server route
            success: function (data) {
                displayStudents(data);
            },
            error: function (xhr) {
                console.error("Error fetching students:", xhr);
                console.error("Status:", xhr.status);
                console.error("Response Text:", xhr.responseText);
                alert("Failed to fetch students. Please try again.");
            }
            
        });
    }

    // Function to display students in the table
    function displayStudents(students) {
        let studentList = $('#student-list');
        studentList.empty();

        students.forEach(student => {
            studentList.append(`
                <tr>
                    <td><input type="checkbox" class="student-checkbox" data-id="${student.student_id}"></td>
                    <td>${student.regid}</td>
                    <td>${student.name}</td>
                </tr>
            `);
        });
    }

    // Search functionality to filter students by RegID
    $('#student-search').on('keyup', function () {
        let value = $(this).val().toLowerCase();
        $('#student-list tr').filter(function () {
            $(this).toggle($(this).find('td:nth-child(2)').text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Drag-to-select functionality
    let isSelecting = false;

    $('#student-table').on('mousedown', 'tr', function (e) {
        isSelecting = true;
        toggleCheckbox($(this));
        e.preventDefault(); // Prevent text selection
    });

    $('#student-table').on('mouseover', 'tr', function () {
        if (isSelecting) {
            toggleCheckbox($(this));
        }
    });

    $(document).on('mouseup', function () {
        isSelecting = false;
    });

    function toggleCheckbox(row) {
        let checkbox = row.find('.student-checkbox');
        let isChecked = checkbox.prop('checked');
        checkbox.prop('checked', !isChecked);
        row.toggleClass('highlight', !isChecked);
    }

    // Assign Proctor button click event
    $('#assign-proctor').click(function () {
        let selectedStudents = [];
        $('.student-checkbox:checked').each(function () {
            selectedStudents.push($(this).data('id'));
        });
    
        if (selectedStudents.length === 0) {
            alert("Please select at least one student.");
            return;
        }
    
        $.ajax({
            type: 'POST',
            url: '/assignProctor',
            contentType: 'application/json',
            data: JSON.stringify({ students: selectedStudents }), // Only send selected students
            success: function (response) {
                alert(response.message);
                $('#student-modal').hide();
            },
            error: function (xhr) {
                console.error("Error assigning proctor:", xhr);
                alert("An error occurred while assigning the proctor.");
            }
        });
    });
    

    // Handle the Proctor Import Form
    $('#importProctorForm').on('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            type: 'POST',
            url: '/importProctorData',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                alert('Proctor data imported successfully.');
                $('#import-proctor-modal').hide();
            },
            error: function (xhr) {
                try {
                    const jsonResponse = JSON.parse(xhr.responseText);
                    alert(jsonResponse.message || 'Error importing proctor data.');
                } catch (e) {
                    console.error('Error:', e);
                    alert('An unexpected error occurred.');
                }
            }
        });
    });

    // Handle the Student Import Form
    $('#importStudentForm').on('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            type: 'POST',
            url: '/importStudentData',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                alert('Student data imported successfully.');
                $('#import-student-modal').hide();
            },
            error: function (xhr) {
                try {
                    const jsonResponse = JSON.parse(xhr.responseText);
                    alert(jsonResponse.message || 'Error importing student data.');
                } catch (e) {
                    console.error('Error:', e);
                    alert('An unexpected error occurred.');
                }
            }
        });
    });
});
// sidebar
// Sidebar Toggle Functionality
document.getElementById("toggle-sidebar-btn").addEventListener("click", function () {
    const sidebar = document.getElementById("students-menu");
    sidebar.classList.toggle("closed");
});


async function loadStudentAcademicTable(studentId) {
    try {
        // Fetch student and subject data from the server
        const response = await fetch(`/getStudentAndSubjects/${studentId}`);
        
        if (!response.ok) throw new Error('Failed to fetch student data.');
        
        const data = await response.json();
        
        // Check if the data structure is correct and contains the student and subjects
        if (data.success && data.data) {
            const student = data.data.student;
            const subjects = data.data.subjects;

            // Check if student data is present and has necessary fields
            if (student && student.year_of_study) {
                // Generate the academic table
                generateAcademicTable(student, subjects);
            } else {
                console.error("Year of study is missing for the student.");
            }
        } else {
            console.error("Failed to fetch student or subject data.");
        }
    } catch (error) {
        console.error('Error loading student academic table:', error);
        alert('Failed to load student academic table.');
    }
}

// Event listener for when a student item is clicked
$(document).on('click', '.student-item', async function () {
    const studentId = $(this).data('id');
    console.log('Student ID:', studentId); 

    // Load the academic table for the selected student
    await loadStudentAcademicTable(studentId);
});

// Function to generate academic table
function generateAcademicTable(student, subjects, semesters) {
    // Generate the table as before
    const tableContainer = $('#student-workspace');
    tableContainer.empty();

    let tableHTML = `
        <h3>Academic Table for ${student.regid} (Year ${student.year_of_study})</h3>
        <table id="academicTable">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Reg ID</th>
                    <th>Subject</th>
                    <th>Credit</th>
                    <th>Subject Code</th>
                    <th>Semester</th>
                    <th>Year</th>
                    <th>Attendance 1</th>
                    <th>Attendance 2</th>
                    <th>Test 1</th>
                    <th>Test 2</th>
                    <th>Grades</th>
                    <th>Internal Marks</th>
                </tr>
            </thead>
            <tbody>
    `;

    subjects.forEach(subject => {
        tableHTML += `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.regid}</td>
                <td>${subject.subject_name}</td>
                <td>${subject.credit}</td>
                <td>${subject.subject_code}</td>
                <td>${subject.semester}</td>
                <td>${student.year_of_study}</td>
                <td><input type="number" class="attendance1" placeholder="Enter Attendance 1"></td>
                <td><input type="number" class="attendance2" placeholder="Enter Attendance 2"></td>
                <td><input type="number" class="test1" placeholder="Enter Test 1"></td>
                <td><input type="number" class="test2" placeholder="Enter Test 2"></td>
                <td><input type="text" class="grades" placeholder="Enter Grade"></td>
                <td><input type="number" class="internalMarks" placeholder="Enter Internal Marks"></td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <button id="applyButton" class="button">Apply</button>
    `;

    tableContainer.html(tableHTML);

    // Attach event listener for Apply button
    $('#applyButton').click(() => saveStudentAcademicData(student.student_id));
}

async function saveStudentAcademicData(studentId) { 
    const rows = document.querySelectorAll('#academicTable tbody tr');
    const academicData = [];

    rows.forEach(row => {
        const data = {
            student_id: studentId,
            regid: row.cells[1].textContent,
            subject: row.cells[2].textContent,
            credit: row.cells[3].textContent,
            subject_code: row.cells[4].textContent,
            semester: row.cells[5].textContent,
            year_of_study: row.cells[6].textContent,
            attendance_1: row.querySelector('.attendance1') ? row.querySelector('.attendance1').value : null,
            attendance_2: row.querySelector('.attendance2') ? row.querySelector('.attendance2').value : null,
            test_1: row.querySelector('.test1') ? row.querySelector('.test1').value : null,
            test_2: row.querySelector('.test2') ? row.querySelector('.test2').value : null,
            grades: row.querySelector('.grades') ? row.querySelector('.grades').value : null,
            internal_marks: row.querySelector('.internalMarks') ? row.querySelector('.internalMarks').value : null,
        };

        // Validate mandatory fields
        if (!data.subject_code || !data.subject) {
            alert('Subject and Subject Code are required.');
            return;
        }

        academicData.push(data);
    });

    // If no academic data is collected, stop execution
    if (academicData.length === 0) {
        alert('No academic data to save.');
        return;
    }

    try {
        const response = await fetch('/saveStudentAcademics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, academicData }),
        });

        // Log the response for debugging purposes
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save academic data.');
        }

        alert(result.message || 'Data saved successfully.');
    } catch (error) {
        console.error('Error saving academic data:', error);
        alert('Failed to save academic data.');
    }
}

// Attach click listener for dynamic student items
document.addEventListener('click', event => {
    if (event.target.classList.contains('student-item')) {
        const studentId = event.target.dataset.id;
        loadStudentAcademicTable(studentId);
    }
});

// Show Add Subject Modal
$('#add-subject-button').click(() => {
    $('#addSubjectModal').show();
});

// Close Modal
$('#close-add-subject-modal').click(() => {
    $('#addSubjectModal').hide();
});

// Handle Add Subject Form Submission
$('#addSubjectForm').on('submit', function (event) {
    event.preventDefault();
    const formData = $(this).serialize();

    $.post('/addSubject', formData)
        .done(response => {
            alert(response.message || 'Subject added successfully.');
            $('#addSubjectModal').hide();
        })
        .fail(() => alert('Error adding subject.'));
});
// Show Delete Subject Modal
$('#delete-subject-button').click(() => {
    $('#deleteSubjectModal').show();
});

// Close Modal
$('#close-delete-subject-modal').click(() => {
    $('#deleteSubjectModal').hide();
});

// Handle Delete Subject Form Submission
$('#deleteSubjectForm').on('submit', function (event) {
    event.preventDefault();
    const formData = $(this).serialize();

    $.post('/deleteSubject', formData)
        .done(response => {
            alert(response.message || 'Subject deleted successfully.');
            $('#deleteSubjectModal').hide();
        })
        .fail(() => alert('Error deleting subject.'));
});

// Handle Delete Proctor Assignments
$('#delete-proctor-assignments-button').click(() => {
    $.ajax({
        type: 'POST',
        url: '/deleteProctorAssignments',
        success: function (response) {
            alert(response.message || 'Proctor assignments deleted successfully.');
        },
        error: function () {
            alert('Error deleting proctor assignments.');
        },
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Modal References
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadModal = document.getElementById('close-upload-modal');
    const uploadMarksButton = document.getElementById('upload-marks-button');

    // Open Modal
    uploadMarksButton.addEventListener('click', () => {
        uploadModal.style.display = 'block';
    });

    // Close Modal
    closeUploadModal.addEventListener('click', () => {
        uploadModal.style.display = 'none';
    });

    // Close Modal on Outside Click
    window.addEventListener('click', (event) => {
        if (event.target === uploadModal) {
            uploadModal.style.display = 'none';
        }
    });
});
    // Handle File Upload Form Submission
    document.getElementById('uploadCSVForm').addEventListener('submit', function (event) {
        event.preventDefault();
    
        const formData = new FormData(this); // Automatically binds form inputs
    
        fetch('/uploadMarks', {
            method: 'POST',
            body: formData,
        })
            .then(async (response) => {
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message || 'Marks data uploaded successfully.');
                    uploadModal.style.display = 'none'; // Close modal on success
                } else {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    alert('Failed to upload marks data. Please try again.');
                }
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
                alert('An unexpected error occurred.');
            });
  
        });
  
