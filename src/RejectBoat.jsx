import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp // Import Timestamp
} from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';
// Ensure you have bootstrap JS for modals: import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEnvelope, faExclamationTriangle, faHome, faSort, faSync,
  faTimes, faCheck, faCalendarAlt, faShip, faIdCard, faUser, faCommentAlt,
  faBan, faUndo, faSpinner, faPaperPlane, faEye, faArrowLeft, faPlusCircle,
  faFileSignature, faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Constants
const BOAT_COLLECTION = 'boat';
const REJECTED_STATUS = 'Rejected';
const PENDING_STATUS = 'Pending'; // For undoing rejection
const INITIAL_FORM_STATE = {
  selectedBoatDocId: '',
  reason: ''
};

// Firebase configuration - ENSURE THIS IS SECURED AND NOT HARDCODED IN PRODUCTION
// Ideally, use environment variables.
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
const db = getFirestore(app);

// Helper to format Firestore Timestamps
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  let date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) { // Handle older format if present
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Invalid Date';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};


const RejectBoat = () => {
  const [rejectedBoats, setRejectedBoats] = useState([]);
  const [selectableBoats, setSelectableBoats] = useState([]);
  const [isFetchingSelectable, setIsFetchingSelectable] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [boatToRejectDetails, setBoatToRejectDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBoatForModal, setSelectedBoatForModal] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [sortField, setSortField] = useState('rejectedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [boatToUndo, setBoatToUndo] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);

  const navigate = useNavigate();

  const mapBoatData = (docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      name: data.boatName || data.name || 'Unnamed Boat',
      nic: data.nic || 'N/A',
      ownerName: data.ownerName || 'N/A',
      email: data.email || null,
      // Ensure rejectedAt is a Firestore Timestamp or null for consistent sorting
      rejectedAt: data.rejectedAt || null,
    };
  };

  const fetchRejectedBoats = useCallback(async () => {
    try {
      setLoading(true);
      const boatsQuery = query(
        collection(db, BOAT_COLLECTION),
        where("status", "==", REJECTED_STATUS)
      );
      const querySnapshot = await getDocs(boatsQuery);
      const boatsData = querySnapshot.docs.map(mapBoatData);
      setRejectedBoats(boatsData);
    } catch (err) {
      console.error("Error fetching rejected boats:", err);
      toast.error("Failed to load rejected boats. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSelectableBoats = useCallback(async () => {
    try {
      setIsFetchingSelectable(true);
      // Fetch boats that are NOT rejected and ideally 'Pending' or 'Approved'
      // For simplicity, we'll stick to "not rejected" but in a real app, this could be more specific
      const q = query(collection(db, BOAT_COLLECTION), where("status", "!=", REJECTED_STATUS));
      const querySnapshot = await getDocs(q);
      const boatsData = querySnapshot.docs
        .map(mapBoatData)
        .filter(boat => boat.id && boat.name !== 'Unnamed Boat'); // Basic filter
      setSelectableBoats(boatsData);
       if (boatsData.length === 0) {
        toast.info("No boats currently available for rejection.");
      }
    } catch (err) {
      console.error("Error fetching selectable boats:", err);
      toast.error("Failed to load boats for rejection. Ensure database is accessible.");
    } finally {
      setIsFetchingSelectable(false);
    }
  }, []);

  useEffect(() => {
    fetchRejectedBoats();
    // Initialize Bootstrap tooltips if you use them
    // var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    //   return new window.bootstrap.Tooltip(tooltipTriggerEl)
    // })
    // return () => tooltipList.forEach(tooltip => tooltip.dispose()); // Cleanup
  }, [fetchRejectedBoats]);

  const handleBoatSelectionChange = (e) => {
    const boatId = e.target.value;
    if (boatId) {
      const selected = selectableBoats.find(b => b.id === boatId);
      setFormData(prev => ({ ...prev, selectedBoatDocId: boatId }));
      setBoatToRejectDetails(selected);
    } else {
      setFormData(prev => ({ ...prev, selectedBoatDocId: '' }));
      setBoatToRejectDetails(null);
    }
  };

  const handleReasonInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleRejectSelectedBoat = async (e) => {
    e.preventDefault();
    const { selectedBoatDocId, reason } = formData;

    if (!selectedBoatDocId) {
      toast.warn('Please select a boat to reject.');
      return;
    }
    if (!reason || !reason.trim()) {
      toast.warn('Please provide a reason for rejection.');
      return;
    }

    setIsSubmittingRejection(true);
    const boatNameForMessage = boatToRejectDetails?.name || selectedBoatDocId;

    try {
      const boatRef = doc(db, BOAT_COLLECTION, selectedBoatDocId);
      await updateDoc(boatRef, {
        status: REJECTED_STATUS,
        reason: reason.trim(),
        rejectedAt: serverTimestamp(),
        lastUpdatedBy: "AdminUser" // Example: if you have user context
      });

      toast.success(`Boat "${boatNameForMessage}" has been successfully rejected.`);
      fetchRejectedBoats();
      if (showForm) {
        fetchSelectableBoats();
      }
      setFormData(INITIAL_FORM_STATE);
      setBoatToRejectDetails(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error rejecting boat:", error);
      toast.error(`Failed to reject boat "${boatNameForMessage}": ${error.message}`);
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const generateEmailContent = (boat) => `Dear ${boat.ownerName || 'Boat Owner'},

We regret to inform you that your boat registration for "${boat.name || 'N/A'}" (ID: ${boat.nic || boat.id}) has been rejected.
Reason: ${boat.reason || 'Not specified.'}

For further clarification or to address the issues, please contact our support team at fisheries-support@example.com or call 555-MARITIME.

Sincerely,
Fisheries Management Authority`;

  const handleEmailBoatOwner = (boat) => {
    setSelectedBoatForModal(boat);
    setEmailBody(generateEmailContent(boat));
    setShowEmailModal(true);
  };

  const handleSendEmail = () => {
    if (!selectedBoatForModal || !selectedBoatForModal.email) {
        toast.error("No email address available for this owner.");
        return;
    }
    const subject = `Important: Boat Registration Rejected - ${selectedBoatForModal.name || 'N/A'}`;
    const mailtoLink = `mailto:${selectedBoatForModal.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink, '_blank');
    setShowEmailModal(false);
    toast.info('Opening email client...');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedBoats = useMemo(() => {
    const filtered = rejectedBoats.filter((boat) => {
      const searchLower = searchTerm.toLowerCase();
      return (boat.name?.toLowerCase().includes(searchLower) ||
              boat.nic?.toLowerCase().includes(searchLower) ||
              boat.ownerName?.toLowerCase().includes(searchLower) ||
              boat.reason?.toLowerCase().includes(searchLower) );
    });

    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || typeof valA === 'undefined') return 1;
      if (valB === null || typeof valB === 'undefined') return -1;

      let comparison = 0;
      if (sortField === 'rejectedAt') {
        const timeA = valA instanceof Timestamp ? valA.toMillis() : (valA?.seconds ? valA.seconds * 1000 : new Date(valA).getTime());
        const timeB = valB instanceof Timestamp ? valB.toMillis() : (valB?.seconds ? valB.seconds * 1000 : new Date(valB).getTime());
        comparison = timeA - timeB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        comparison = (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rejectedBoats, searchTerm, sortField, sortDirection]);

  const getWaterColor = (index) => {
    const colors = ['rgba(0, 119, 182, 0.02)', 'rgba(3, 4, 94, 0.02)', 'rgba(0, 150, 199, 0.02)'];
    return colors[index % colors.length];
  };

  const toggleShowForm = () => {
    const willShowForm = !showForm;
    setShowForm(willShowForm);
    if (willShowForm) {
      fetchSelectableBoats();
      setFormData(INITIAL_FORM_STATE);
      setBoatToRejectDetails(null);
    } else {
      setFormData(INITIAL_FORM_STATE);
      setBoatToRejectDetails(null);
    }
  };

  const emailContactPercentage = rejectedBoats.length > 0
    ? Math.round(rejectedBoats.filter(boat => boat.email).length / rejectedBoats.length * 100)
    : 0;

  const handleOpenUndoModal = (boat) => {
    setBoatToUndo(boat);
    setShowUndoModal(true);
  };

  const handleUndoRejection = async () => {
    if (!boatToUndo) return;
    setIsUndoing(true);
    try {
      const boatRef = doc(db, BOAT_COLLECTION, boatToUndo.id);
      await updateDoc(boatRef, {
        status: PENDING_STATUS, // Or another appropriate status like 'Re-evaluation'
        reason: null, // Clear previous rejection reason
        rejectedAt: null, // Clear rejection date
        // Optionally:
        // previousStatus: REJECTED_STATUS,
        // undoReason: "Re-evaluation requested by admin" 
      });
      toast.success(`Rejection for boat "${boatToUndo.name}" has been undone. Status set to ${PENDING_STATUS}.`);
      fetchRejectedBoats(); // Refresh rejected list
      // Potentially refresh other lists if this boat now appears elsewhere
      setShowUndoModal(false);
      setBoatToUndo(null);
    } catch (error) {
      console.error("Error undoing rejection:", error);
      toast.error(`Failed to undo rejection for "${boatToUndo.name}": ${error.message}`);
    } finally {
      setIsUndoing(false);
    }
  };
  
  // Styles for modern look
  const pageStyle = {
    minHeight: '100vh', width: '100vw',
    backgroundImage: `linear-gradient(135deg, rgba(0, 100, 150, 0.85), rgba(0, 20, 60, 0.95)), url(/images/background.jpeg)`, // Darker, more professional gradient
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed',
    '--bs-primary-rgb': '0, 119, 182', // Define Bootstrap primary color for dynamic use
    '--bs-danger-rgb': '220, 53, 69',
  };

  const mainContainerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly less transparent for readability
    margin: '30px', borderRadius: '25px',
    minHeight: 'calc(100vh - 60px)', width: '100%', maxWidth: '1300px', // Slightly wider
    overflow: 'hidden', // Important for border-radius with child elements
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
  };

  const cardStyle = { 
    borderRadius: '15px', 
    background: 'linear-gradient(145deg, rgba(255,255,255,0.8), rgba(230,240,255,0.7))', // Softer gradient
    boxShadow: '0 8px 15px rgba(0,0,0,0.05)',
    border: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };
  
  const cardHoverStyle = { // Apply this on :hover
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored"/>
      <div className="container-fluid d-flex justify-content-center align-items-start p-0 m-0" style={pageStyle}>
        <div style={mainContainerStyle}>
          {/* Top Wave Decoration - Enhanced */}
          <div style={{ width: '100%', height: '70px', overflow: 'hidden', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', position: 'relative' }}>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
              <path d="M0.00,49.98 C150.00,120.00 270.00,-20.00 500.00,49.98 L500.00,0.00 L0.00,0.00 Z" style={{ stroke: 'none', fill: 'rgba(0, 119, 182, 0.7)' }} /> {/* Main wave */}
            </svg>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style={{ height: '100%', width: '100%', position: 'absolute', top: '5px', left: 0, zIndex: 0 }}>
              <path d="M0.00,52.98 C180.00,100.00 320.00,0.00 500.00,55.98 L500.00,0.00 L0.00,0.00 Z" style={{ stroke: 'none', fill: 'rgba(3, 4, 94, 0.5)' }} /> {/* Secondary wave for depth */}
            </svg>
          </div>
          
          <div className="p-4 p-md-5 w-100" style={{flexGrow: 1, overflowY: 'auto'}}> {/* Content area scrolls */}
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center w-100 mb-4 pb-3 border-bottom border-light">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="position-relative me-3" onClick={() => navigate("/Dashboard")} style={{cursor: 'pointer'}}>
                      <img src="/images/logo.png" alt="Logo" style={{ width: '75px', height: '75px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 0 15px rgba(0,119,182,0.5)' }} />
                      <div className="position-absolute d-flex justify-content-center align-items-center" style={{ bottom: 0, right: 0, backgroundColor: '#0077b6', color: 'white', borderRadius: '50%', width: '30px', height: '30px', border: '2px solid white' }} title="Go to Dashboard">
                          <FontAwesomeIcon icon={faHome} />
                      </div>
                  </div>
                  <div>
                      <h4 className="mb-0 fw-bold" style={{color: '#003B73'}}>Fisheries Dept.</h4>
                      <small className="text-muted">Maritime Resource Management</small>
                  </div>
              </div>
              <div className="text-center my-3 my-md-0">
                  <h1 className="fw-bolder" style={{ color: '#0077b6', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                      <FontAwesomeIcon icon={faBan} className="me-2" /> Rejected Vessels
                  </h1>
              </div>
              <div className="d-flex align-items-center">
                  <img src="/images/profile.png" alt="Profile" style={{ width: '55px', height: '55px', borderRadius: '50%', border: '3px solid #0077b6', cursor: 'pointer' }} title="User Profile" className="dropdown-toggle" data-bs-toggle="dropdown"/>
                  <ul className="dropdown-menu dropdown-menu-end shadow-lg">
                      <li><a className="dropdown-item" href="#profile"><FontAwesomeIcon icon={faUser} className="me-2"/>My Profile</a></li>
                      <li><a className="dropdown-item" href="#settings"><FontAwesomeIcon icon={faIdCard} className="me-2"/>Settings</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><a className="dropdown-item text-danger" href="#logout"><FontAwesomeIcon icon={faArrowLeft} className="me-2"/>Logout</a></li>
                  </ul>
              </div>
            </div>

            {/* Dashboard Stats - Enhanced Cards */}
            <div className="row g-4 mb-5">
              {[{icon: faClipboardList, title: "Total Rejected", value: rejectedBoats.length, unit: "Vessels", color: "danger"},
                {icon: faCalendarAlt, title: "Rejected This Month", value: rejectedBoats.filter(b => b.rejectedAt && (b.rejectedAt.toDate ? b.rejectedAt.toDate() : new Date(b.rejectedAt)).getMonth() === new Date().getMonth()).length, unit: "Recently", color: "primary"},
                {icon: faEnvelope, title: "Contactable Owners", value: `${emailContactPercentage}%`, unit: "Via Email", color: "success"}
              ].map(stat => (
                <div className="col-md-4" key={stat.title}>
                  <div className="card h-100" style={cardStyle} onMouseEnter={e => e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow} onMouseLeave={e => e.currentTarget.style.boxShadow = cardStyle.boxShadow}>
                    <div className="card-body d-flex flex-column justify-content-between p-4">
                      <h5 className={`fw-bold text-${stat.color}`}>{stat.title}</h5>
                      <div className="d-flex align-items-center mt-3">
                        <div className={`p-3 rounded-circle me-3 bg-${stat.color}-soft`} style={{backgroundColor: `rgba(var(--bs-${stat.color}-rgb), 0.1)`}}>
                           <FontAwesomeIcon icon={stat.icon} className={`text-${stat.color}`} size="2x" />
                        </div>
                        <div>
                          <h1 className="mb-0 fw-bolder display-5">{stat.value}</h1>
                          <small className="text-muted">{stat.unit}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-end mb-4">
              <button
                className={`btn btn-lg ${showForm ? 'btn-outline-danger' : 'btn-danger'} shadow-sm`}
                onClick={toggleShowForm}
                style={{ borderRadius: '50px', padding: '12px 25px', transition: 'all 0.3s ease' }}
              >
                <FontAwesomeIcon icon={showForm ? faTimes : faPlusCircle} className="me-2" />
                {showForm ? 'Cancel New Rejection' : 'Initiate New Rejection'}
              </button>
            </div>

            {/* Rejection Form - Enhanced */}
            {showForm && (
              <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.95)' }}>
                <div className="card-header bg-danger text-white py-3">
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faFileSignature} className="me-3" size="2x" />
                    <h4 className="mb-0 fw-bold">Process Vessel Rejection</h4>
                  </div>
                </div>
                <div className="card-body p-4 p-md-5">
                  <form onSubmit={handleRejectSelectedBoat}>
                    <div className="mb-4">
                      <label htmlFor="selectableBoat" className="form-label fs-5 fw-semibold mb-2">
                        <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                        Select Vessel to Reject:
                      </label>
                      <select
                        className="form-select form-select-lg" id="selectableBoat"
                        value={formData.selectedBoatDocId} onChange={handleBoatSelectionChange}
                        required disabled={isFetchingSelectable || isSubmittingRejection}
                        style={{borderRadius: '10px'}}
                      >
                        <option value="">
                          {isFetchingSelectable ? "Loading available vessels..." : selectableBoats.length > 0 ? "-- Choose a Vessel --" : "No vessels eligible for rejection"}
                        </option>
                        {selectableBoats.map(boat => (
                          <option key={boat.id} value={boat.id}>
                            {boat.name} (ID: {boat.nic}, Owner: {boat.ownerName}) - Current Status: {boat.status || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {boatToRejectDetails && (
                      <div className="card mb-4 p-3 shadow-sm" style={{borderRadius: '10px', background: 'rgba(0,119,182,0.05)'}}>
                        <h6 className="mb-2 text-primary fw-bold">
                          <FontAwesomeIcon icon={faIdCard} className="me-2" />
                          Selected Vessel Details:
                        </h6>
                        <p className="mb-1"><strong>Name:</strong> {boatToRejectDetails.name}</p>
                        <p className="mb-1"><strong>ID/NIC:</strong> <span className="badge bg-secondary">{boatToRejectDetails.nic}</span></p>
                        <p className="mb-1"><strong>Owner:</strong> {boatToRejectDetails.ownerName} {boatToRejectDetails.email && <span className="small text-muted">({boatToRejectDetails.email})</span>}</p>
                        <p className="mb-0"><strong>Current Status:</strong> <span className={`badge bg-${boatToRejectDetails.status === 'Approved' ? 'success' : 'warning text-dark'}`}>{boatToRejectDetails.status || 'N/A'}</span></p>
                      </div>
                    )}

                    <div className="form-floating mb-4">
                      <textarea
                        className="form-control" placeholder="Reason for Rejection"
                        id="reason" name="reason" value={formData.reason}
                        onChange={handleReasonInputChange} style={{ height: '150px', borderRadius: '10px' }}
                        required disabled={!formData.selectedBoatDocId || isSubmittingRejection}
                      />
                      <label htmlFor="reason">
                        <FontAwesomeIcon icon={faCommentAlt} className="me-2" />
                        Detailed Reason for Rejection
                      </label>
                    </div>
                    <div className="d-flex justify-content-end gap-3">
                      <button type="button" className="btn btn-outline-secondary btn-lg"
                        onClick={() => { setShowForm(false); setFormData(INITIAL_FORM_STATE); setBoatToRejectDetails(null);}}
                        style={{ borderRadius: '50px', padding: '10px 25px' }}
                        disabled={isSubmittingRejection}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />Cancel
                      </button>
                      <button type="submit" className="btn btn-danger btn-lg"
                        style={{ borderRadius: '50px', padding: '10px 25px' }}
                        disabled={!formData.selectedBoatDocId || !formData.reason.trim() || isSubmittingRejection}>
                        {isSubmittingRejection ? (
                          <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Processing...</>
                        ) : (
                          <><FontAwesomeIcon icon={faBan} className="me-2" />Confirm Rejection</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Controls: Search & Refresh */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '15px', background: 'rgba(255,255,255,0.7)' }}>
              <div className="card-body p-3">
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-transparent border-end-0 text-primary"><FontAwesomeIcon icon={faSearch}/></span>
                      <input type="text" className="form-control border-start-0" placeholder="Search by name, ID, owner, or reason..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ borderRadius: '0 50px 50px 0' }}/>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <button className="btn btn-outline-primary btn-lg d-flex align-items-center ms-md-auto" onClick={() => {fetchRejectedBoats(); if(showForm) fetchSelectableBoats();}} title="Refresh data" style={{ borderRadius: '50px' }}>
                      <FontAwesomeIcon icon={faSync} className="me-2" /><span className="">Refresh List</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejected Boats Table - Enhanced */}
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.9)' }}>
              <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center border-bottom-0">
                <h4 className="mb-0 fw-bold text-primary"><FontAwesomeIcon icon={faClipboardList} className="me-2" />Official Rejected Vessels Log</h4>
                <span className="badge bg-danger rounded-pill fs-6 px-3 py-2 shadow-sm">{filteredAndSortedBoats.length} {filteredAndSortedBoats.length === 1 ? 'Entry' : 'Entries'}</span>
              </div>
              {loading ? (
                <div className="card-body text-center py-5">
                  <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary mb-3"/>
                  <p className="h5 text-muted">Loading registry data...</p>
                </div>
              ) : filteredAndSortedBoats.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{fontSize: '0.95rem'}}>
                    <thead className="table-light">
                      <tr style={{borderTop: 'none'}}>
                        {[{label: 'Vessel Name', field: 'name', icon: faShip}, {label: 'Vessel ID', field: 'nic', icon: faIdCard}, {label: 'Owner', field: 'ownerName', icon: faUser}, {label: 'Reason', field: 'reason', icon: faCommentAlt, sortable: false}, {label: 'Rejected On', field: 'rejectedAt', icon: faCalendarAlt}].map(col => (
                          <th key={col.field} style={{cursor: col.sortable !== false ? 'pointer' : 'default', borderTop: 'none', verticalAlign: 'middle' }} onClick={() => col.sortable !== false && handleSort(col.field)} className="py-3 px-3">
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={col.icon} className="me-2 text-primary" /> {col.label}
                              {col.sortable !== false && <FontAwesomeIcon icon={faSort} className={`ms-2 ${sortField === col.field ? 'text-primary' : 'text-muted'}`}/>}
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center" style={{verticalAlign: 'middle'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedBoats.map((boat, index) => (
                        <tr key={boat.id} style={{ backgroundColor: getWaterColor(index) }}>
                          <td className="align-middle px-3 py-3">
                            <div className="fw-bold text-dark-emphasis" style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={boat.name}>{boat.name || 'N/A'}</div>
                            {boat.serialNumber && <small className="text-muted d-block">S/N: {boat.serialNumber}</small>}
                          </td>
                          <td className="align-middle px-3"><span className="badge bg-secondary-subtle text-secondary-emphasis p-2">{boat.nic || 'N/A'}</span></td>
                          <td className="align-middle px-3">
                            <div style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={boat.ownerName}>{boat.ownerName || 'N/A'}</div>
                            {boat.email && (<small className="text-muted d-block text-truncate"><FontAwesomeIcon icon={faEnvelope} className="me-1" />{boat.email}</small>)}
                          </td>
                          <td className="align-middle px-3">
                            <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={boat.reason}>{boat.reason || 'No reason specified'}</div>
                          </td>
                          <td className="align-middle px-3"><FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />{formatDate(boat.rejectedAt)}</td>
                          <td className="align-middle text-center px-3">
                            <div className="btn-group">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleEmailBoatOwner(boat)} disabled={!boat.email} title={boat.email ? "Email Owner" : "No email for owner"} style={{ borderRadius: '50px 0 0 50px' }}><FontAwesomeIcon icon={faPaperPlane} /></button>
                                <button className="btn btn-sm btn-outline-info" title="View Full Details" onClick={() => setSelectedBoatForModal(boat)} data-bs-toggle="modal" data-bs-target="#detailsModal"><FontAwesomeIcon icon={faEye} /></button>
                                <button className="btn btn-sm btn-outline-warning" title="Undo Rejection / Re-evaluate" onClick={() => handleOpenUndoModal(boat)} style={{ borderRadius: '0 50px 50px 0' }}><FontAwesomeIcon icon={faUndo} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body text-center py-5">
                  <FontAwesomeIcon icon={faSearch} size="4x" className="text-secondary mb-3"/>
                  <h4 className="text-muted">No Rejected Vessels Found</h4>
                  <p className="text-muted">{searchTerm ? "Try adjusting your search terms." : "The registry is currently empty or no vessels match your criteria."}</p>
                </div>
              )}
            </div>

            {/* Modals (Email, Details, Undo Rejection) - Enhanced Look */}
            {/* Email Modal */}
            {showEmailModal && selectedBoatForModal && (
              <div className="modal fade show" style={{display: 'block', backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content shadow-lg" style={{borderRadius: '15px'}}>
                    <div className="modal-header bg-primary text-white border-0">
                      <h5 className="modal-title"><FontAwesomeIcon icon={faPaperPlane} className="me-2" />Compose Email to Vessel Owner</h5>
                      <button type="button" className="btn-close btn-close-white" onClick={() => setShowEmailModal(false)} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4">
                      <div className="mb-3 p-3 bg-light rounded">
                        <p className="mb-1"><strong><FontAwesomeIcon icon={faUser} className="me-2 text-primary"/>To:</strong> {selectedBoatForModal.ownerName} ({selectedBoatForModal.email})</p>
                        <p className="mb-0"><strong><FontAwesomeIcon icon={faShip} className="me-2 text-primary"/>Vessel:</strong> {selectedBoatForModal.name} (ID: {selectedBoatForModal.nic})</p>
                      </div>
                      <div className="form-floating mb-3">
                        <textarea className="form-control" id="emailBody" style={{ height: '250px', borderRadius: '10px' }} value={emailBody} onChange={(e) => setEmailBody(e.target.value)}></textarea>
                        <label htmlFor="emailBody">Email Content</label>
                      </div>
                      <div className="alert alert-info d-flex align-items-center mt-3" role="alert">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 flex-shrink-0" />
                        <div>This action will attempt to open your default email application.</div>
                      </div>
                    </div>
                    <div className="modal-footer border-0">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEmailModal(false)} style={{borderRadius: '50px'}}>Cancel</button>
                      <button type="button" className="btn btn-primary" onClick={handleSendEmail} style={{borderRadius: '50px'}}><FontAwesomeIcon icon={faPaperPlane} className="me-2"/>Open in Email Client</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Modal */}
            {selectedBoatForModal && (
              <div className="modal fade" id="detailsModal" tabIndex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true" data-bs-backdrop="static">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                  <div className="modal-content shadow-lg" style={{borderRadius: '15px'}}>
                    <div className="modal-header bg-info text-white border-0">
                      <h5 className="modal-title" id="detailsModalLabel"><FontAwesomeIcon icon={faShip} className="me-2" />Vessel Details & Rejection Record</h5>
                      <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onClick={() => setSelectedBoatForModal(null)}></button>
                    </div>
                    <div className="modal-body p-4">
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <div className="card h-100 shadow-sm" style={cardStyle}>
                            <div className="card-header bg-primary-subtle text-primary-emphasis fw-bold"><FontAwesomeIcon icon={faShip} className="me-2"/>Vessel Information</div>
                            <div className="card-body">
                              <dl className="row mb-0">
                                <dt className="col-sm-4">Name:</dt><dd className="col-sm-8">{selectedBoatForModal.name || 'N/A'}</dd>
                                <dt className="col-sm-4">ID/NIC:</dt><dd className="col-sm-8"><span className="badge bg-secondary">{selectedBoatForModal.nic || 'N/A'}</span></dd>
                                <dt className="col-sm-4">Serial No.:</dt><dd className="col-sm-8">{selectedBoatForModal.serialNumber || 'N/A'}</dd>
                                <dt className="col-sm-4">Year:</dt><dd className="col-sm-8">{selectedBoatForModal.year || 'N/A'}</dd>
                                <dt className="col-sm-4">Status:</dt><dd className="col-sm-8"><span className="badge bg-danger fs-6">{selectedBoatForModal.status}</span></dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="card h-100 shadow-sm" style={cardStyle}>
                            <div className="card-header bg-primary-subtle text-primary-emphasis fw-bold"><FontAwesomeIcon icon={faUser} className="me-2"/>Owner Information</div>
                            <div className="card-body">
                              <dl className="row mb-0">
                                <dt className="col-sm-4">Name:</dt><dd className="col-sm-8">{selectedBoatForModal.ownerName || 'N/A'}</dd>
                                <dt className="col-sm-4">Email:</dt><dd className="col-sm-8">{selectedBoatForModal.email ? <a href={`mailto:${selectedBoatForModal.email}`} className="text-decoration-none"><FontAwesomeIcon icon={faEnvelope} className="me-1"/>{selectedBoatForModal.email}</a> : 'N/A'}</dd>
                                <dt className="col-sm-4">Rejected On:</dt><dd className="col-sm-8"><FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted"/>{formatDate(selectedBoatForModal.rejectedAt)}</dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="card shadow-sm" style={cardStyle}>
                            <div className="card-header bg-danger-subtle text-danger-emphasis fw-bold"><FontAwesomeIcon icon={faCommentAlt} className="me-2"/>Reason for Rejection</div>
                            <div className="card-body">
                              <p className="mb-0" style={{whiteSpace: 'pre-wrap', fontSize:'1.1rem'}}>{selectedBoatForModal.reason || 'No specific reason provided.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer border-0">
                      <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={() => setSelectedBoatForModal(null)} style={{borderRadius: '50px'}}>Close</button>
                      {selectedBoatForModal.email && (
                        <button type="button" className="btn btn-primary" style={{borderRadius: '50px'}} onClick={() => {
                          const tempSelected = { ...selectedBoatForModal };
                          const detailsModalElement = document.getElementById('detailsModal');
                          if (detailsModalElement) {
                            const modal = window.bootstrap.Modal.getInstance(detailsModalElement); // Get Bootstrap Modal instance
                            if (modal) modal.hide(); // Hide the modal
                          }
                          // Ensure modal is hidden before opening new one
                          setTimeout(() => handleEmailBoatOwner(tempSelected), 300); // Adjusted delay
                        }}>
                          <FontAwesomeIcon icon={faPaperPlane} className="me-2" />Email Owner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Undo Rejection Modal */}
            {showUndoModal && boatToUndo && (
              <div className="modal fade show" style={{display: 'block', backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content shadow-lg" style={{borderRadius: '15px'}}>
                    <div className="modal-header bg-warning text-dark border-0">
                      <h5 className="modal-title"><FontAwesomeIcon icon={faUndo} className="me-2" />Undo Rejection / Re-evaluate</h5>
                      <button type="button" className="btn-close" onClick={() => setShowUndoModal(false)} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4">
                      <p>Are you sure you want to undo the rejection for vessel <strong>"{boatToUndo.name}"</strong> (ID: {boatToUndo.nic})?</p>
                      <p>This action will typically set the status to <strong>"{PENDING_STATUS}"</strong> and clear the rejection reason and date. This vessel will no longer appear in the rejected list.</p>
                      {/* Optional: Add a field for "Reason for undoing" */}
                    </div>
                    <div className="modal-footer border-0">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowUndoModal(false)} disabled={isUndoing} style={{borderRadius: '50px'}}>Cancel</button>
                      <button type="button" className="btn btn-warning text-dark" onClick={handleUndoRejection} disabled={isUndoing} style={{borderRadius: '50px'}}>
                        {isUndoing ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Processing...</> : <><FontAwesomeIcon icon={faUndo} className="me-2" />Confirm Undo</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Wave Decoration - Mirrored */}
          <div style={{ width: '100%', height: '50px', overflow: 'hidden', borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px', position: 'relative', marginTop: 'auto' }}>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, left: 0, zIndex: 1, transform: 'scaleY(-1)' }}>
              <path d="M0.00,49.98 C150.00,120.00 270.00,-20.00 500.00,49.98 L500.00,0.00 L0.00,0.00 Z" style={{ stroke: 'none', fill: 'rgba(0, 119, 182, 0.6)' }} />
            </svg>
             <svg viewBox="0 0 500 80" preserveAspectRatio="none" style={{ height: '100%', width: '100%', position: 'absolute', bottom: '5px', left: 0, zIndex: 0, transform: 'scaleY(-1)' }}>
              <path d="M0.00,52.98 C180.00,100.00 320.00,0.00 500.00,55.98 L500.00,0.00 L0.00,0.00 Z" style={{ stroke: 'none', fill: 'rgba(3, 4, 94, 0.4)' }} />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default RejectBoat;