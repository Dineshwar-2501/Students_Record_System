$(document).ready(async function () {
    await loadAssignedStudents();

    const sidebar = $('#sidebar');
    const toggleButton = $('#sidebar-toggle-btn');
    const workspaceToggleButton = $('#toggle-sidebar-btn'); // Ensure single toggle
    const uploadMarksButton = $('#upload-marks-button');
    const editProfileButton = $('#edit-profile-button');
    const profileModal = $('#profile-modal');
    const closeProfileModal = $('#close-profile-modal');

    // 📌 Toggle Sidebar when the button is clicked
    toggleButton.click(function (event) {
        event.stopPropagation(); // Prevent click from triggering document click event

        if (sidebar.hasClass('open')) {
            sidebar.removeClass('open').addClass('closed').css("left", "-250px");
            toggleButton.removeClass('hidden');
        } else {
            sidebar.removeClass('closed').addClass('open').css("left", "0px");
            toggleButton.addClass('hidden');
        }
    });

    // 📌 Toggle Sidebar when workspace button clicked
    workspaceToggleButton.click(function (event) {
        event.stopPropagation();

        if (sidebar.hasClass('open')) {
            sidebar.removeClass('open').addClass('closed').css("left", "-250px");
            workspaceToggleButton.removeClass('hidden');
        } else {
            sidebar.removeClass('closed').addClass('open').css("left", "0px");
            workspaceToggleButton.addClass('hidden');
        }
    });

    // 📌 Close Sidebar when clicking outside, but NOT when clicking inside
    $(document).click(function (event) {
        if (!$(event.target).closest("#sidebar, #sidebar-toggle-btn, #toggle-sidebar-btn").length) {
            sidebar.removeClass("open").addClass("closed").css("left", "-250px");
            toggleButton.removeClass("hidden");
            workspaceToggleButton.removeClass("hidden");
        }
    });

    // 📌 Hide Sidebar When Upload Marks Button Clicked
    uploadMarksButton.click(function () {
        sidebar.removeClass('open').addClass('closed').css("left", "-550px");
        toggleButton.removeClass('hidden');
        workspaceToggleButton.removeClass('hidden');
    });

    // 📌 Hide Sidebar When Edit Profile Button Clicked & Show Modal
    editProfileButton.click(function () {
        sidebar.removeClass('open').addClass('closed').css("left", "-250px");
        toggleButton.removeClass('hidden');
        workspaceToggleButton.removeClass('hidden');
        profileModal.show();
    });

    // 📌 Close Profile Modal and Show Sidebar Again
    closeProfileModal.click(function () {
        profileModal.hide();
        sidebar.removeClass('closed').addClass('open').css("left", "0px");
    });

    // 📌 Sidebar Search: Filter Assigned Students
    $('#sidebar-student-search').on('input', function () {
        const query = $(this).val().toLowerCase().trim();
        $('.student-item').each(function () {
            $(this).toggle($(this).text().toLowerCase().includes(query));
        });
    });


    document.addEventListener("DOMContentLoaded", function () {
        const semesterTabs = document.getElementById("semesterTabs"); // Ensure correct ID
        semesterTabs.style.display = "none"; // Hide initially
    
        document.querySelectorAll(".student-list-item").forEach(student => {
            student.addEventListener("click", function () {
                // Show semester tabs when a student is clicked
                semesterTabs.style.display = "block"; 
    
                // Highlight the selected student
                document.querySelectorAll(".student-list-item").forEach(item => item.classList.remove("active"));
                this.classList.add("active");
    
                // Fetch student data and update workspace (implement if not already done)
                loadStudentData(this.dataset.studentId);
            });
        });
    });
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".student-list-item") && !event.target.closest("#semesterTabs")) {
            document.getElementById("semesterTabs").style.display = "none";
        }
    });
        
