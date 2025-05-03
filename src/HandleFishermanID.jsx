import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg"; // Assuming these paths are correct
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { FiEye, FiEdit, FiCheckCircle, FiXCircle, FiUser } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const FishermanPanel = () => {
  const navigate = useNavigate();
  const [fishermen, setFishermen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFisherman, setSelectedFisherman] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "fishermenName", direction: "asc" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    const fetchFishermenData = async () => {
      try {
        setLoading(true);
        const fishermenCollection = collection(db, "fishermen");
        const fishermenSnapshot = await getDocs(fishermenCollection);
        
        const fishermenList = fishermenSnapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.fishermenName || "Unknown",
            contact: data.contact || "No contact",
            address: data.address || "N/A",
            nic: data.nic || "N/A",
            fishermenNIC: data.fishermenNIC || "N/A",
            boatId: data.boatId || "N/A",
            status: data.status || "Active", // Default status if not available
            registrationDate: data.registrationDate ? 
              (data.registrationDate instanceof Date ? data.registrationDate.toLocaleDateString() : new Date(data.registrationDate).toLocaleDateString()) 
              : new Date().toLocaleDateString()
          };
        });
        
        setFishermen(fishermenList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching fishermen data:", err);
        setError("Failed to load fishermen data. Please try again later.");
        setLoading(false);
      }
    };

    fetchFishermenData();
  }, []);

  const handleFishermanClick = (fisherman) => {
    setSelectedFisherman(fisherman);
  };

  const initiateApproval = () => {
    setActionType("approve");
    setShowConfirmation(true);
  };

  const initiateRejection = () => {
    setActionType("reject");
    setShowConfirmation(true);
  };

  const confirmAction = async () => {
    if (!selectedFisherman || !actionType) return;

    try {
      const newStatus = actionType === "approve" ? "Active" : "Inactive";
      
      // Update in Firestore
      const fishermanRef = doc(db, "fishermen", selectedFisherman.id);
      await updateDoc(fishermanRef, {
        status: newStatus
      });
      
      // Update local state
      setFishermen(fishermen.map(fish => 
        fish.id === selectedFisherman.id ? {...fish, status: newStatus} : fish
      ));
      
      toast.success(`Fisherman status set to ${newStatus.toLowerCase()} successfully`);
      setSelectedFisherman(prev => ({...prev, status: newStatus}));
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(`Failed to update fisherman status. Please try again.`);
    }
  };

  const cancelAction = () => {
    setShowConfirmation(false);
    setActionType(null);
  };

  const handleBack = () => {
    navigate("/Dashboard");
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Active': return 'bg-success';
      case 'Inactive': return 'bg-danger';
      default: return 'bg-warning';
    }
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedFishermen = () => {
    // Filter by search term
    let filteredFishermen = fishermen.filter(fisherman => {
      const searchFields = [
        fisherman.name,
        fisherman.email,
        fisherman.contact,
        fisherman.nic,
        fisherman.fishermenNIC,
        fisherman.id,
        fisherman.status,
        fisherman.address,
        fisherman.boatId
      ].join(" ").toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
    
    // Filter by status if needed
    if (filterStatus !== "All") {
      filteredFishermen = filteredFishermen.filter(fisherman => 
        fisherman.status === filterStatus
      );
    }
    
    // Sort the filtered list
    const sorted = [...filteredFishermen].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
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
        overflow: "auto",
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-4 shadow" style={{ maxWidth: "400px" }}>
            <h5 className="mb-3">Confirm Action</h5>
            <p>
              Are you sure you want to set the fisherman {selectedFisherman?.name || 'this fisherman'} 
              to {actionType === "approve" ? "active" : "inactive"}?
            </p>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button className="btn btn-outline-secondary" onClick={cancelAction}>
                Cancel
              </button>
              <button 
                className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={confirmAction}
              >
                {actionType === "approve" ? "Set Active" : "Set Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="w-100 mx-3 my-4 rounded-5"
        style={{
          maxWidth: "1200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          overflowY: "auto",
          maxHeight: "95vh"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              width="60"
              height="60"
              className="rounded-circle"
              style={{ cursor: "pointer" }}
              onClick={handleBack}
            />
            <h4 className="ms-3 mb-0 text-primary fw-bold d-none d-sm-block">Fisheries Management System</h4>
            <h4 className="ms-3 mb-0 text-primary fw-bold d-block d-sm-none">FMS</h4>
          </div>
          <h2 className="text-center flex-grow-1 fw-bold m-0 fs-4">Fishermen Registry</h2>
          <div className="d-flex align-items-center">
            <span className="me-2 text-muted d-none d-sm-inline">Admin</span>
            <img
              src={profileImage}
              alt="Profile"
              width="60"
              height="60"
              className="rounded-circle"
            />
          </div>
        </div>

        {/* Filter and Search Row */}
        <div className="row mb-4 g-3">
          <div className="col-md-5 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search fishermen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 col-lg-3">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-3 col-lg-5 text-md-end">
            <span className="text-muted me-2 d-block d-md-inline-block mt-2 mt-md-0">
              {getSortedFishermen().length} registered fishermen
            </span>
          </div>
        </div>

        {/* Selected Fisherman Detail Card */}
        {selectedFisherman && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Fisherman Details - {selectedFisherman.name}</h5>
              <button 
                className="btn-close btn-close-white" 
                onClick={() => setSelectedFisherman(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Personal Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{selectedFisherman.name}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Email Address</small>
                      <strong>{selectedFisherman.email}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Contact Number</small>
                      <strong>{selectedFisherman.contact}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">NIC</small>
                      <strong>{selectedFisherman.nic}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Fisherman NIC</small>
                      <strong>{selectedFisherman.fishermenNIC}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Address</small>
                      <strong>{selectedFisherman.address}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Registration Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Associated Boat ID</small>
                      <strong>{selectedFisherman.boatId}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration Status</small>
                      <span className={`badge ${getStatusBadgeClass(selectedFisherman.status)}`}>
                        {selectedFisherman.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration ID</small>
                      <strong>{selectedFisherman.id}</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => toast.info("Edit functionality coming soon!")}
                >
                  <FiEdit className="me-1" /> Edit Details
                </button>
                
                {selectedFisherman.status === "Active" ? (
                  <button 
                    className="btn btn-danger"
                    onClick={initiateRejection}
                  >
                    <FiXCircle className="me-1" /> Set Inactive
                  </button>
                ) : (
                  <button 
                    className="btn btn-success"
                    onClick={initiateApproval}
                  >
                    <FiCheckCircle className="me-1" /> Set Active
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fishermen Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th 
                  scope="col" 
                  onClick={() => requestSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {sortConfig.key === 'name' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col">Email</th>
                <th 
                  scope="col"
                  onClick={() => requestSort('nic')}
                  style={{ cursor: 'pointer' }}
                >
                  NIC {sortConfig.key === 'nic' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col"
                  onClick={() => requestSort('boatId')}
                  style={{ cursor: 'pointer' }}
                >
                  Boat ID {sortConfig.key === 'boatId' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col"
                  onClick={() => requestSort('status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {sortConfig.key === 'status' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedFishermen().length > 0 ? (
                getSortedFishermen().map((fisherman) => (
                  <tr key={fisherman.id} style={{ cursor: "pointer" }}>
                    <td onClick={() => handleFishermanClick(fisherman)}>{fisherman.name}</td>
                    <td onClick={() => handleFishermanClick(fisherman)}>{fisherman.email}</td>
                    <td onClick={() => handleFishermanClick(fisherman)}>{fisherman.nic}</td>
                    <td onClick={() => handleFishermanClick(fisherman)}>{fisherman.boatId}</td>
                    <td onClick={() => handleFishermanClick(fisherman)}>
                      <span className={`badge ${getStatusBadgeClass(fisherman.status)}`}>
                        {fisherman.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleFishermanClick(fisherman)}
                      >
                        <FiEye className="me-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    {searchTerm || filterStatus !== "All" ? 
                      "No matching fishermen found" : 
                      "No fishermen records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-top text-center">
          <p className="text-muted mb-0 small">
            Fisheries Management System • v2.5.0 • © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default FishermanPanel;