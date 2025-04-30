import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

const RequestPanel = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchBoatData = async () => {
      try {
        const boatCollection = collection(db, "boat");
        const boatSnapshot = await getDocs(boatCollection);
        
        const boatList = boatSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.name || "Unknown",
            boatName: data.boatName || "Unnamed boat",
            contact: data.contact || "No contact",
            status: "Pending", // Default status
            requestDate: new Date().toLocaleDateString()
          };
        });
        
        setRequests(boatList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching boat data:", err);
        setError("Failed to load request data. Please try again later.");
        setLoading(false);
      }
    };

    fetchBoatData();
  }, []);

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
  };

  const handleApprove = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? {...req, status: 'Approved'} : req
    ));
    setSelectedRequest(null);
  };

  const handleReject = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? {...req, status: 'Rejected'} : req
    ));
    setSelectedRequest(null);
  };

  const handleBack = () => {
    navigate("/Dashboard");
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-warning';
    }
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      <div
        className="w-100 mx-3 rounded-5"
        style={{
          maxWidth: "1000px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <img
            src={logoImage}
            alt="Logo"
            width="60"
            height="60"
            className="rounded-circle"
            style={{ cursor: "pointer" }}
            onClick={handleBack}
          />
          <h2 className="text-center flex-grow-1 fw-bold m-0">Boat Registration Requests</h2>
          <img
            src={profileImage}
            alt="Profile"
            width="60"
            height="60"
            className="rounded-circle"
          />
        </div>

        {selectedRequest ? (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Request Details</h5>
              <button 
                className="btn-close" 
                onClick={() => setSelectedRequest(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <p className="mb-1"><strong>Owner:</strong> {selectedRequest.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedRequest.email}</p>
                  <p className="mb-1"><strong>Contact:</strong> {selectedRequest.contact}</p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1"><strong>Boat Name:</strong> {selectedRequest.boatName}</p>
                  <p className="mb-1"><strong>Request ID:</strong> {selectedRequest.id}</p>
                  <p className="mb-1">
                    <strong>Status:</strong> 
                    <span className={`badge ms-2 ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button 
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  Reject
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">Owner</th>
                <th scope="col">Email</th>
                <th scope="col">Boat Name</th>
                <th scope="col">Request Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.name}</td>
                    <td>{request.email}</td>
                    <td>{request.boatName}</td>
                    <td>{request.requestDate}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleRequestClick(request)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No registration requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-top text-center">
          <p className="text-muted mb-0 small">
            Fisheries Management System • v2.1.0 • © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;