//--------------edit profile-----------------------
    
    // 📌 Load Proctor Data when Dashboard Opens
    async function loadProctorProfile() {
        try {
            const response = await fetch('/getProctorProfile');
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();

            $('#proctor-name').text(data.name);
            $('#proctor-designation').text(data.designation);

            // Pre-fill profile modal fields
            $('#proctor-name-input').val(data.name);
            $('#proctor-email-input').val(data.email);
            $('#proctor-designation-input').val(data.designation);
            $('#proctor-phone-input').val(data.phone);
        } catch (error) {
            console.error('Error loading proctor profile:', error);
        }
    }

    loadProctorProfile(); // Load profile on page load

    // 📌 Handle Profile Update Submission
    $('#profile-form').submit(async function (e) {
        e.preventDefault();
    
        const formData = {
            name: $('#proctor-name-input').val().trim(),
            email: $('#proctor-email-input').val().trim(),
            designation: $('#proctor-designation-input').val().trim(),
            phone: $('#proctor-phone-input').val().trim(),
        };
    
        // Basic validation
        if (!formData.name || !formData.email || !formData.designation || !formData.phone) {
            alert("Please fill out all fields before submitting.");
            return;
        }
    
        try {
            const response = await fetch('/updateProctorProfile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
    
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Update failed");
    
            alert(result.message || 'Profile updated successfully.');
            $('#profile-modal').hide();
            loadProctorProfile(); // Reload profile data
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
    
//--------------upload -----------------------------
document.getElementById('upload-marks-button').addEventListener('click', function () {
    console.log("Opening modal..."); // Debugging
    document.getElementById('uploadModal').style.display = 'block';


});

document.getElementById('close-upload-modal').addEventListener('click', function () {
    document.getElementById('uploadModal').style.display = 'none';
});
window.addEventListener('click', function (event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

document.getElementById('uploadCSVForm').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('marksFile');
    if (!fileInput.files.length) return  alert("Please select a CSV file before uploading.");
     

    const formData = new FormData();
    formData.append("marksFile", fileInput.files[0]); // Ensure the key matches the backend

    $.ajax({
        type: 'POST',
        url: '/uploadMarks',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            alert(response.message || "Marks uploaded successfully!"); 
            location.reload(); // 🔹 Refresh the page after success
        },
        error: function (xhr) {
            alert(xhr.responseText || "Error uploading file.");
        }
    });
});


    // 📌 Load Assigned Students for Proctor
    async function loadAssignedStudents() {
        try {
            const response = await fetch('/getAssignedStudents');
            const { proctorName, designation, students } = await response.json();

            $('#proctor-name').text(proctorName);
            $('#proctor-designation').text(designation);
            const studentList = $('#students-list');
            studentList.empty();
            students.forEach(student => {
                studentList.append(`
                    <li data-id="${student.student_id}" class="student-item">
                        ${student.name} (${student.regid})
                    </li>
                `);
            });
        } catch (error) {
            console.error('Error loading assigned students:', error);
        }
    }
    document.querySelectorAll(".student-item").forEach(student => {
        student.addEventListener("click", async function () {
            const studentId = this.dataset.studentId;
            const semester = document.getElementById("selectedSemester").value;
    
            try {
                const response = await fetch(`/getGpaCgpa?studentId=${studentId}&semester=${semester}`);
                const data = await response.json();
    
                document.getElementById("gpaDisplay").textContent = `GPA: ${data.gpa}`;
                document.getElementById("cgpaDisplay").textContent = `CGPA: ${data.cgpa}`;
    
                // Hide watermark and show student data
                document.getElementById("watermark").style.display = "none";
                document.getElementById("studentData").style.display = "block";
    
            } catch (error) {
                console.error("Error fetching GPA/CGPA:", error);
            }
        });
    });
    
    // 📌 Load Student Data When Sidebar Student Clicked
    $(document).on('click', '.student-item', function () {
        const studentId = $(this).data('id');
        loadStudentWorkspace(studentId);

        // 📌 Hide Sidebar & Expand Workspace
        sidebar.removeClass('open').addClass('closed').css("left", "-250px");
        workspaceToggleButton.removeClass('hidden');
    });

    loadAssignedStudents();
});;
    

function resetWorkspace() {
    document.getElementById("studentData").style.display = "none";
    document.getElementById("watermark").style.display = "block";
}

    // ─── FUNCTION: LOAD STUDENT WORKSPACE ─────────────────
    async function loadStudentWorkspace(studentId) {
        try {
            const response = await fetch(`/getStudentAcademicRecord/${studentId}`);
            const { student, subjects } = await response.json();
    
            if (!student || !subjects) {
                throw new Error("Invalid student data received.");
            }
    
            const workspace = $('#student-workspace');
            workspace.empty();
    
            // 📌 Student Header
            workspace.append(`
                <div id="student-header">
                    <h3>${student.name} (${student.regid})</h3>
                </div>
            `);
    
            // 📌 Create Semester Tabs (1-8) + Achievements
            let tabHtml = `<ul id="tab-headers" class="tab-container">`;
            for (let sem = 1; sem <= 8; sem++) {
                tabHtml += `<li class="tab-header" data-tab="${sem}">Semester ${sem}</li>`;
            }
            tabHtml += `<li class="tab-header" data-tab="achievements">Achievements</li></ul>`;
            workspace.append(tabHtml);
    
            workspace.append('<div id="tab-contents"></div>');
    
            // 📌 Create Tab Content for Each Semester
            for (let sem = 1; sem <= 8; sem++) {
                $('#tab-contents').append(`<div class="tab-content" id="tab-${sem}" style="display: none;" data-student-id="${studentId}"></div>`);
            }
            $('#tab-contents').append(`<div class="tab-content" id="tab-achievements" style="display: none;"></div>`);
    
            // 📌 Populate Each Semester Tab with Subjects
            for (let sem = 1; sem <= 8; sem++) {
                let semSubjects = subjects.filter(s => s.semester == sem);
                console.log(`📌 Semester ${sem} Subjects:`, semSubjects);
    
                if (semSubjects.length === 0) {
                    $(`#tab-${sem}`).append(`<p class="no-data">No data available for Semester ${sem}.</p>`);
                    continue;
                }
    
                let tableHtml = `<table class="academic-table">
                    <thead>
                        <tr>
                            <th>Subject Name</th>
                            <th>Credit</th>
                            <th>Subject Code</th>
                            <th>Attendance 1</th>
                            <th>Attendance 2</th>
                            <th>Test 1</th>
                            <th>Test 2</th>
                            <th>Grade</th>
                            <th>Internal Marks</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
                semSubjects.forEach(sub => {
                    tableHtml += `
                        <tr data-subject-code="${sub.subject_code}">
                            <td>${sub.subject}</td>
                            <td>${sub.credit}</td>
                            <td>${sub.subject_code}</td>
                            <td contenteditable="true" class="edit-attendance1">${sub.attendance1 || ''}</td>
                            <td contenteditable="true" class="edit-attendance2">${sub.attendance2 || ''}</td>
                            <td contenteditable="true" class="edit-test1">${sub.test1 || ''}</td>
                            <td contenteditable="true" class="edit-test2">${sub.test2 || ''}</td>
                            <td contenteditable="true" class="edit-grade">${sub.grades || ''}</td>
                            <td contenteditable="true" class="edit-internal">${sub.internal_marks || ''}</td>
                        </tr>`;
                });
    
                tableHtml += `</tbody></table>
                <div class="gpa-cgpa">
                    <p>GPA: <span class="gpa-value" data-sem="${sem}">--</span></p>
                    <p>CGPA: <span class="cgpa-value" data-sem="${sem}">--</span></p>
                    <button class="update-marks-btn" data-sem="${sem}">Apply Updates</button>
                </div>`;
    
                // 📌 Ensure the Tab Exists Before Updating
                const tabElement = $(`#tab-${sem}`);
                if (tabElement.length) {
                    tabElement.empty().append(tableHtml);
                    console.log(`✅ Updated #tab-${sem} successfully.`);
                } else {
                    console.error(`❌ ERROR: #tab-${sem} does not exist.`);
                }
            }
    
            // 📌 Handle Tab Switching
            $('.tab-header').click(function () {
                const selectedTab = $(this).data('tab');
                $('.tab-content').hide();
                $(`#tab-${selectedTab}`).fadeIn(200);
                $('.tab-header').removeClass('active');
                $(this).addClass('active');
    
                // 📌 Load Achievements When Clicked
                if (selectedTab === 'achievements') {
                    loadAchievements(studentId);
                }
            });
    
            // 📌 Default to Semester 1 (Auto Click)
            $('.tab-header[data-tab="1"]').trigger('click');
    
        } catch (error) {
            console.error('❌ Error loading student academic record:', error);
            alert('Failed to load student academic record.');
        }
    }
    
    
    // ─── FUNCTION: SAVE SEMESTER MARKS ─────────────────

// 📌 Update Marks & Refresh GPA/CGPA
async function saveSemesterMarks(studentId, semester) {
    const rows = $(`#tab-${semester} table.academic-table tbody tr`);
    const updates = [];

    rows.each(function () {
        const subject_code = $(this).data('subject-code');
        const attendance1 = $(this).find('.edit-attendance1').text().trim() || "0";
        const attendance2 = $(this).find('.edit-attendance2').text().trim() || "0";
        const test1 = $(this).find('.edit-test1').text().trim() || "0";
        const test2 = $(this).find('.edit-test2').text().trim() || "0";
        const grade = $(this).find('.edit-grade').text().trim().toUpperCase() || "U";
        const internal = $(this).find('.edit-internal').text().trim() || "0";

        updates.push({ subject_code, attendance1, attendance2, test1, test2, grade, internal });
    });

    try {
        // 🔹 Update Marks
        const updateResponse = await fetch('/updateStudentMarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, semester, updates })
        });

        if (!updateResponse.ok) throw new Error('Failed to update marks');

        // 🔹 Fetch Updated GPA/CGPA
        const gpaResponse = await fetch(`/getGpaCgpa?studentId=${studentId}&semester=${semester}`);
        if (!gpaResponse.ok) throw new Error('Failed to fetch GPA/CGPA');

        const { gpa, cgpa } = await gpaResponse.json();

        // 🔹 Ensure numerical values before updating UI
        const formattedGpa = isNaN(parseFloat(gpa)) ? "0.00" : parseFloat(gpa).toFixed(2);
        const formattedCgpa = isNaN(parseFloat(cgpa)) ? "0.00" : parseFloat(cgpa).toFixed(2);

        // 🔹 Update the UI
        $(`.gpa-value[data-sem="${semester}"]`).text(formattedGpa);
        $('.cgpa-value').text(formattedCgpa);

        alert("Marks updated successfully! GPA & CGPA recalculated.");
    } catch (error) {
        console.error("Error updating marks:", error);
        alert("Failed to update marks. Please try again.");
    }
}


//  Attach Click Event to "Apply Updates" Button
$(document).off('click', '.update-marks-btn').on('click', '.update-marks-btn', function () {
    const sem = $(this).data('sem');
    const studentId = $(this).closest('.tab-content').data('student-id');
    saveSemesterMarks(studentId, sem);
});

async function loadStudentGpaCgpa(studentId, semester) {
    try {
        const response = await fetch(`/getGpaCgpa?studentId=${studentId}&semester=${semester}`);
        if (!response.ok) throw new Error('Failed to fetch GPA/CGPA');

        const { gpa, cgpa } = await response.json();
        
        // 🔹 Ensure numerical values before updating UI
        const formattedGpa = isNaN(parseFloat(gpa)) ? "0.00" : parseFloat(gpa).toFixed(2);
        const formattedCgpa = isNaN(parseFloat(cgpa)) ? "0.00" : parseFloat(cgpa).toFixed(2);

        $(`.gpa-value[data-sem="${semester}"]`).text(formattedGpa);
        $('.cgpa-value').text(formattedCgpa);
    } catch (error) {
        console.error("Error loading GPA/CGPA:", error);
    }
}


// 📌 Call this inside `loadStudentWorkspace()`
for (let sem = 1; sem <= 8; sem++) {
    loadStudentGpaCgpa(studentId, sem);
}



