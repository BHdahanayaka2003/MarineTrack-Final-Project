import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "requestDate", direction: "desc" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null);
  
  const pdfModalRef = useRef(null);

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
            document: data.document || null,
            boatLength: data.boatLength || "N/A",
            capacity: data.capacity || "N/A",
            power: data.power || "N/A",
            serialNumber: data.serialNumber || "N/A",
            nic: data.nic || "N/A",
            address: data.address || "N/A",
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

  // PDF functions
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setCurrentPage(prevPage => {
      const newPage = prevPage + offset;
      return newPage >= 1 && newPage <= numPages ? newPage : prevPage;
    });
  };

  // Handle document view
  const openPdfViewer = () => {
    if (selectedRequest && selectedRequest.document) {
      setShowPdfViewer(true);
    } else {
      toast.error("No document available to view");
    }
  };

  // Handle document download
  const handleDownloadDocument = () => {
    if (selectedRequest && selectedRequest.document) {
      window.open(selectedRequest.document, '_blank');
    } else {
      toast.error("No document available to download");
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setCurrentPage(1);
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
    try {
      const newStatus = actionType === "approve" ? "Approved" : "Rejected";
      
      // Update in Firestore
      const requestRef = doc(db, "boat", selectedRequest.id);
      await updateDoc(requestRef, {
        status: newStatus
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === selectedRequest.id ? {...req, status: newStatus} : req
      ));
      
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
      setSelectedRequest(prev => ({...prev, status: newStatus}));
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(`Failed to ${actionType} request. Please try again.`);
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
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
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

  const getSortedRequests = () => {
    // First filter by search term
    let filteredRequests = requests.filter(request => {
      const searchFields = [
        request.name,
        request.email,
        request.boatName,
        request.contact,
        request.id
      ].join(" ").toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
    
    // Then filter by status if needed
    if (filterStatus !== "All") {
      filteredRequests = filteredRequests.filter(request => 
        request.status === filterStatus
      );
    }
    
    // Finally sort
    return [...filteredRequests].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Close PDF viewer when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfModalRef.current && !pdfModalRef.current.contains(event.target)) {
        setShowPdfViewer(false);
      }
    };

    if (showPdfViewer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPdfViewer]);

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
      
      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedRequest?.document && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div 
            ref={pdfModalRef}
            className="bg-white rounded-4 p-4" 
            style={{ maxWidth: "90%", maxHeight: "90%", overflow: "auto" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Document Viewer - {selectedRequest.boatName}</h5>
              <button className="btn-close" onClick={() => setShowPdfViewer(false)}></button>
            </div>
            
            <div className="text-center mb-3">
              <div className="btn-group">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage <= 1} 
                  onClick={() => changePage(-1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage >= numPages} 
                  onClick={() => changePage(1)}
                >
                  Next
                </button>
              </div>
              <span className="ms-3">
                Page {currentPage} of {numPages || '?'}
              </span>
            </div>
            
            <div className="border rounded p-2 d-flex justify-content-center">
              <Document
                file={selectedRequest.document}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="text-center my-5"><div className="spinner-border"></div></div>}
                error={<div className="alert alert-danger">Failed to load PDF. Check the document URL.</div>}
              >
                <Page 
                  pageNumber={currentPage} 
                  scale={1.2} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-4 shadow" style={{ maxWidth: "400px" }}>
            <h5 className="mb-3">Confirm Action</h5>
            <p>
              Are you sure you want to {actionType === "approve" ? "approve" : "reject"} the 
              boat registration request for <b>{selectedRequest?.boatName}</b>?
            </p>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button className="btn btn-outline-secondary" onClick={cancelAction}>
                Cancel
              </button>
              <button 
                className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={confirmAction}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="w-100 mx-3 rounded-5"
        style={{
          maxWidth: "1200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
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
            <h4 className="ms-3 mb-0 text-primary fw-bold">Fisheries Management System</h4>
          </div>
          <h2 className="text-center flex-grow-1 fw-bold m-0">Boat Registration Requests</h2>
          <div className="d-flex align-items-center">
            <span className="me-2 text-muted">Admin</span>
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
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, email, boat name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-5 text-md-end">
            <span className="text-muted me-2">
              {getSortedRequests().length} requests found
            </span>
          </div>
        </div>

        {/* Selected Request Detail Card */}
        {selectedRequest && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Request Details</h5>
              <button 
                className="btn-close btn-close-white" 
                onClick={() => setSelectedRequest(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex flex-column h-100">
                    <h6 className="text-primary mb-3">Owner Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{selectedRequest.name}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Email Address</small>
                      <strong>{selectedRequest.email}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Contact Number</small>
                      <strong>{selectedRequest.contact}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">NIC</small>
                      <strong>{selectedRequest.nic}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Address</small>
                      <strong>{selectedRequest.address || "N/A"}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex flex-column h-100">
                    <h6 className="text-primary mb-3">Boat Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Boat Name</small>
                      <strong>{selectedRequest.boatName}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Length</small>
                      <strong>{selectedRequest.boatLength} meters</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Capacity</small>
                      <strong>{selectedRequest.capacity} people</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Engine Power</small>
                      <strong>{selectedRequest.power || "N/A"} HP</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Serial Number</small>
                      <strong>{selectedRequest.serialNumber}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration Status</small>
                      <span className={`badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-primary mb-2">Documentation</h6>
                      <p className="mb-0 small">
                        {selectedRequest.document ? 
                          "Document attached to this registration request" : 
                          "No documents attached to this request"}
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={openPdfViewer}
                        disabled={!selectedRequest.document}
                      >
                        <FiEye className="me-1" /> View
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleDownloadDocument}
                        disabled={!selectedRequest.document}
                      >
                        <FiDownload className="me-1" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRequest.status === "Pending" && (
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    className="btn btn-danger"
                    onClick={initiateRejection}
                  >
                    <FiXCircle className="me-1" /> Reject Request
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={initiateApproval}
                  >
                    <FiCheckCircle className="me-1" /> Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th 
                  scope="col" 
                  onClick={() => requestSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Owner {sortConfig.key === 'name' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col">Email</th>
                <th 
                  scope="col"
                  onClick={() => requestSort('boatName')}
                  style={{ cursor: 'pointer' }}
                >
                  Boat Name {sortConfig.key === 'boatName' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col"
                  onClick={() => requestSort('requestDate')}
                  style={{ cursor: 'pointer' }}
                >
                  Request Date {sortConfig.key === 'requestDate' && (
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
                <th scope="col">Documents</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedRequests().length > 0 ? (
                getSortedRequests().map((request) => (
                  <tr key={request.id} style={{ cursor: "pointer" }}>
                    <td onClick={() => handleRequestClick(request)}>{request.name}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.email}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.boatName}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.requestDate}</td>
                    <td onClick={() => handleRequestClick(request)}>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.document ? (
                        <FiFileText className="text-primary" size={18} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRequestClick(request)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    {searchTerm || filterStatus !== "All" ? 
                      "No matching registration requests found" : 
                      "No registration requests found"}
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

export default RequestPanel;