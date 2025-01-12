document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const role = document.getElementById('role').value;

  try {
      const response = await fetch('/forgotpassword', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
          const data = await response.json(); // Parse JSON response
          alert(data.message); // Show alert with the success message
          window.location.href = '/resetpassword'; // Redirect to reset password page
      } else {
          const errorMessage = await response.text(); // Get error message
          alert(`Error: ${errorMessage}`); // Show alert with error message
      }
  } catch (error) {
      alert('Error: ' + error.message); // Handle any unexpected errors
  }
});