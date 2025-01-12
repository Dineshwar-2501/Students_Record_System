// Redirect to Proctor registration page
document.getElementById('proctorButton').addEventListener('click', function() {
    window.location.href = '/registerProctor';
});

// Redirect to Student registration page
document.getElementById('studentButton').addEventListener('click', function() {
    window.location.href = '/registerStudent';
});

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe'); // Ensure this checkbox exists
const selectedRoleInput = document.querySelector('input[name="role"]:checked'); // Ensure 'role' input exists

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const email = emailInput.value;
    const password = passwordInput.value;
    const role = selectedRoleInput ? selectedRoleInput.value : ''; // Get the selected role if available

    // Fetch request for login
    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,          // shorthand for email: email
                pswd: password, // shorthand for password: password
                role,
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
