// Function to check if the student has already selected a proctor
function checkProctorSelection() {
  fetch('/api/check-proctor')
      .then(response => response.json())
      .then(data => {
          console.log("Proctor Check Response:", data); // Debugging line
          if (!data.hasProctor) {
              document.getElementById('proctor-selection-modal').style.display = 'block';
              loadProctorList(); // Load the proctor list into the modal
          } else {
              console.log("Proctor already selected.");
          }
      })
      .catch(error => console.error('Error checking proctor selection:', error));
}

// Function to load the list of available proctors
function loadProctorList() {
  fetch('/api/proctors')
      .then(response => response.json())
      .then(proctors => {
          console.log(proctors); // Debugging line
          const proctorList = document.getElementById('proctor-list');
          if (proctors.length === 0) {
              proctorList.innerHTML = "<p>No proctors available.</p>";
              return;
          }
          proctors.forEach(proctor => {
              const label = document.createElement('label');
              label.innerHTML = `
                  <input type="radio" name="proctor" value="${proctor.proctor_id}">
                  ${proctor.name} - ${proctor.designation}
              `;
              proctorList.appendChild(label);
          });
      })
      .catch(error => console.error('Error fetching proctor list:', error));
}

// Function to load and display student and proctor names, and handle proctor selection modal
function loadDashboardInfo() {
  fetch('/api/student-dashboard-info')
      .then(response => response.json())
      .then(data => {
          if (data.studentName && data.proctorName) {
              document.getElementById('dashboard-info').innerHTML = 
                  `<p>Welcome, ${data.studentName}!</p>
                   <p>Your Proctor: ${data.proctorName}</p>`;
          } else {
              document.getElementById('dashboard-info').innerHTML = 
                  `<p>Welcome, Student!</p>
                   <p>No proctor assigned yet.</p>`;
              
              // Show the modal only if no proctor is assigned
              document.getElementById('proctor-selection-modal').style.display = 'block';
          }
      })
      .catch(error => console.error('Error fetching dashboard info:', error));
}

// Handle form submission for selecting a proctor
document.getElementById('proctor-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const selectedProctor = document.querySelector('input[name="proctor"]:checked');
  if (selectedProctor) {
      fetch('/api/select-proctor', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ proctorId: selectedProctor.value })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Close the modal and refresh the dashboard to show selected proctor
              document.getElementById('proctor-selection-modal').style.display = 'none';
              loadDashboardInfo();  // Reload info to show the selected proctor
          } else {
              if (data.message === 'Proctor already assigned.') {
                  alert("You already have a proctor assigned.");
              } else {
                  console.error('Failed to assign proctor:', data.message);
              }
          }
      })
      .catch(error => console.error('Error submitting proctor selection:', error));
  } else {
      alert("Please select a proctor.");
  }
});

document.addEventListener("DOMContentLoaded", checkProctorSelection);
document.addEventListener("DOMContentLoaded", loadDashboardInfo);
  