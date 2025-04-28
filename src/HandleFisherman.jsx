import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import profileIcon from './profile.png';

const HandleFisherman = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const boatOwners = ['Pabaya', 'Buruwa', 'Gemba', 'Haraka', 'Pina'];

  const filteredOwners = boatOwners.filter(owner =>
    owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOwnerClick = (Fisherman) => {
    navigate("/FishermanDetails", { state: { Fisherman } });
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
          borderRadius: '40px',
          height: 'calc(100vh - 80px)',
          width: '100%',
          maxWidth: '1000px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(5px)',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 py-3 mb-3 border-bottom">
          <img
            src={logoImage}
            alt="Logo"
            style={{ width: '55px', height: '55px', cursor: 'pointer', borderRadius: '50%' }}
            onClick={() => navigate("/Dashboard")}
          />
          <div className="flex-grow-1 text-center">
            <h2 className="m-0 fw-bold">Fishermans</h2>
          </div>
          <img
            src={profileIcon}
            alt="Profile"
            style={{ width: '55px', height: '55px', borderRadius: '50%' }}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4 w-50 position-relative">
          <input
            type="text"
            className="form-control rounded-pill ps-5 pe-4"
            placeholder="Search Boat Owners"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              height: '50px',
              fontSize: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid #ccc',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.1)',
            }}
          />
          <i
            className="bi bi-search position-absolute"
            style={{
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              fontSize: '1.3rem',
              color: '#6c757d',
              pointerEvents: 'none',
            }}
          ></i>
        </div>

        <div className="w-75">
          {filteredOwners.map((Fisherman, index) => (
            <div
              key={index}
              className="bg-light rounded-pill shadow-sm p-3 mb-3 fw-bold text-center"
              style={{
                fontSize: '1.2rem',
                cursor: 'pointer',
                transition: '0.3s',
              }}
              onClick={() => handleOwnerClick(Fisherman)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            >
              {Fisherman}
            </div>
          ))}
        </div>

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

export default HandleFisherman;
