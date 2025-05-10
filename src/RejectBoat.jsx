import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEnvelope, 
  faPlus, 
  faExclamationTriangle, 
  faHome,
  faFilter,
  faSort,
  faSync,
  faTimes,
  faCheck,
  faCalendarAlt,
  faShip,
  faIdCard,
  faUser,
  faCommentAlt
} from '@fortawesome/free-solid-svg-icons';

// Constants
const BOAT_COLLECTION = 'boat';
const REJECTED_STATUS = 'Rejected';
const INITIAL_FORM_STATE = {
  boatName: '',
  boatID: '',
  ownerName: '',
  ownerEmail: '',
  reason: ''
};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase (outside component to prevent re-initialization)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * RejectBoat Component - Manages rejected boat registrations
 */
const RejectBoat = () => {
  // State management
  const [rejectedBoats, setRejectedBoats] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [sortField, setSortField] = useState('rejectedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [activeFilterStatus, setActiveFilterStatus] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Fetch rejected boats from Firestore
  const fetchRejectedBoats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const boatsQuery = query(
        collection(db, BOAT_COLLECTION), 
        where("status", "==", REJECTED_STATUS)
      );
      
      const querySnapshot = await getDocs(boatsQuery);
      
      const boats = [];
      querySnapshot.forEach((doc) => {
        boats.push({ id: doc.id, ...doc.data() });
      });
      
      setRejectedBoats(boats);
    } catch (error) {
      console.error("Error fetching rejected boats:", error);
      setError("Failed to load rejected boats. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchRejectedBoats();
  }, [fetchRejectedBoats]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setSuccessMsg(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // Add a new rejected boat to Firestore
  const handleAddBoat = async (e) => {
    e.preventDefault();
    
    const { boatName, boatID, ownerName, ownerEmail, reason } = formData;
    
    if (!boatName || !boatID || !ownerName || !reason || !ownerEmail) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const newBoat = {
        name: boatName,
        nic: boatID,
        serialNumber: `B-${Math.floor(1000 + Math.random() * 9000)}`,
        status: REJECTED_STATUS,
        reason: reason,
        ownerName: ownerName,
        email: ownerEmail,
        rejectedAt: serverTimestamp(),
        year: new Date().getFullYear().toString()
      };

      const docRef = await addDoc(collection(db, BOAT_COLLECTION), newBoat);
      
      // Update local state with timestamp for immediate display
      const boatWithClientTimestamp = {
        ...newBoat,
        id: docRef.id,
        rejectedAt: new Date() // Client-side timestamp for immediate display
      };
      
      setRejectedBoats(prevBoats => [boatWithClientTimestamp, ...prevBoats]);
      setFormData(INITIAL_FORM_STATE);
      setShowForm(false);
      showSuccessMessage('Boat successfully added to rejected list!');
    } catch (error) {
      console.error("Error adding boat:", error);
      alert('Failed to add boat. Please try again.');
    }
  };

  // Generate email content for boat owner
  const generateEmailContent = (boat) => {
    return `Dear ${boat.ownerName},

We regret to inform you that your boat registration (ID: ${boat.nic}, Name: ${boat.name}) has been rejected for the following reason:

${boat.reason}

If you believe this is an error or would like to address these concerns, please contact our office at fisheries-support@example.com or call us at 555-123-4567.

Best regards,
Fisheries Management System
`;
  };

  // Handle opening email modal
  const handleEmailBoatOwner = (boat) => {
    setSelectedBoat(boat);
    setEmailBody(generateEmailContent(boat));
    setShowEmailModal(true);
  };

  // Handle sending email
  const handleSendEmail = () => {
    if (!selectedBoat) return;
    
    const subject = `Boat Registration Rejected: ${selectedBoat.name} (ID: ${selectedBoat.nic})`;
    const mailtoLink = `mailto:${selectedBoat.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.open(mailtoLink, '_blank');
    setShowEmailModal(false);
    showSuccessMessage('Email client opened successfully');
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort boats based on search term and sort criteria
  const filteredAndSortedBoats = React.useMemo(() => {
    // First filter the boats
    const filtered = rejectedBoats.filter((boat) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (boat.name && boat.name.toLowerCase().includes(searchLower)) ||
        (boat.nic && boat.nic.toLowerCase().includes(searchLower)) ||
        (boat.ownerName && boat.ownerName.toLowerCase().includes(searchLower))
      );
    });

    // Then sort the filtered boats
    return [...filtered].sort((a, b) => {
      // Handle missing values
      if (!a[sortField]) return 1;
      if (!b[sortField]) return -1;

      // Sort based on field type
      let comparison;
      if (sortField === 'rejectedAt' && a[sortField] && b[sortField]) {
        // Handle timestamp objects or date objects
        const dateA = a[sortField].seconds ? new Date(a[sortField].seconds * 1000) : a[sortField];
        const dateB = b[sortField].seconds ? new Date(b[sortField].seconds * 1000) : b[sortField];
        comparison = dateA - dateB;
      } else {
        // Handle string comparisons
        comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rejectedBoats, searchTerm, sortField, sortDirection]);

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp objects
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
      
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get water-themed color based on index
  const getWaterColor = (index) => {
    const colors = [
      'rgba(0, 119, 182, 0.03)', // Light blue
      'rgba(3, 4, 94, 0.03)',    // Dark blue
      'rgba(0, 150, 199, 0.03)', // Medium blue
    ];
    return colors[index % colors.length];
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center p-0 m-0"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: `linear-gradient(135deg, rgba(0, 119, 182, 0.8), rgba(3, 4, 94, 0.9)), url(/images/background.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          margin: '40px',
          borderRadius: '20px',
          minHeight: 'calc(100vh - 80px)',
          width: '100%',
          maxWidth: '1200px',
          overflowY: 'auto',
          padding: '0',
          boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Top Wave Decoration */}
        <div style={{ width: '100%', height: '60px', overflow: 'hidden', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}>
            <path
              d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98 L500.00,0.00 L0.00,0.00 Z"
              style={{ stroke: 'none', fill: '#0077b6' }}
            />
          </svg>
        </div>
        
        <div className="p-4 p-md-5 w-100">
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center w-100 mb-4">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="position-relative">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    border: '3px solid #0077b6',
                    padding: '3px',
                    backgroundColor: 'white'
                  }}
                  onClick={() => navigate("/Dashboard")}
                />
                <div 
                  className="position-absolute" 
                  style={{ 
                    bottom: '-5px', 
                    right: '-5px', 
                    backgroundColor: '#0077b6', 
                    borderRadius: '50%', 
                    width: '30px', 
                    height: '30px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate("/Dashboard")}
                >
                  <FontAwesomeIcon icon={faHome} className="text-white" />
                </div>
              </div>
              <div className="ms-3">
                <h5 className="mb-0 text-primary fw-bold">Fisheries Management</h5>
                <small className="text-muted">Maritime Authority</small>
              </div>
            </div>
            
            <div className="flex-grow-1 text-center mb-3 mb-md-0">
              <h2 className="fw-bold" style={{ color: '#0077b6', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                <FontAwesomeIcon icon={faShip} className="me-2" />
                Rejected Boats Registry
              </h2>
              <div className="progress" style={{ height: '5px' }}>
                <div className="progress-bar bg-danger" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="dropdown">
                <img
                  src="/images/profile.png"
                  alt="Profile"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%',
                    border: '2px solid #0077b6',
                    cursor: 'pointer'
                  }}
                  title="User Profile"
                  className="dropdown-toggle"
                  data-bs-toggle="dropdown"
                />
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#profile">My Profile</a></li>
                  <li><a className="dropdown-item" href="#settings">Settings</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#logout">Logout</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              <div className="flex-grow-1">{successMsg}</div>
              <button type="button" className="btn-close" onClick={() => setShowSuccess(false)}></button>
            </div>
          )}

          {/* Alert for errors */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div className="flex-grow-1">{error}</div>
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Dashboard Stats */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffffff, #f0f7ff)'
              }}>
                <div className="card-body d-flex flex-column">
                  <h5 className="text-primary fw-bold">Total Rejected</h5>
                  <div className="d-flex align-items-center mt-3">
                    <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
                      <FontAwesomeIcon icon={faTimes} className="text-danger" size="lg" />
                    </div>
                    <div>
                      <h2 className="mb-0 fw-bold">{rejectedBoats.length}</h2>
                      <small className="text-muted">Boat registrations</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffffff, #f0f7ff)' 
              }}>
                <div className="card-body d-flex flex-column">
                  <h5 className="text-primary fw-bold">This Month</h5>
                  <div className="d-flex align-items-center mt-3">
                    <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-primary" size="lg" />
                    </div>
                    <div>
                      <h2 className="mb-0 fw-bold">
                        {rejectedBoats.filter(boat => {
                          if (!boat.rejectedAt) return false;
                          const date = boat.rejectedAt.seconds 
                            ? new Date(boat.rejectedAt.seconds * 1000) 
                            : new Date(boat.rejectedAt);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && 
                                 date.getFullYear() === now.getFullYear();
                        }).length}
                      </h2>
                      <small className="text-muted">Recent rejections</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ffffff, #f0f7ff)' 
              }}>
                <div className="card-body d-flex flex-column">
                  <h5 className="text-primary fw-bold">Notification Status</h5>
                  <div className="d-flex align-items-center mt-3">
                    <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)' }}>
                      <FontAwesomeIcon icon={faEnvelope} className="text-success" size="lg" />
                    </div>
                    <div>
                      <h2 className="mb-0 fw-bold">
                        {Math.floor(rejectedBoats.filter(boat => boat.email).length / 
                        (rejectedBoats.length || 1) * 100)}%
                      </h2>
                      <small className="text-muted">With email contacts</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Rejected Boat Form Button */}
          <div className="d-flex justify-content-end mb-4">
            <button 
              className={`btn ${showForm ? 'btn-outline-secondary' : 'btn-primary'}`}
              onClick={() => setShowForm(!showForm)}
              style={{
                borderRadius: '50px',
                padding: '10px 20px',
                boxShadow: showForm ? 'none' : '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="me-2" />
              {showForm ? 'Cancel' : 'Register New Rejection'}
            </button>
          </div>

          {/* Add Rejected Boat Form */}
          {showForm && (
            <div className="card border-0 shadow mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="card-header bg-danger text-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" size="lg" />
                  <h5 className="mb-0 fw-bold">New Rejection Registration</h5>
                </div>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleAddBoat}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="boatName"
                          placeholder="Enter boat name"
                          name="boatName"
                          value={formData.boatName}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="boatName">
                          <FontAwesomeIcon icon={faShip} className="me-2" />
                          Boat Name
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="boatID"
                          placeholder="Enter boat ID"
                          name="boatID"
                          value={formData.boatID}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="boatID">
                          <FontAwesomeIcon icon={faIdCard} className="me-2" />
                          Boat ID/NIC
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="ownerName"
                          placeholder="Enter owner name"
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="ownerName">
                          <FontAwesomeIcon icon={faUser} className="me-2" />
                          Owner Name
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating mb-3">
                        <input
                          type="email"
                          className="form-control"
                          id="ownerEmail"
                          placeholder="Enter owner email"
                          name="ownerEmail"
                          value={formData.ownerEmail}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="ownerEmail">
                          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                          Owner Email
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control"
                      placeholder="Explain why this boat is being rejected"
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      style={{ height: '120px' }}
                      required
                    ></textarea>
                    <label htmlFor="reason">
                      <FontAwesomeIcon icon={faCommentAlt} className="me-2" />
                      Reason for Rejection
                    </label>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowForm(false)}
                      style={{ borderRadius: '50px', padding: '10px 20px' }}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-danger"
                      style={{ borderRadius: '50px', padding: '10px 20px' }}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Add to Rejected List
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FontAwesomeIcon icon={faSearch} className="text-primary" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by boat name, ID or owner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: '0 50px 50px 0' }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    <div className="btn-group">
                      <button 
                        className={`btn ${activeFilterStatus === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveFilterStatus('all')}
                      >
                        All
                      </button>
                      <button 
                        className={`btn ${activeFilterStatus === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveFilterStatus('month')}
                      >
                        This Month
                      </button>
                      <button 
                        className={`btn ${activeFilterStatus === 'withEmail' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveFilterStatus('withEmail')}
                      >
                        With Email
                      </button>
                    </div>
                    <button
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={() => fetchRejectedBoats()}
                      title="Refresh data"
                      style={{ borderRadius: '50px' }}
                    >
                      <FontAwesomeIcon icon={faSync} className="me-md-2" />
                      <span className="d-none d-md-inline">Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rejected Boats List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-primary">
                <FontAwesomeIcon icon={faShip} className="me-2" />
                Rejected Boats Registry
              </h5>
              <span className="badge bg-danger rounded-pill px-3 py-2">
                {filteredAndSortedBoats.length} {filteredAndSortedBoats.length === 1 ? 'boat' : 'boats'} found
              </span>
            </div>
            
            {loading ? (
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading rejected boats registry...</p>
              </div>
            ) : filteredAndSortedBoats.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th 
                        style={{cursor: 'pointer', borderTop: 'none'}} 
                        onClick={() => handleSort('name')}
                        className="py-3"
                      >
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                          Boat Name
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`ms-1 ${sortField === 'name' ? 'text-primary' : 'text-muted'}`}
                            
                          />
                        </div>
                      </th>
                      <th 
                        style={{cursor: 'pointer'}} 
                        onClick={() => handleSort('nic')}
                        className="py-3"
                      >
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                          Boat ID
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`ms-1 ${sortField === 'nic' ? 'text-primary' : 'text-muted'}`}
                          />
                        </div>
                      </th>
                      <th 
                        style={{cursor: 'pointer'}} 
                        onClick={() => handleSort('ownerName')}
                        className="py-3"
                      >
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                          Owner
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`ms-1 ${sortField === 'ownerName' ? 'text-primary' : 'text-muted'}`}
                          />
                        </div>
                      </th>
                      <th className="py-3">
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faCommentAlt} className="me-2 text-primary" />
                          Reason
                        </div>
                      </th>
                      <th 
                        style={{cursor: 'pointer'}} 
                        onClick={() => handleSort('rejectedAt')}
                        className="py-3"
                      >
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                          Date
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`ms-1 ${sortField === 'rejectedAt' ? 'text-primary' : 'text-muted'}`}
                          />
                        </div>
                      </th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedBoats.map((boat, index) => (
                      <tr key={boat.id} style={{ backgroundColor: getWaterColor(index) }}>
                        <td className="align-middle">
                          <div className="d-flex align-items-center">
                            <div 
                              className="text-primary fw-bold" 
                              style={{ 
                                fontSize: '16px',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {boat.name || 'N/A'}
                            </div>
                            <small className="ms-2 badge bg-light text-dark">
                              {boat.serialNumber || 'No SN'}
                            </small>
                          </div>
                        </td>
                        <td className="align-middle">
                          <code className="bg-light px-2 py-1 rounded">{boat.nic || 'N/A'}</code>
                        </td>
                        <td className="align-middle">
                          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {boat.ownerName || 'N/A'}
                            {boat.email && (
                              <div className="small text-muted text-truncate">
                                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                {boat.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="align-middle">
                          <div 
                            style={{ 
                              maxWidth: '250px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              fontSize: '14px'
                            }}
                          >
                            {boat.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="align-middle">
                          <div className="small">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                            {formatDate(boat.rejectedAt)}
                          </div>
                        </td>
                        <td className="align-middle text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEmailBoatOwner(boat)}
                              disabled={!boat.email}
                              title={boat.email ? "Send email to boat owner" : "No email available"}
                              style={{ borderRadius: '50px' }}
                            >
                              <FontAwesomeIcon icon={faEnvelope} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info"
                              title="View details"
                              style={{ borderRadius: '50px' }}
                              onClick={() => setSelectedBoat(boat)}
                              data-bs-toggle="modal"
                              data-bs-target="#detailsModal"
                            >
                              <FontAwesomeIcon icon={faSearch} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-body text-center py-5">
                <div className="text-muted">
                  <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 text-secondary" />
                  <h5>No rejected boats found</h5>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </div>

          {/* Email Modal */}
          {showEmailModal && selectedBoat && (
            <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      Email to Boat Owner
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => setShowEmailModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        <strong>To:</strong>
                        <span className="ms-2">{selectedBoat.ownerName} &lt;{selectedBoat.email}&gt;</span>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                        <strong>Boat:</strong>
                        <span className="ms-2">{selectedBoat.name} (ID: {selectedBoat.nic})</span>
                      </div>
                    </div>
                    <div className="form-floating mb-3">
                      <textarea
                        className="form-control"
                        placeholder="Email content"
                        id="emailBody"
                        style={{ height: '300px' }}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                      ></textarea>
                      <label htmlFor="emailBody">Email Body</label>
                    </div>
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      <div>
                        This will open your default email client with this message.
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={() => setShowEmailModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleSendEmail}
                    >
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      Open in Email Client
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {selectedBoat && (
            <div className="modal fade" id="detailsModal" tabIndex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header bg-info text-white">
                    <h5 className="modal-title" id="detailsModalLabel">
                      <FontAwesomeIcon icon={faShip} className="me-2" />
                      Boat Details
                    </h5>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Boat Information</h6>
                          </div>
                          <div className="card-body">
                            <table className="table table-borderless">
                              <tbody>
                                <tr>
                                  <th scope="row" style={{width: '40%'}}>Boat Name:</th>
                                  <td>{selectedBoat.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th scope="row">Boat ID/NIC:</th>
                                  <td><code>{selectedBoat.nic || 'N/A'}</code></td>
                                </tr>
                                <tr>
                                  <th scope="row">Serial Number:</th>
                                  <td><code>{selectedBoat.serialNumber || 'N/A'}</code></td>
                                </tr>
                                <tr>
                                  <th scope="row">Year:</th>
                                  <td>{selectedBoat.year || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th scope="row">Status:</th>
                                  <td>
                                    <span className="badge bg-danger">{selectedBoat.status}</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Owner Information</h6>
                          </div>
                          <div className="card-body">
                            <table className="table table-borderless">
                              <tbody>
                                <tr>
                                  <th scope="row" style={{width: '40%'}}>Owner Name:</th>
                                  <td>{selectedBoat.ownerName || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th scope="row">Email:</th>
                                  <td>
                                    {selectedBoat.email ? (
                                      <a href={`mailto:${selectedBoat.email}`} className="text-decoration-none">
                                        <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                        {selectedBoat.email}
                                      </a>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <th scope="row">Rejected Date:</th>
                                  <td>{formatDate(selectedBoat.rejectedAt)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-header bg-danger text-white">
                            <h6 className="mb-0">Rejection Reason</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{selectedBoat.reason || 'No reason provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    {selectedBoat.email && (
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => {
                          handleEmailBoatOwner(selectedBoat);
                          document.querySelector('#detailsModal [data-bs-dismiss="modal"]').click();
                        }}
                      >
                        <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                        Email Owner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Wave Decoration */}
          <div className="mt-4" style={{ width: '100%', height: '40px', overflow: 'hidden' }}>
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}>
              <path
                d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                style={{ stroke: 'none', fill: '#0077b6', opacity: '0.2' }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectBoat;