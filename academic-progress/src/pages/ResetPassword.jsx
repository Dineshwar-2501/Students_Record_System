// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/resetpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, code, newPassword }),
      });
      if (response.ok) {
        alert("Password reset successful!");
        navigate("/login");
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
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your college email" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="proctor">Proctor</option>
          <option value="admin">Admin</option>
        </select>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter the 6-digit code" required />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Create a new password" required />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
