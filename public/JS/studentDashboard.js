document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch('/api/session'); // Fetch session details
        const data = await response.json();

        if (data.userId) { 
            loadStudentWorkspace(data.userId); // Call function to fetch data
        } else {
            console.error("User ID not found in session.");
        }
    } catch (error) {
        console.error("Error loading session data:", error);
    }
});

async function loadStudentWorkspace(studentId) {
    try {
        const response = await fetch(`/getStudentAcademicRecord/${studentId}`);
        if (!response.ok) throw new Error("Failed to fetch student data");

        const { student, subjects } = await response.json();
        if (!student || !subjects) throw new Error("Invalid student data received.");

        const workspace = $('#student-workspace');
        workspace.empty();

        // 📌 Student Header
        workspace.append(`
            <div id="student-header">
                <h3>${student.name} (${student.regid})</h3>
            </div>
        `);

        // 📌 Create Tabs (1-8 Semesters + Achievements)
        let tabHtml = `<ul id="tab-headers" class="tab-container">`;
        for (let sem = 1; sem <= 8; sem++) {
            tabHtml += `<li class="tab-header" data-tab="${sem}">Semester ${sem}</li>`;
        }
        tabHtml += `<li class="tab-header" data-tab="achievements">Achievements</li></ul>`;
        workspace.append(tabHtml);
        workspace.append('<div id="tab-contents"></div>');

        // 📌 Create Content for Each Tab
        for (let sem = 1; sem <= 8; sem++) {
            $('#tab-contents').append(`<div class="tab-content" id="tab-${sem}" style="display: none;"></div>`);
        }

        $('#tab-contents').append(`
            <div class="tab-content" id="tab-achievements" style="display: none; position: relative;">
                <button id="upload-achievement-btn" class="upload-btn">Upload Achievement</button>
                <div id="achievement-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>Upload Achievement</h3>
                        <input type="file" id="achievement-file" />
                        <button id="submit-achievement">Submit</button>
                    </div>
                </div>
            </div>
        `);

        // 📌 Populate Each Semester Tab with Subjects
        for (let sem = 1; sem <= 8; sem++) {
            let semSubjects = subjects.filter(s => s.semester == sem);

            if (semSubjects.length === 0) {
                $(`#tab-${sem}`).append(`<p class="no-data">No data available for Semester ${sem}.</p>`);
                continue;
            }

            let tableHtml = `<table class="academic-table">
                <thead>
                    <tr>
                        <th>Subject</th>
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
                    <tr>
                        <td>${sub.subject}</td>
                        <td>${sub.credit}</td>
                        <td>${sub.subject_code}</td>
                        <td>${sub.attendance1 || ''}</td>
                        <td>${sub.attendance2 || ''}</td>
                        <td>${sub.test1 || ''}</td>
                        <td>${sub.test2 || ''}</td>
                        <td>${sub.grades || ''}</td>
                        <td>${sub.internal_marks || ''}</td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>
            <div class="gpa-cgpa">
                <p>GPA: <span class="gpa-value" data-sem="${sem}">--</span></p>
                <p>CGPA: <span class="cgpa-value" data-sem="${sem}">--</span></p>
            </div>`;

            $(`#tab-${sem}`).html(tableHtml);
            $(".gpa-value[data-sem='" + sem + "']").text(calculateCGPA(subjects, sem));
        }

        // 📌 Handle Tab Switching
        $('.tab-header').click(function () {
            const selectedTab = $(this).data('tab');
            $('.tab-content').hide();
            $(`#tab-${selectedTab}`).fadeIn(200);
            $('.tab-header').removeClass('active');
            $(this).addClass('active');

            if (selectedTab === 'achievements') {
                loadAchievements(studentId);
            }
        });

        // 📌 Default to Semester 1
        $('.tab-header[data-tab="1"]').trigger('click');

        // 📌 Achievement Upload Modal Handling
        $(document).on("click", "#upload-achievement-btn", function () {
            $("#achievement-modal").fadeIn();
        });

        $(document).on("click", ".close-modal", function () {
            $("#achievement-modal").fadeOut();
        });

        $(window).click(function(event) {
            if ($(event.target).is("#achievement-modal")) {
                $('#achievement-modal').fadeOut();
            }
        });

        $(document).on("click", "#submit-achievement", async function () {
            const fileInput = document.getElementById('achievement-file');
            if (fileInput.files.length === 0) {
                alert("Please select a file to upload.");
                return;
            }

            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            formData.append("student_id", studentId);

            try {
                const response = await fetch('/uploadAchievement', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    alert("Achievement uploaded successfully!");
                    $("#achievement-modal").fadeOut();
                    loadAchievements(studentId);
                } else {
                    alert("Failed to upload achievement.");
                }
            } catch (error) {
                console.error("Error uploading achievement:", error);
                alert("Error uploading achievement.");
            }
        });

    } catch (error) {
        console.error('❌ Error loading student academic record:', error);
        alert('Failed to load student academic record.');
    }
}

// 📌 Function to Get Grade Point
function getGradePoint(grade) {
    const gradePoints = {
        'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
    };
    return gradePoints[grade] || 0;
}

// 📌 Function to Calculate CGPA
function calculateCGPA(subjects, currentSem) {
    let totalCredits = 0, totalGradePoints = 0;
    
    subjects.forEach(sub => {
        if (sub.semester <= currentSem && sub.grades && sub.credit) {
            let gradePoint = getGradePoint(sub.grades);
            totalCredits += sub.credit;
            totalGradePoints += gradePoint * sub.credit;
        }
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '--';
}

// 📌 Load Achievements
async function loadAchievements(studentId) {
    try {
        const response = await fetch(`/getStudentAchievements/${studentId}`);
        if (!response.ok) throw new Error("Failed to fetch achievements");

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
$('#submit-achievement').click(async function () {
    const fileInput = document.getElementById('achievement-file');
    const titleInput = document.getElementById('achievement-title');

    if (!fileInput.files.length || titleInput.value.trim() === "") {
        alert("Please enter a title and select a file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("student_id", studentId); // Ensure `studentId` is defined
    formData.append("title", titleInput.value.trim());

    try {
        const response = await fetch('/uploadAchievement', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert("Achievement uploaded successfully!");
            $('#achievement-modal').fadeOut();
            loadAchievements(studentId); // Refresh achievement list
        } else {
            alert("Upload failed: " + result.message);
        }
    } catch (error) {
        console.error("Error uploading achievement:", error);
        alert("An error occurred while uploading.");
    }
});


