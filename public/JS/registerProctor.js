function validateProctorForm(event) {
  event.preventDefault(); // Prevent the form from submitting

  const name = document.getElementById("proctorName").value;
  const email = document.getElementById("proctorEmail").value;
  const designation = document.getElementById("proctorDesignation").value;
  const staffId = document.getElementById("staffId").value;
  const password = document.getElementById("proctorPassword").value;
  const confirmPassword = document.getElementById("proctorConfirmPassword").value;

  // Validation for Name (Only Letters)
  const nameRegex = /^[A-Za-z]+$/;
  if (!nameRegex.test(name)) {
      alert("Name should only contain letters!");
      return false;
  }

  // Validation for Staff ID (Exactly 4 digits)
  const staffIdRegex = /^[0-9]{4}$/;
  if (!staffIdRegex.test(staffId)) {
      alert("Staff ID must be exactly 4 digits!");
      return false;
  }

  // Validation for Password Match
  if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return false;
  }

  // If all validations pass, submit the form via Fetch API
  const formData = {
      name: name,
      email: email,
      designation: designation,
      staffId: staffId,
      password: password
  };

  fetch('/registerProctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
  })
  .then(response => {
      if (response.ok) {
          alert('Proctor registered successfully!');
          document.getElementById("proctorRegistrationForm").reset();
          window.location.href = "/login"; // Redirect to login after success
      } else {
          return response.text().then(text => {
              alert(`Error: ${text}`);
          });
      }
  })
  .catch(error => {
      alert('Error: ' + error.message);
  });
}
console.log(req.session); 