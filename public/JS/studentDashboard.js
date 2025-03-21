
// let db;


// // 📌 Initialize IndexedDB
// const request = indexedDB.open("studentDB", 1);

// request.onupgradeneeded = function (event) {
//     db = event.target.result;
    
//     if (!db.objectStoreNames.contains("students")) {
//         db.createObjectStore("students", { keyPath: "id" });
//     }
// };

// request.onsuccess = function (event) {
//     db = event.target.result;
//     console.log("✅ IndexedDB initialized");
// };

// request.onerror = function (event) {
//     console.error("❌ IndexedDB error:", event.target.errorCode);
// };

// // 📌 Function to get cached session from IndexedDB
// function getSessionFromDB(callback) {
//     const request = indexedDB.open("UserSessionDB", 1);

//     request.onsuccess = (event) => {
//         const db = event.target.result;
//         const tx = db.transaction("sessions", "readonly");
//         const store = tx.objectStore("sessions");
//         const getSession = store.get(1);

//         getSession.onsuccess = () => {
//             if (getSession.result) {
//                 callback(getSession.result);
//             } else {
//                 callback(null);
//             }
//         };
//     };
// }

// // 📌 Load session and fetch student data
// document.addEventListener("DOMContentLoaded", async function () {
//     try {
//         const response = await fetch('/api/session');
//         const data = await response.json();

//         if (data.userId) {
//             loadStudentData(data.userId);
//         } else {
//             console.error("User ID not found in session.");
//         }
//     } catch (error) {
//         console.error("Error loading session data:", error);
//     }
// });

// // 📌 Fetch and store student data
// async function loadStudentData(studentId) {
//     try {
//         const response = await fetch(`/getStudentAcademicRecord/${studentId}`);
//         if (!response.ok) throw new Error("Failed to fetch student data");

//         const { student, subjects } = await response.json();
//         if (!student || !subjects) throw new Error("Invalid student data received.");

//         // 📌 Store in IndexedDB for offline use
//         const tx = db.transaction("students", "readwrite");
//         const store = tx.objectStore("students");
//         store.put({ id: studentId, student, subjects });
//         console.log("✅ Student data cached in IndexedDB");

//         loadStudentWorkspace(student, subjects);
//     } catch (error) {
//         console.error("❌ Error loading student data:", error);
//         alert("Failed to load student data. Trying offline mode...");

//         // 📌 Try loading from IndexedDB if offline
//         const tx = db.transaction("students", "readonly");
//         const store = tx.objectStore("students");
//         const request = store.get(studentId);

//         request.onsuccess = function () {
//             if (request.result) {
//                 console.log("📌 Loaded student data from IndexedDB");
//                 loadStudentWorkspace(request.result.student, request.result.subjects);
//             } else {
//                 alert("No offline data available.");
//             }
//         };
//     }
// }

// // 📌 Render UI for student workspace
// async function loadStudentWorkspace(student, subjects) {
//     const workspace = $('#student-workspace');
//     workspace.empty();

//     // 📌 Student Header
//     workspace.append(`
//         <div id="student-header">
//             <h3>${student.name} (${student.regid})</h3>
//         </div>
//     `);
//         // 📌 Create Tabs (1-8 Semesters + Achievements)
//         let tabHtml = `<ul id="tab-headers" class="tab-container">`;
//         for (let sem = 1; sem <= 8; sem++) {
//             tabHtml += `<li class="tab-header" data-tab="${sem}">Semester ${sem}</li>`;
//         }
//         tabHtml += `<li class="tab-header" data-tab="achievements">Achievements</li></ul>`;
//         workspace.append(tabHtml);
//         workspace.append('<div id="tab-contents"></div>');

//         // 📌 Create Content for Each Tab
//         for (let sem = 1; sem <= 8; sem++) {
//             $('#tab-contents').append(`<div class="tab-content" id="tab-${sem}" style="display: none;"></div>`);
//         }

//         $('#tab-contents').append(`
//             <div class="tab-content" id="tab-achievements" style="display: none; position: relative;">
            

