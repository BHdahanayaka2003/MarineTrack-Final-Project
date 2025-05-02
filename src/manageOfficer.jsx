import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import { db } from "./Backend/Firebase";  // Import Firebase db
import { collection, getDocs } from "firebase/firestore";  // Firestore functions

const ManageOfficer = () => {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Fetch officer data from Firestore
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const officersCollection = collection(db, "officers");  // Firestore collection
        const officerSnapshot = await getDocs(officersCollection);
        const officerList = officerSnapshot.docs.map(doc => ({
          id: doc.id,  // Firestore document ID
          ...doc.data(),  // Spread document data
        }));
        setOfficers(officerList);
      } catch (error) {
        console.error("Error fetching officers:", error);
      } finally {
        setIsLoading(false);  // Set loading state to false after fetching
      }
    };

    fetchOfficers();
  }, []);

  const handleRemove = (id) => {
    if (window.confirm("Are you sure you want to remove this officer?")) {
      // Remove officer from Firestore here (optional for now)
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
            <p className="text-muted text-center">Loading officers...</p>  // Loading message
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
