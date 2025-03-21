function validateadminForm(event) {
  event.preventDefault(); // Prevent form submission temporarily

  // Get form values
  const username = document.getElementById("adminName")?.value.trim();
  const email = document.getElementById("adminEmail")?.value.trim();
  const password = document.getElementById("adminPassword")?.value.trim();
  const confirmPassword = document.getElementById("adminConfirmPassword")?.value.trim();
  const department = document.getElementById("adminDepartment")?.value.trim();



  // ✅ Name Validation (Only Letters & Spaces)
  const nameRegex = /^[A-Za-z ]+$/;
  if (!nameRegex.test(username)) {
      alert("Name should only contain letters and spaces!");
      return false;
  }

  // ✅ Email Validation (Basic Format)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
      alert("Please enter a valid email address!");
      return false;
  }

  // ✅ Password Strength Validation (At least 6 chars)
  if (password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return false;
  }

  // ✅ Password Match Validation
  if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return false;
  }

  // ✅ If all validations pass, submit the form via Fetch API
  const formData = {
      username: username,
      email: email,
      department: department,
      password: password
  };

  console.log("🔥 Sending admin Registration Data:", formData); // Debugging log

  fetch('/registerAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          alert(data.message);
          if (data.message.includes("success")) {
              document.getElementById("adminRegistrationForm").reset();
              window.location.href = "/login"; // Redirect to login after success
          }
      }
  })
  .catch(error => {
      console.error("❌ Registration Error:", error);
      alert("Error: " + error.message);
  });
}
