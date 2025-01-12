async function loadProctors() {
  const response = await fetch('/proctorList');
  const proctors = await response.json();
  const proctorListDiv = document.getElementById('proctorList');

  proctors.forEach(proctor => {
      const label = document.createElement('label');
      label.innerHTML = `
          <input type="radio" name="proctorId" value="${proctor.id}" required>
          ${proctor.name}
      `;
      proctorListDiv.appendChild(label);
      proctorListDiv.appendChild(document.createElement('br'));
  });
}

document.getElementById('proctorSelectionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const proctorId = formData.get('proctorId');

  const response = await fetch('/assignProctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proctorId })
  });

  const message = await response.text();
  document.getElementById('message').innerText = message;
});

// Load proctors on page load
loadProctors();