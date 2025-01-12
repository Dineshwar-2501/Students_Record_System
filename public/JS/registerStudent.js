function validateStudentForm(event) {
  event.preventDefault(); // Prevent the form from submitting

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const batch = document.getElementById("batch").value;
  const department = document.getElementById("department").value.toUpperCase();

  const year_of_study = document.getElementById("year_of_study").value; // Using 'year_of_study' in the DB
  const regid = document.getElementById("regid").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmpassword").value;

  // Validation for Name (Only Letters)
  const nameRegex = /^[A-Za-z]+$/;
  if (!nameRegex.test(name)) {
      alert("Name should only contain letters!");
      return false;
  }

  // Validation for Register Number (Only Numbers)
  const regidRegex = /^[0-9]+$/;
  if (!regidRegex.test(regid)) {
      alert("Register No. should only contain numbers!");
      return false;
  }
  // Validation for Email Domain
  const emailRegex = /^[A-Za-z0-9._%+-]+@jerusalemengg\.ac\.in$/;
  if (!emailRegex.test(email)) {
      alert("Please use a valid college email (e.g., someone@jerusalemengg.ac.in)");
      return false;
  }
  // Validation for Password Match
  if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return false;
  }
   // Log the values
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Department:", department);
  console.log("Batch:", batch);
  console.log("Year of Study:", year_of_study);
  console.log("Register ID:", regid);
  console.log("Password:", password);
  console.log("Confirm Password:", confirmPassword);

      // Check for missing values
  if (!name.trim() || !email.trim() || !department.trim() || !batch.trim() || !year_of_study.trim() || !regid.trim() || !password.trim()) {
      alert('All fields are required!');
      return;
  }
  // Create FormData object
  const formData = {
      name: name,
      email: email,
      batch: batch,
      year_of_study: year_of_study, // Change here to match DB
      department: department,

      regid: regid,
      password: password
  };
  console.log("Form Data:", formData);
  // Submit via Fetch API
  fetch('/registerStudent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
  })
  .then(response => {
      if (response.ok) {
          alert('Student registered successfully!');
          document.getElementById("registrationForm").reset();
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