import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

// Firebase setup (NO separate import needed)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Firebase Configuration — replace with your own project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};


// Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ManageOfficer = () => {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const officersCollection = collection(db, "officers");
        const officerSnapshot = await getDocs(officersCollection);
        const officerList = officerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOfficers(officerList);
      } catch (error) {
        console.error("Error fetching officers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  const handleRemove = (id) => {
    if (window.confirm("Are you sure you want to remove this officer?")) {
      // To remove from Firestore, use deleteDoc() if needed
      setOfficers(prev => prev.filter(officer => officer.id !== id));
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
          className="bg-light bg-opacity-85 p-4 p-md-5 rounded-4 shadow-lg" 
          style={{ backdropFilter: "blur(10px)" }}
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
              <h2 className="fw-bold mb-0">Manage Officers</h2>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted text-center">Loading officers...</p>
          ) : officers.length === 0 ? (
            <p className="text-muted text-center">No officers found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Position</th>
                    <th>NIC</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map(officer => (
                    <tr key={officer.id}>
                      <td>{officer.name}</td>
                      <td>{officer.email}</td>
                      <td>{officer.phone}</td>
                      <td>{officer.position}</td>
                      <td>{officer.nic}</td>
                      <td>{officer.address}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger rounded-pill"
                          onClick={() => handleRemove(officer.id)}
                        >
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

export default ManageOfficer;
