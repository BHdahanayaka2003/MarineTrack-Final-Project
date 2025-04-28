import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import profileIcon from './profile.png';

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    boatName: '',
    idNumber: '',
    boatId: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ 
      ...formData,
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New Boat Owner Registered:', formData);
    // TODO: send formData to backend if needed
    navigate('/HandleFisherman');
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center p-0 m-0"
      style={{
        height: '120vh',
        width: '100vw',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          margin: '40px',
          borderRadius: '40px',
          height: 'calc(105vh)',
          width: '100%',
          maxWidth: '800px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(5px)',
          padding: '30px',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center w-100 mb-4">
          <img
            src={logoImage}
            alt="Logo"
            style={{ width: '55px', height: '55px', borderRadius: '50%', cursor: 'pointer' }}
            onClick={() => navigate("/Dashboard")}
          />
          <div className="flex-grow-1 text-center">
            <h2 className="m-0 fw-bold">Add New Boat Owner</h2>
          </div>
          <img
            src={profileIcon}
            alt="Profile"
            style={{ width: '55px', height: '55px', borderRadius: '50%' }}
          />
        </div>

        {/* Form */}
        <form className="w-100" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Owner Name</label>
            <input
              type="text"
              className="form-control rounded-pill"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter owner's name"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Boat Name</label>
            <input
              type="text"
              className="form-control rounded-pill"
              name="boatName"
              value={formData.boatName}
              onChange={handleChange}
              placeholder="Enter boat name"
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">ID Number</label>
              <input
                type="text"
                className="form-control rounded-pill"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="Enter ID number"
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Boat ID</label>
              <input
                type="text"
                className="form-control rounded-pill"
                name="boatId"
                value={formData.boatId}
                onChange={handleChange}
                placeholder="Enter boat ID"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Phone Number</label>
              <input
                type="tel"
                className="form-control rounded-pill"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                className="form-control rounded-pill"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Address</label>
            <input
              type="text"
              className="form-control rounded-pill"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              required
            />
          </div>

          {/* New Username and Password fields */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Username</label>
              <input
                type="text"
                className="form-control rounded-pill"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Create a username"
                required
              />
            </div>

            <div className="col-md-6 mb-4">
              <label className="form-label fw-bold">Password</label>
              <input
                type="password"
                className="form-control rounded-pill"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
          </div>

        
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary fw-bold">
                      Submit
                    </button>
                  </div>
                </form>

                {/* Footer */}
        <div className="mt-4 pt-3 border-top text-center w-100">
          <p className="text-muted mb-2 small">
            Fisheries Management System • v2.1.0 • © 2025
          </p>
        </div>

      </div>
    </div>
  );
};

export default OwnerRegister;
