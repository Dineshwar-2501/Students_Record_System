$(document).ready(async function () {
    await loadAssignedStudents();

    const sidebar = $('#sidebar');
    const toggleButton = $('#sidebar-toggle-btn'); // Corrected reference
    const workspaceToggleButton = $('#toggle-sidebar-btn'); // Ensure single toggle
    const uploadMarksButton = $('#upload-marks-button');
    const editProfileButton = $('#edit-profile-button');
    const profileModal = $('#profile-modal');
    const closeProfileModal = $('#close-profile-modal');

    // ✅ Fetch session details before UI updates
    try {
        const response = await fetch('/api/session');
        const data = await response.json();

        if (data.role === 'proctor') {
            sidebar.addClass('open').css("left", "0px"); // Sidebar open by default
            toggleButton.hide(); // Hide sidebar toggle button
            workspaceToggleButton.hide(); // Hide workspace button if needed
        }

    } catch (error) {
        console.error("Error loading session data:", error);
    }

    // ✅ Sidebar Toggle
    toggleButton.click(function (event) {
        event.stopPropagation();
        toggleSidebar();
    });

    // ✅ Toggle Sidebar when workspace button clicked
    workspaceToggleButton.click(function (event) {
        event.stopPropagation();
        toggleSidebar();
    });

    function toggleSidebar() {
        if (sidebar.hasClass('open')) {
            sidebar.removeClass('open').addClass('closed').css("left", "-250px");
            toggleButton.removeClass('hidden').show();
            workspaceToggleButton.removeClass('hidden').show();
        } else {
            sidebar.removeClass('closed').addClass('open').css("left", "0px");
            toggleButton.addClass('hidden').hide();
            workspaceToggleButton.addClass('hidden').hide();
        }
    }

    // ✅ Close Sidebar when clicking outside
    $(document).click(function (event) {
        if (!$(event.target).closest("#sidebar, #sidebar-toggle-btn, #toggle-sidebar-btn").length) {
            sidebar.removeClass("open").addClass("closed").css("left", "-250px");
            toggleButton.removeClass("hidden").show();
            workspaceToggleButton.removeClass("hidden").show();
        }
    });

    // ✅ Hide Sidebar When Upload Marks Button Clicked
    uploadMarksButton.click(function () {
        sidebar.removeClass('open').addClass('closed').css("left", "-550px");
        toggleButton.removeClass('hidden').show();
        workspaceToggleButton.removeClass('hidden').show();
    });

    // ✅ Hide Sidebar When Edit Profile Button Clicked & Show Modal
    editProfileButton.click(function () {
        sidebar.removeClass('open').addClass('closed').css("left", "-250px");
        toggleButton.removeClass('hidden').show();
        workspaceToggleButton.removeClass('hidden').show();
        profileModal.show();
    });

    // ✅ Close Profile Modal and Show Sidebar Again
    closeProfileModal.click(function () {
        profileModal.hide();
        sidebar.removeClass('closed').addClass('open').css("left", "0px");
    });

    // ✅ Sidebar Search: Filter Assigned Students
    $('#sidebar-student-search').on('input', function () {
        const query = $(this).val().toLowerCase().trim();
        $('.student-item').each(function () {
            $(this).toggle($(this).text().toLowerCase().includes(query));
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
    document.getElementById("assign-marks-button").addEventListener("click", async () => {
        try {
            const response = await fetch("/assignStudentMarks", { method: "POST" });
    
            if (response.ok) {
                const data = await response.json();
                alert(`✅ Marks assigned! ${data.message}`);
                
                // Reload the page after successful update
                location.reload();
            } else {
                const errorData = await response.json();
                alert(`❌ Failed to assign marks: ${errorData.message}`);
            }
        } catch (error) {
            console.error("❌ Error assigning marks:", error.message);
            alert("Internal server error.");
        }
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
            $('#proctor-phone-input').val(data.phone_number);
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
            phone_number: $('#proctor-phone-input').val().trim(),
        };
    
        // Basic validation
        if (!formData.name || !formData.email || !formData.designation || !formData.phone_number) {
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


    loadAssignedStudents();
});
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
            tabHtml += `<li class="tab-header ${sem === 1 ? 'active' : ''}" data-tab="${sem}">Semester ${sem}</li>`;
        }
        tabHtml += `<li class="tab-header" data-tab="achievements">Achievements</li></ul>`;
        workspace.append(tabHtml);

        // 📌 Create tab content containers
        let tabContentHtml = '<div id="tab-contents">';
        for (let sem = 1; sem <= 8; sem++) {
            tabContentHtml += `<div class="tab-content" id="tab-${sem}" data-student-id="${studentId}" style="display: ${sem === 1 ? 'block' : 'none'};"></div>`;
        }
        tabContentHtml += `<div class="tab-content" id="tab-achievements" style="display: none;">Achievements Content</div></div>`;
        workspace.append(tabContentHtml);

        // 📌 Generate Table Content for Each Semester
        for (let sem = 1; sem <= 8; sem++) {
            let semSubjects = subjects.filter(s => s.semester == sem);

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
                        <th>Grades</th>
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
                        <td contenteditable="false" class="edit-attendance1">${sub.attendance1 || ''}</td>
                        <td contenteditable="false" class="edit-attendance2">${sub.attendance2 || ''}</td>
                        <td contenteditable="false" class="edit-test1">${sub.test1 || ''}</td>
                        <td contenteditable="false" class="edit-test2">${sub.test2 || ''}</td>
                        <td contenteditable="false" class="edit-grades">${sub.grades || ''}</td>
                        <td contenteditable="false" class="edit-internal_marks">${sub.internal_marks || ''}</td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>
            <div class="gpa-cgpa-container">
                <button class="edit-marks-btn" data-sem="${sem}">Edit</button>
                <div class="gpa-cgpa">
                    <p>GPA: <span class="gpa-value" data-sem="${sem}">${semSubjects.length > 0 ? semSubjects[0].gpa : '--'}</span></p>
                    <p>CGPA: <span class="cgpa-value" data-sem="${sem}">${semSubjects.length > 0 ? semSubjects[0].cgpa : '--'}</span></p>
                </div>
                <button class="save-marks-btn" data-sem="${sem}" style="display:none;">Save</button>
            </div>`;

            $(`#tab-${sem}`).empty().append(tableHtml);
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

        // 📌 Enable Editing
        $('.edit-marks-btn').click(function () {
            const sem = $(this).data('sem');

            // Store original data
            $(`#tab-${sem} td[class^="edit-"]`).each(function () {
                $(this).attr('data-original', $(this).text().trim());
            });

            $(`#tab-${sem} td[class^="edit-"]`).attr('contenteditable', 'true');
            $(this).hide();
            $(`.save-marks-btn[data-sem='${sem}']`).show();
        });

        // 📌 Save Edited Marks
        $('.save-marks-btn').click(async function () {
            const sem = $(this).data('sem');
            const regid = student.regid;
        
            if (!regid) {
                alert("Error: Registration ID is missing!");
                console.error("🚨 Missing regid");
                return;
            }
        
            const rows = $(`#tab-${sem} tbody tr`);
            let updatedData = [];
        
            rows.each(function () {
                let row = $(this);
                let subjectCode = row.data('subject-code');
                let changes = { subject_code: subjectCode };
                let hasChanges = false;
        
                ['attendance1', 'attendance2', 'test1', 'test2', 'internal_marks', 'grades'].forEach(field => {
                    let cell = row.find(`.edit-${field}`);
                    let newValue = cell.text().trim();
                    let originalValue = cell.attr('data-original');
        
                    if (newValue !== originalValue) {
                        changes[field] = newValue !== "" ? newValue : originalValue;
                        hasChanges = true;
                    }
                });
        
                if (hasChanges) {
                    updatedData.push(changes);
                }
            });
        
            if (updatedData.length === 0) {
                alert("No changes detected.");
                console.warn("⚠️ No valid updates to send.");
                return;
            }
        
            console.log("✅ Sending Data:", JSON.stringify({ regid, semester: sem, updatedData }, null, 2));
        
            try {
                const response = await fetch('/updateStudentMarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ regid, semester: sem, updatedData })
                });
        
                const result = await response.json();
                if (response.ok) {
                    alert('Marks updated successfully!');
                    console.log("✅ Update Success:", result);
        
                    // ✅ Call updateGpaCgpa AFTER marks are updated
                    await updateGpaCgpa(regid);
                    console.log("✅ GPA & CGPA updated successfully!");
                } else {
                    throw new Error(result.message || 'Unknown error occurred.');
                }
        
            } catch (error) {
                alert('Failed to update marks.');
                console.error("❌ Error updating marks:", error);
            }
        
            $(this).hide();
            $(`.edit-marks-btn[data-sem='${sem}']`).show();
            $(`#tab-${sem} td[class^="edit-"]`).attr('contenteditable', 'false');
        });
        

    } catch (error) {
        alert('Failed to load student data.');
        console.error("❌ Error loading workspace:", error);
    }
}

    // ─── FUNCTION: LOAD ACHIEVEMENTS ─────────────────
    $(document).on("click", ".student-item", function () {
        const studentId = $(this).data("id");
        loadAchievements(studentId);
    });
    
    async function loadAchievements(studentId) {
        try {
            const response = await fetch(`/getStudentAchievements/${studentId}`);
            if (!response.ok) throw new Error("Failed to fetch achievements");
    
            const achievements = await response.json();
            let achHtml = `<ul class="achievement-list">`;
    
            if (achievements.length === 0) {
                achHtml = "<p class='no-data'>No achievements uploaded yet.</p>";
            } else {
                achievements.forEach(ach => {
                    achHtml += `
                        <li>
                            <span>${ach.title}</span>
                            <a href="/downloadAchievement/${ach.id}" target="_blank" class="download-btn">Download</a>
                        </li>`;
                });
                achHtml += `</ul>`;
            }
    
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
    