//                 <button id="upload-achievement-btn" class="upload-btn">Upload Achievement</button>
//                 <div id="achievement-modal" class="modal" style="display: none;">
//                     <div class="modal-content">
//                         <span class="close-modal">&times;</span>
//                         <h3>Upload Achievement</h3>
//                         <input type="text" id="achievement-title" placeholder="Enter Achievement Title" />
//                         <input type="file" id="achievement-file" />
//                         <button id="submit-achievement">Submit</button>
//                     </div>
//                 </div>
//                 <ul id="achievement-list" class="achievement-list"></ul>
//             </div>
//         `);

//         // 📌 Populate Each Semester Tab with Subjects
//         for (let sem = 1; sem <= 8; sem++) {
//             let semSubjects = subjects.filter(s => s.semester == sem);

//             if (semSubjects.length === 0) {
//                 $(`#tab-${sem}`).append(`<p class="no-data">No data available for Semester ${sem}.</p>`);
//                 continue;
//             }

//             let tableHtml = `<table class="academic-table">
//                 <thead>
//                     <tr>
//                         <th>Subject</th>
//                         <th>Credit</th>
//                         <th>Subject Code</th>
//                         <th>Attendance 1</th>
//                         <th>Attendance 2</th>
//                         <th>Test 1</th>
//                         <th>Test 2</th>
//                         <th>Grade</th>
//                         <th>Internal Marks</th>
//                     </tr>
//                 </thead>
//                 <tbody>`;

//             semSubjects.forEach(sub => {
//                 tableHtml += `
//                     <tr>
//                         <td>${sub.subject}</td>
//                         <td>${sub.credit}</td>
//                         <td>${sub.subject_code}</td>
//                         <td>${sub.attendance1 || ''}</td>
//                         <td>${sub.attendance2 || ''}</td>
//                         <td>${sub.test1 || ''}</td>
//                         <td>${sub.test2 || ''}</td>
//                         <td>${sub.grades || ''}</td>
//                         <td>${sub.internal_marks || ''}</td>
//                     </tr>`;
//             });

//             tableHtml += `</tbody></table>
//             <div class="gpa-cgpa">
//                 <p>GPA: <span class="gpa-value" data-sem="${sem}">--</span></p>
//                 <p>CGPA: <span class="cgpa-value" data-sem="${sem}">--</span></p>
//             </div>`;

//             $(`#tab-${sem}`).html(tableHtml);
//             const gpaCgpaResponse = await fetch(`/getGpaCgpa?studentId=${studentId}&semester=${sem}`);
//             const { gpa, cgpa } = await gpaCgpaResponse.json();
//             $(".gpa-value[data-sem='" + sem + "']").text(gpa || '--');
//             $(".cgpa-value[data-sem='" + sem + "']").text(cgpa || '--');
            
            
//         }

//         // 📌 Handle Tab Switching
//         $('.tab-header').click(function () {
//             const selectedTab = $(this).data('tab');
//             $('.tab-content').hide();
//             $(`#tab-${selectedTab}`).fadeIn(200);
//             $('.tab-header').removeClass('active');
//             $(this).addClass('active');

//             if (selectedTab === 'achievements') {
//                 loadAchievements(studentId);
//             }
//         });

//         // 📌 Default to Semester 1
//         $('.tab-header[data-tab="1"]').trigger('click');

//         // 📌 Achievement Upload Modal Handling
//         $(document).on("click", "#upload-achievement-btn", function () {
//             $("#achievement-modal").fadeIn();
//         });

//         $(document).on("click", ".close-modal", function () {
//             $("#achievement-modal").fadeOut();
//         });

//         $(window).click(function(event) {
//             if ($(event.target).is("#achievement-modal")) {
//                 $('#achievement-modal').fadeOut();
//             }
//         });

//         $(document).on("click", "#submit-achievement", async function () {
//             const fileInput = document.getElementById('achievement-file');
//             const titleInput = document.getElementById('achievement-title').value.trim();
        
//             if (!titleInput) {
//                 alert("Please enter a title.");
//                 return;
//             }
        
//             if (fileInput.files.length === 0) {
//                 alert("Please select a file to upload.");
//                 return;
//             }
        
