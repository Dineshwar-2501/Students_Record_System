
// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/forgotpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (response.ok) {
        alert("Reset code sent!");
        navigate("/reset-password");
      } else {
        const errorMessage = await response.text();
        alert("Error: " + errorMessage);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="College Mail" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="proctor">Proctor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Send Reset Code</button>
      </form>
    </div>
  );
}

export default ForgotPassword;