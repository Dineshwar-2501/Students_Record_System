function validateStudentForm(event) {
    event.preventDefault(); // Prevent the form from submitting
  
    // ✅ Get input values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const batch = document.getElementById("batch").value.trim();
    const department = document.getElementById("department").value.trim().toUpperCase();
    const year_of_study = document.getElementById("year_of_study").value.trim(); // 🔥 Using 'year_of_study' in DB
    const regid = document.getElementById("regid").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim(); // 🔥 NEW FIELD
    const parentPhoneNumber = document.getElementById("parentPhoneNumber").value.trim(); // 🔥 NEW FIELD
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmpassword").value.trim();
  
    // ✅ Name Validation (Only Letters & Spaces)
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(name)) {
        alert("Name should only contain letters and spaces!");
        return false;
    }
  
    // ✅ Register Number Validation (Only Numbers)
    const regidRegex = /^[0-9]+$/;
    if (!regidRegex.test(regid)) {
        alert("Register No. should only contain numbers!");
        return false;
    }
  
    // ✅ Email Domain Validation (Must be College Email)
    const emailRegex = /^[A-Za-z0-9._%+-]+@jerusalemengg\.ac\.in$/;
    if (!emailRegex.test(email)) {
        alert("Please use a valid college email (e.g., someone@jerusalemengg.ac.in)");
        return false;
    }
  
    // ✅ Phone Number Validation (Exactly 10 Digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert("Phone number must be exactly 10 digits!");
        return false;
    }
    if (!phoneRegex.test(parentPhoneNumber)) {
        alert("Parent's phone number must be exactly 10 digits!");
        return false;
    }
  
    // ✅ Year of Study Validation (Ensure it's a number between 1-4)
    const validYears = ["1", "2", "3", "4"];
    if (!validYears.includes(year_of_study)) {
        alert("Please select a valid Year of Study (1st - 4th Year).");
        return false;
    }
  
    // ✅ Password Match Validation
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return false;
    }
  
    // ✅ Check for missing values
    if (!name || !email || !department || !batch || !year_of_study || !regid || !password || !phoneNumber || !parentPhoneNumber) {
        alert('All fields are required!');
        return false;
    }
  
    // ✅ Log form values (For Debugging)
    console.log("🔥 Form Data:", {
        name, email, department, batch, year_of_study, regid, phoneNumber, parentPhoneNumber, password
    });
  
    // ✅ Create FormData object
    const formData = {
        name: name,
        email: email,
        batch: batch,
        year_of_study: parseInt(year_of_study), // 🔥 Convert to number
        department: department,
        regid: regid,
        phone_number: phoneNumber, // 🔥 Added Phone Number
        parent_phone_number: parentPhoneNumber, // 🔥 Added Parent Phone Number
        password: password
    };
  
    // ✅ Submit via Fetch API
    fetch('/registerStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            if (data.message.includes("success")) {
                document.getElementById("registrationForm").reset();
                window.location.href = "/login"; // Redirect to login after success
            }
        }
    })
    .catch(error => {
        console.error("❌ Registration Error:", error);
        alert("Error: " + error.message);
    });
  }
  