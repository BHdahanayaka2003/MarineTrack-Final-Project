import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg'; 
import logoImage from './logo.png'; 
import profileIcon from './profile.png'; 

const BoatOwnerDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const boatOwners = ['Pabaya', 'Buruwa', 'Gemba', 'Haraka', 'Pina'];

  const filteredOwners = boatOwners.filter(owner =>
    owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOwnerClick = (owner) => {
    navigate("/OwnerDetails", { state: { owner } });
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        height: '100vh',
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
          borderRadius: '50px',
          height: 'calc(100vh - 80px)',
          overflow: 'auto',
        }}
      >
        <div className="d-flex justify-content-between align-items-center w-100 px-5 pt-4 mb-4">
          <img
            src={logoImage}
            alt="Logo"
            style={{ width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer' }}
            onClick={() => navigate("/Dashboard")}
          />

          <div className="flex-grow-1 text-center">
            <div
              className=" px-5 py-2 fw-bold  mx-5"
              style={{ fontSize: '1.5rem' }}
            >
              Boat Owners
            </div>
          </div>

          <img
            src={profileIcon}
            alt="Profile"
            style={{ width: '60px', height: '60px', borderRadius: '50%' }}
          />
        </div>

        {/* Updated Search Bar */}
        <div className="mb-4 w-50 position-relative">
          <input
            type="text"
            className="form-control rounded-pill shadow-sm ps-5 pe-4"
            placeholder="Search Boat Owners"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingTop: '10px',
              paddingBottom: '10px',
              fontSize: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #ccc',
            }}
          />
          <i
            className="bi bi-search position-absolute"
            style={{
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              fontSize: '1.3rem',
              color: 'ashblack',
              pointerEvents: 'none',
            }}
          ></i>
        </div>

        {/* Owner List */}
        <div className="w-75">
        {filteredOwners.map((owner, index) => (
          <div
            key={index}
            className="bg-light rounded-pill shadow-sm p-3 mb-3 fw-bold text-center"
            style={{ fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={() => handleOwnerClick(owner)}
          >
            {owner}
          </div>
        ))}
        {/* Footer */}
        <div className="mt-4 pt-3 border-top text-center">
          <p className="text-muted mb-0 small">
            Fisheries Management System • v2.1.0 • © 2025
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BoatOwnerDetails;
