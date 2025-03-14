document.addEventListener('DOMContentLoaded', () => {
    const proctorButton = document.getElementById('proctorButton');
    const studentButton = document.getElementById('studentButton');
    const adminButton = document.getElementById('adminButton');
    const selectedRoleInput = document.getElementById('selectedRole');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const emailInput = document.getElementById('email');

    // Set initial state
    studentButton.classList.add('deselected'); // Make the student button dim by default

    // Load saved email and remember me status
    const savedEmail = localStorage.getItem('rememberedEmail');
    const rememberMeChecked = localStorage.getItem('rememberMeChecked');
    if (savedEmail && rememberMeChecked === 'true') {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }

    // Role selection toggle
    proctorButton.addEventListener('click', () => {
        proctorButton.classList.add('selected');
        proctorButton.classList.remove('deselected'); // Remove dim class
        studentButton.classList.remove('selected');
        studentButton.classList.add('deselected'); 
        adminButton.classList.remove('selected');
        adminButton.classList.add('deselected');// Add dim class
        selectedRoleInput.value = 'proctor'; // Set the selected role
    });

    studentButton.addEventListener('click', () => {
        studentButton.classList.add('selected');
        studentButton.classList.remove('deselected'); // Remove dim class
        proctorButton.classList.remove('selected');
        proctorButton.classList.add('deselected'); 
        adminButton.classList.remove('selected');
        adminButton.classList.add('deselected');// Add dim class
        selectedRoleInput.value = 'student'; // Set the selected role
    });

    adminButton.addEventListener('click', () => {
        adminButton.classList.add('selected');
        adminButton.classList.remove('deselected'); // Remove dim class
        proctorButton.classList.remove('selected');
        proctorButton.classList.add('deselected'); 
        studentButton.classList.remove('selected');
        studentButton.classList.add('deselected');// Add dim class
        selectedRoleInput.value = 'admin'; // Set the selected role
    });

    // Password visibility toggle
    togglePassword.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.textContent = '🙈'; // Change icon to closed-eye
        } else {
            passwordInput.type = 'password';
            togglePassword.textContent = '👁️'; // Change icon to open-eye
        }
    });

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const email = emailInput.value;
        const password = passwordInput.value;

        // Store email if "Remember Me" is checked
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberMeChecked', 'true');
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberMeChecked');
        }

        // Fetch request for login
        try {
            // const response = await fetch('http://localhost:5000/login', {
            const response = await fetch('https://studentsrecordsystem-production.up.railway.app/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,          // shorthand for email: email
                    pswd: password, // shorthand for password: password
                    role: selectedRoleInput.value,
                    rememberMe: rememberMeCheckbox.checked,
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Redirect to the dashboard page based on role
                window.location.href = data.redirectUrl;
            } else {
                alert(data.message); // Display error message if login fails
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred during login. Please try again.");
        }
    });
});
