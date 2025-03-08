import { useState } from "react";

function RegisterProctor() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    staffId: "",
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
      const response = await fetch("/registerProctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Proctor registered successfully!");
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
      <h1>Proctor Registration</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="College Mail" required />
        <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" required />
        <input type="text" name="staffId" value={formData.staffId} onChange={handleChange} placeholder="Staff ID (4 digits)" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required />
        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />
        <button type="submit">Register</button>
      </form>
      <p>Already Registered? <a href="/login">Login here</a></p>
    </div>
  );
}

export default RegisterProctor;
