// src/pages/RegisterStudent.jsx
import { useState } from "react";

function RegisterStudent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    batch: "",
    department: "",
    year_of_study: "",
    regid: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch("/registerStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Student registered successfully!");
        window.location.href = "/login";
      } else {
        const errorMsg = await response.text();
        alert("Error: " + errorMsg);
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h1>Student Registration</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="College Mail" required />
        <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="Batch" required />
        <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" required />
        <select name="year_of_study" value={formData.year_of_study} onChange={handleChange} required>
          <option value="">Year of Study</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        <input type="text" name="regid" value={formData.regid} onChange={handleChange} placeholder="Register No." required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required />
        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />
        <button type="submit">Register</button>
      </form>
      <p>Already Registered? <a href="/login">Login here</a></p>
    </div>
  );
}

export default RegisterStudent;