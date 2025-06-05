import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const OfficerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, position, password } = formData;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const officerData = {
        name,
        email,
        phone,
        position,
        createdAt: new Date(),
        uid: user.uid,
      };

      await addDoc(collection(db, "officers"), officerData);

      alert("Officer registered successfully!");
      navigate("/admindashboard");

    } catch (error) {
      console.error("Error registering officer: ", error.message);
      alert("Error registering officer. Please try again.");
    }
  };

  return (
    <div
      className="min-vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        paddingTop: "2rem",
        paddingBottom: "2rem"
      }}
    >
      <div className="container">
        <div 
          className="p-4 p-md-5 rounded-4 shadow-lg" 
          style={{ 
            backdropFilter: "blur(10px)", 
            backgroundColor: "rgba(255, 255, 255, 0.85)" 
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <img 
                src={logoImage} 
                alt="Logo" 
                width="60" 
                height="60" 
                className="me-3"
              />
              <h2 className="fw-bold mb-0 text-dark">Officer Registration</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Phone</label>
              <input
                type="tel"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-dark">Position</label>
              <input
                type="text"
                className="form-control"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-dark">Password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 rounded-pill fw-semibold py-2">
              Register Officer
            </button>
          </form>

          <div className="mt-4 text-center">
            <button 
              className="btn btn-link text-decoration-none"
              onClick={() => navigate("/admindashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerRegister;