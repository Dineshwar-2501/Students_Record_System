function validateProctorForm(event) {
    event.preventDefault(); // Prevent the form from submitting
  
    const name = document.getElementById("proctorName").value.trim();
    const email = document.getElementById("proctorEmail").value.trim();
    const designation = document.getElementById("proctorDesignation").value.trim();
    const phoneNumber = document.getElementById("proctorPhone").value.trim(); // 🔥 NEW FIELD
    const password = document.getElementById("proctorPassword").value.trim();
    const confirmPassword = document.getElementById("proctorConfirmPassword").value.trim();
    const department = document.getElementById("proctorDepartment").value.trim();
    // ✅ Name Validation (Only Letters & Spaces)
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(name)) {
        alert("Name should only contain letters and spaces!");
        return false;
    }
  
  
  
    // ✅ Phone Number Validation (Exactly 10 Digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert("Phone number must be exactly 10 digits!");
        return false;
    }
  
    // ✅ Password Match Validation
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return false;
    }
  
    // ✅ If all validations pass, submit the form via Fetch API
    const formData = {
        name: name,
        email: email,
        designation: designation,
        department: department,
        phone_number: phoneNumber, // 🔥 Added Phone Number
        password: password
    };
  
    console.log("🔥 Sending Proctor Registration Data:", formData); // Debugging log
  
    fetch('/registerProctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            if (data.message.includes("success")) {
                document.getElementById("proctorRegistrationForm").reset();
                window.location.href = "/login"; // Redirect to login after success
            }
        }
    })
    .catch(error => {
        console.error("❌ Registration Error:", error);
        alert("Error: " + error.message);
    });
  }
  