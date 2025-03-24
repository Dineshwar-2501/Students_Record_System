function flipToSignup(role) {
  const card = document.querySelector(`.flip-card__inner`);
  
  // Hide all forms
  document.querySelectorAll('.flip-card__proctor, .flip-card__student, .flip-card__admin').forEach((form) => {
    form.style.display = 'none';
  });

  // Show the selected form
  document.querySelector(`.flip-card__${role}`).style.display = 'flex';

  // Apply flip effect
  card.style.transform = 'rotateY(0deg)';
}

function flipBackToLogin() {
  const card = document.querySelector(`.flip-card__inner`);

  // Show the login view and hide others
  document.querySelector('.flip-card__front').style.display = 'flex';
  // document.querySelector('.flip-card__back').style.display = 'none';

  // Hide all registration forms
  document.querySelectorAll('.flip-card__proctor, .flip-card__student, .flip-card__admin').forEach((form) => {
    form.style.display = 'none';
  });

  // Reset flip effect
  card.style.transform = 'rotateY(0deg)';
}
const toggleInput = document.querySelector('.toggle');
const cardInner = document.querySelector('.flip-card__inner');

// Listen for changes on the toggle
toggleInput.addEventListener('change', function() {
  if (this.checked) {
    cardInner.style.transform = 'rotateY(180deg)';
  } else {
    flipBackToLogin();
  }
});

// Handle Login Buttons
function handleLogin(role) {
  document.getElementById('selectedRole').value = role;
  alert(`Logging in as ${role}`);
}

// Event Listeners for role selection
const roleButtons = document.querySelectorAll('#roleSelection button');
roleButtons.forEach(button => {
  button.addEventListener('click', function() {
    handleLogin(button.value);
  });
});

      
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleButton = document.getElementById('togglePassword');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.textContent = 'hide';
  } else {
    passwordInput.type = 'password';
    toggleButton.textContent = 'show';
  }
}
