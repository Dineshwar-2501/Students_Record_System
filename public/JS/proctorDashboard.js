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