document.getElementById("applyUpdatesBtn").addEventListener("click", async function() {
    const studentId = document.getElementById("studentId").value;
    const semester = document.getElementById("semester").value;
    const updates = collectUpdatedData(); // Function that gathers updated data

    const response = await fetch('/updateStudentMarks', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, semester, updates })
    });

    const result = await response.json();
    alert(result.message);

    // 🔹 Fetch & Update GPA/CGPA
    fetchUpdatedGpaCgpa(studentId, semester);
});

    // ─── FUNCTION: LOAD ACHIEVEMENTS ─────────────────
    async function loadAchievements(studentId) {
        try {
            const response = await fetch(`/getStudentAchievements/${studentId}`);
            const achievements = await response.json();
            let achHtml = `<ul class="achievement-list">`;
            achievements.forEach(ach => {
                achHtml += `<li>${ach.title} - <a href="/downloadAchievement/${ach.id}" target="_blank">Download</a></li>`;
            });
            achHtml += `</ul>`;
            $('#tab-achievements').html(achHtml);
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }
    $(document).ready(function () {
        $(".tab-header").click(function () {
            // Remove 'active' class from all tabs & hide all content
            $(".tab-header").removeClass("active");
            $(".tab-content").hide();
    
            // Add 'active' class to the clicked tab
            $(this).addClass("active");
    
            // Get tab ID & show relevant content
            const tabId = $(this).data("tab");
            $(`#tab-${tabId}`).show();
        });
    
        // 📌 Show Semester 1 by default
        $(".tab-header:first").addClass("active");
        $("#tab-1").show();
    });
    document.addEventListener("DOMContentLoaded", function () {
        const tabs = document.querySelectorAll(".tab-header");
        const tabContents = document.getElementById("tab-contents");
    
        tabs.forEach(tab => {
            tab.addEventListener("click", function () {
                const tabId = this.getAttribute("data-tab");
    
                // Remove 'active' class from all tabs
                tabs.forEach(t => t.classList.remove("active"));
                this.classList.add("active");
    
                // Fetch and display the relevant semester data
                loadSemesterData(tabId);
            });
        });
    
        function loadSemesterData(semester) {
            tabContents.innerHTML = `<p>Loading Semester ${semester} data...</p>`;
    
            fetch(`/getStudentAcademicRecord/${selectedStudentId}`) // Replace with the actual student ID
                .then(response => response.json())
                .then(data => {
                    const subjects = data.subjects.filter(subject => subject.semester == semester);
                    if (subjects.length === 0) {
                        tabContents.innerHTML = `<p>No records found for Semester ${semester}.</p>`;
                    } else {
                        let table = `<table border="1">
                            <tr>
                                <th>Subject</th>
                                <th>Attendance 1</th>
                                <th>Attendance 2</th>
                                <th>Test 1</th>
                                <th>Test 2</th>
                                <th>Grades</th>
                                <th>Internal Marks</th>
                            </tr>`;
    
                        subjects.forEach(subject => {
                            table += `<tr>
                                <td>${subject.subject_code}</td>
                                <td>${subject.attendance1}</td>
                                <td>${subject.attendance2}</td>
                                <td>${subject.test1}</td>
                                <td>${subject.test2}</td>
                                <td>${subject.grades}</td>
                                <td>${subject.internal_marks}</td>
                            </tr>`;
                        });
    
                        table += `</table>`;
                        tabContents.innerHTML = table;
                    }
                })
                .catch(() => {
                    tabContents.innerHTML = `<p>Error loading data. Please try again.</p>`;
                });
        }
    });
    