//             const formData = new FormData();
//             formData.append("file", fileInput.files[0]);
//             formData.append("title", titleInput); // ✅ Now sending the title
//             formData.append("student_id", studentId);
        
//             try {
//                 const response = await fetch('/uploadAchievement', {
//                     method: 'POST',
//                     body: formData
//                 });
        
//                 if (!response.ok) {
//                     const errorText = await response.text();
//                     console.error("Upload failed:", errorText);
//                     throw new Error("Failed to upload achievement.");
//                 }
        
//                 const result = await response.json();
//                 if (result.success) {
//                     alert("Achievement uploaded successfully!");
//                     $("#achievement-modal").fadeOut();
//                     loadAchievements(studentId);
//                 } else {
//                     alert(result.message || "Failed to upload achievement.");
//                 }
//             } catch (error) {
//                 console.error("❌ Error uploading achievement:", error);
//                 alert("Error uploading achievement.");
//             }
//         });
        

//     } 

// // 📌 Load Achievements
// async function loadAchievements(studentId) {
    
    
//     try {
//         const response = await fetch(`/getStudentAchievements/${studentId}`);
//         if (!response.ok) throw new Error("Failed to fetch achievements");

//         const achievements = await response.json();

//         let achHtml = `<button id="upload-achievement-btn" class="upload-btn">Upload Achievement</button>`;

//         if (achievements.length === 0) {
//             achHtml += '<p class="no-data">No achievements uploaded yet.</p>';
//         } else {
//             achHtml += `<ul class="achievement-list">`;
//             achievements.forEach(ach => {
//                 achHtml += `
//                     <li>
//                         <span>${ach.title}</span>
//                         <img src="/downloadAchievement/${ach.id}" alt="${ach.title}" class="achievement-image" />
//                         <iframe src="https://drive.google.com/file/d/1vKN8dpkDid4acRwbh4XkMtO1a45sC5cN/view?usp=drive_link&embedded=true" width="100%" height="500px"></iframe> 
//                         <a href="/downloadAchievement/${ach.id}" target="_blank" class="download-btn">Download</a>
//                     </li>`;
//             });
//             achHtml += `</ul>`;
//         }

//         // ✅ Append the button & achievements
//         $('#tab-achievements').html(achHtml);

//     } catch (error) {
//         console.error('Error loading    achievements:', error);
//     }
// }



// $('#submit-achievement').click(async function () {
//     const fileInput = document.getElementById('achievement-file');
//     const titleInput = document.getElementById('achievement-title');
//     const response = await fetch('/api/session'); 
//     const data = await response.json();
//     const studentId = data.userId;

//     if (!studentId) {
//         alert("Student ID is not set. Please log in again.");
//         return;
//     }

   
//     if (!fileInput.files.length || titleInput.value.trim() === "") {
//         alert("Please enter a title and select a file.");
//         return;
//     }

//     const formData = new FormData();
//     formData.append("file", fileInput.files[0]);
//     formData.append("student_id", studentId);
//     formData.append("title", titleInput.value.trim());

//     try {
//         const response = await fetch('/uploadAchievement', {
//             method: 'POST',
//             body: formData
//         });

//         const textResponse = await response.text();
//         console.log("Raw Response:", textResponse);

//         try {
//             const result = JSON.parse(textResponse);

//             if (result.success) {
//                 alert("Achievement uploaded successfully!");
//                 $('#achievement-modal').fadeOut();
//                 loadAchievements(studentId);
//             } else {
//                 alert("Upload failed: " + result.message);
//             }
//         } catch (jsonError) {
//             console.error("JSON Parse Error:", jsonError);
//             alert("Unexpected response from server.");
//         }

//     } catch (error) {
//         console.error("Error uploading achievement:", error);
//         alert("An error occurred while uploading.");
//     }
// });

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
                        <input type="text" id="achievement-title" placeholder="Enter Achievement Title" />
                        <input type="file" id="achievement-file" />
                        <button id="submit-achievement">Submit</button>
                    </div>
                </div>
                <ul id="achievement-list" class="achievement-list"></ul>
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
            <div class="gpa-cgpa-container">
                
                <div class="gpa-cgpa">
                    <p>GPA: <span class="gpa-value" data-sem="${sem}">${semSubjects.length > 0 ? semSubjects[0].gpa : '--'}</span></p>
                    <p>CGPA: <span class="cgpa-value" data-sem="${sem}">${semSubjects.length > 0 ? semSubjects[0].cgpa : '--'}</span></p>
                </div>
                
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
            const titleInput = document.getElementById('achievement-title').value.trim();
        
            if (!titleInput) {
                alert("Please enter a title.");
                return;
            }
        
            if (fileInput.files.length === 0) {
                alert("Please select a file to upload.");
                return;
            }
        
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            formData.append("title", titleInput); // ✅ Now sending the title
            formData.append("student_id", studentId);
        
            try {
                const response = await fetch('/uploadAchievement', {
                    method: 'POST',
                    body: formData
                });
        
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Upload failed:", errorText);
                    throw new Error("Failed to upload achievement.");
                }
        
                const result = await response.json();
                if (result.success) {
                    alert("Achievement uploaded successfully!");
                    $("#achievement-modal").fadeOut();
                    loadAchievements(studentId);
                } else {
                    alert(result.message || "Failed to upload achievement.");
                }
            } catch (error) {
                console.error("❌ Error uploading achievement:", error);
                alert("Error uploading achievement.");
            }
        });
        

    } catch (error) {
        console.error('❌ Error loading student academic record:', error);
        alert('Failed to load student academic record.');
    }
}

// 📌 Load Achievements
async function loadAchievements(studentId) {
    try {
        const response = await fetch(`/getStudentAchievements/${studentId}`);
        if (!response.ok) throw new Error("Failed to fetch achievements");

        const achievements = await response.json();

        let achHtml = `<button id="upload-achievement-btn" class="upload-btn">Upload Achievement</button>`;

        if (achievements.length === 0) {
            achHtml += '<p class="no-data">No achievements uploaded yet.</p>';
        } else {
            achHtml += `<ul class="achievement-list">`;
            achievements.forEach(ach => {
                achHtml += `
                    <li>
                        <span>${ach.title}</span>
                        <img src="/downloadAchievement/${ach.id}" alt="${ach.title}" class="achievement-image" />
                        <iframe src="https://drive.google.com/file/d/1vKN8dpkDid4acRwbh4XkMtO1a45sC5cN/view?usp=drive_link&embedded=true" width="100%" height="500px"></iframe> 
                        <a href="/downloadAchievement/${ach.id}" target="_blank" class="download-btn">Download</a>
                    </li>`;
            });
            achHtml += `</ul>`;
        }

        // ✅ Append the button & achievements
        $('#tab-achievements').html(achHtml);

    } catch (error) {
        console.error('Error loading    achievements:', error);
    }
}



$('#submit-achievement').click(async function () {
    const fileInput = document.getElementById('achievement-file');
    const titleInput = document.getElementById('achievement-title');
    const response = await fetch('/api/session'); 
    const data = await response.json();
    const studentId = data.userId;

    if (!studentId) {
        alert("Student ID is not set. Please log in again.");
        return;
    }

   
    if (!fileInput.files.length || titleInput.value.trim() === "") {
        alert("Please enter a title and select a file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("student_id", studentId);
    formData.append("title", titleInput.value.trim());

    try {
        const response = await fetch('/uploadAchievement', {
            method: 'POST',
            body: formData
        });

        const textResponse = await response.text();
        console.log("Raw Response:", textResponse);

        try {
            const result = JSON.parse(textResponse);

            if (result.success) {
                alert("Achievement uploaded successfully!");
                $('#achievement-modal').fadeOut();
                loadAchievements(studentId);
            } else {
                alert("Upload failed: " + result.message);
            }
        } catch (jsonError) {
            console.error("JSON Parse Error:", jsonError);
            alert("Unexpected response from server.");
        }

    } catch (error) {
        console.error("Error uploading achievement:", error);
        alert("An error occurred while uploading.");
    }
});



