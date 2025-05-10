import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import profileIcon from './profile.png';
import { initializeApp, getApps } from "firebase/app";



const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Replace with your actual API key
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const RejectBoat = () => {
  const [boats, setBoats] = useState([]);
  const [boatName, setBoatName] = useState('');
  const [boatID, setBoatID] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  const handleAddBoat = () => {
    if (boatName && boatID && ownerName && reason) {
      const newBoat = {
        boatName,
        boatID,
        ownerName,
        reason,
      };
      setBoats([...boats, newBoat]);
      setBoatName('');
      setBoatID('');
      setOwnerName('');
      setReason('');
    } else {
      alert('Please fill in all fields!');
    }
  };

  const filteredBoats = boats.filter((boat) =>
    boat.boatName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center p-0 m-0"
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
          maxWidth: '700px',
          overflowY: 'auto',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(6px)',
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
            <h2 className="m-0 fw-bold">Rejected Boats</h2>
          </div>
          <img
            src={profileIcon}
            alt="Profile"
            style={{ width: '55px', height: '55px', borderRadius: '50%' }}
          />
        </div>

            <div className="w-100 mb-4">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Boat Name"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Boat ID"
                  value={boatID}
                  onChange={(e) => setBoatID(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Owner Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control rounded"
                  rows="2"
                  placeholder="Reason for Rejection"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>
              <div className="d-flex justify-content-center">
                <button className="btn btn-danger rounded-pill w-50 fw-bold" onClick={handleAddBoat}>
                  Add Rejected Boat
                </button>
              </div>
            </div>

        <div className="w-100 mb-4">
          <input
            type="text"
            className="form-control rounded-pill shadow-sm ps-5"
            placeholder="Search boats"
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
        </div>

        <div className="w-100">
          {filteredBoats.length > 0 ? (
            filteredBoats.map((boat, index) => (
              <div
                key={index}
                className="bg-light rounded shadow-sm p-3 mb-3 text-start"
              >
                <div className="fw-bold">{boat.boatName} (ID: {boat.boatID})</div>
                <div>Owner: {boat.ownerName}</div>
                <div className="text-danger">Reason: {boat.reason}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted">No boats found.</div>
          )}
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

export default RejectBoat;
