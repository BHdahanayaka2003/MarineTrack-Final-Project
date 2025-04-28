import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import profileIcon from './profile.png';

const HandleFishermanID = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    nic: '',
    telephone: '',
    familyDetails: '',
    contactNumbers: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const { name, age, nic, telephone, familyDetails, contactNumbers } = formData;
    if (name && age && nic && telephone && familyDetails && contactNumbers) {
      // Submit the form or navigate
      navigate('/OwnerDetails', { state: { fishermanData: formData } });
    } else {
      alert('Please fill in all the fields!');
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center p-0 m-0"
      style={{
        height: '110vh',
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
          maxWidth: '700px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(5px)',
          padding: '30px',
        }}
      >
        <div className="d-flex justify-content-between align-items-center w-100 mb-4">
          <img
            src={logoImage}
            alt="Logo"
            style={{ width: '55px', height: '55px', borderRadius: '50%', cursor: 'pointer' }}
            onClick={() => navigate("/Dashboard")}
          />
          <div className="flex-grow-1 text-center">
            <h2 className="m-0 fw-bold">Register Fisherman</h2>
          </div>
          <img
            src={profileIcon}
            alt="Profile"
            style={{ width: '55px', height: '55px', borderRadius: '50%' }}
          />
        </div>

        <div className="w-100">
            <input
                type="text"
                name="name"
                className="form-control rounded-pill shadow-sm ps-4 pe-4 mb-3"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
            />
            <input
                type="number"
                name="age"
                className="form-control rounded-pill shadow-sm ps-4 pe-4 mb-3"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
            />
            <input
                type="text"
                name="nic"
                className="form-control rounded-pill shadow-sm ps-4 pe-4 mb-3"
                placeholder="NIC Number"
                value={formData.nic}
                onChange={handleChange}
            />
            <input
                type="tel"
                name="telephone"
                className="form-control rounded-pill shadow-sm ps-4 pe-4 mb-3"
                placeholder="Telephone Number"
                value={formData.telephone}
                onChange={handleChange}
            />
            <textarea
                name="familyDetails"
                className="form-control rounded shadow-sm mb-3"
                placeholder="Family Details"
                rows="3"
                value={formData.familyDetails}
                onChange={handleChange}
                style={{ borderRadius: '20px', padding: '15px' }}
            />
            <textarea
                name="contactNumbers"
                className="form-control rounded shadow-sm mb-4"
                placeholder="Additional Contact Numbers"
                rows="2"
                value={formData.contactNumbers}
                onChange={handleChange}
                style={{ borderRadius: '20px', padding: '15px' }}
            />
            <textarea
                name="FishermanID"
                className="form-control rounded shadow-sm mb-4"
                placeholder="Fisherman ID"
                rows="1"
                value={formData.contactNumbers}
                onChange={handleChange}
                style={{ borderRadius: '20px', padding: '15px' }}
            />

            <div className="d-flex justify-content-center">
                <button
                    className="btn btn-primary rounded-pill w-50 shadow-sm"
                    style={{ padding: '12px', fontSize: '1.1rem' }}
                    onClick={handleSubmit}
                >
                    Submit Details
                </button>
            </div>
        </div>

        <div className="mt-4 pt-3 border-top text-center w-100">
          <p className="text-muted small mb-0">
            Fisheries Management System • v2.1.0 • © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandleFishermanID;
