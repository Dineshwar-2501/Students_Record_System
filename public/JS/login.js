document.addEventListener("DOMContentLoaded", () => {
    const proctorButton = document.getElementById("proctorButton");
    const studentButton = document.getElementById("studentButton");
    const adminButton = document.getElementById("adminButton");
    const selectedRoleInput = document.getElementById("selectedRole");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    const emailInput = document.getElementById("email");
    const loginForm = document.getElementById("loginForm");

    // ✅ Default role: Admin
    selectedRoleInput.value = "admin";
    adminButton.classList.add("selected");
    studentButton.classList.add("deselected");
    proctorButton.classList.add("deselected");

    // ✅ Remember Me: Load saved email
    if (emailInput && rememberMeCheckbox) {
        if (localStorage.getItem("rememberMe") === "true") {
            emailInput.value = localStorage.getItem("rememberedEmail") || "";
            rememberMeCheckbox.checked = true;
        }
    }

    // ✅ Role selection function
    function selectRole(role, selectedButton) {
        selectedRoleInput.value = role;

        [adminButton, proctorButton, studentButton].forEach((btn) => {
            btn.classList.toggle("selected", btn === selectedButton);
            btn.classList.toggle("deselected", btn !== selectedButton);
        });
    }

    adminButton.addEventListener("click", () => selectRole("admin", adminButton));
    proctorButton.addEventListener("click", () => selectRole("proctor", proctorButton));
    studentButton.addEventListener("click", () => selectRole("student", studentButton));

    // ✅ Password visibility toggle
    togglePassword.addEventListener("click", () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
        togglePassword.textContent = passwordInput.type === "password" ? "👁️" : "🙈";
    });

    // ✅ Handle login form submission
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const role = selectedRoleInput.value.trim();
        const rememberMe = rememberMeCheckbox.checked;

        if (!email || !password || !role) {
            alert("⚠️ All fields are required!");
            return;
        }

        try {
            const response = await fetch('/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role, rememberMe }),
                credentials: "include"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Login Successful:", data);

            // ✅ Store "Remember Me" preference
            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
                localStorage.setItem("rememberedEmail", email);
            } else {
                localStorage.removeItem("rememberMe");
                localStorage.removeItem("rememberedEmail");
            }

            // ✅ Store session in IndexedDB (ONLY if login is successful)
            await saveSessionToDB({
                email,
                role,
                userId: data.userId,
                department: data.department || 'N/A',
                redirectUrl: data.redirectUrl
            });

            // ✅ Redirect user to dashboard
            const redirectURL = data.redirectUrl || {
                student: "/studentDashboard",
                proctor: "/proctorDashboard",
                admin: "/adminDashboard",
            }[role];

            if (!redirectURL) throw new Error("No redirect URL provided");
            window.location.href = redirectURL;

        } catch (error) {
            console.error("❌ Login failed:", error);
            alert(error.message || "Login failed. Please check your credentials.");
        }
    });

    // ✅ Function to store session safely
    async function saveSessionToDB(sessionData) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("UserSessionDB", 1);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const tx = db.transaction("sessions", "readwrite");
                const store = tx.objectStore("sessions");

                const saveRequest = store.put({ id: "userSession", ...sessionData });

                saveRequest.onsuccess = () => {
                    console.log("✅ Session saved in IndexedDB");
                    resolve();
                };
                saveRequest.onerror = (err) => {
                    console.error("❌ Error saving session:", err);
                    reject(err);
                };
            };
            request.onerror = (err) => {
                console.error("❌ IndexedDB error:", err);
                reject(err);
            };
        });
    }
});
