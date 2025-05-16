import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import profileIcon from './profile.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShip, faUser, faChartLine, faBell, faAnchor, faList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
const db = getFirestore(app);

const BoatOwnerDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [boatOwners, setBoatOwners] = useState([]);
  const [ownerBoatCounts, setOwnerBoatCounts] = useState({});
  const [emailToOwnerMap, setEmailToOwnerMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'details'
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoatData = async () => {
      try {
        setIsLoading(true);
        // Get all documents from the "boat" collection
        const querySnapshot = await getDocs(collection(db, "boat"));
        
        if (querySnapshot.empty) {
          setBoatOwners([]);
          setIsLoading(false);
          return;
        }
        
        // Map the documents to our state format
        const ownersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Process the data to group by email
        const ownerMap = {};
        const boatCountByEmail = {};
        const emailMap = {};
        
        ownersData.forEach(owner => {
          // Use email as the unique identifier
          // Fallback to id if email doesn't exist
          const email = owner.email || owner.id;
          
          // Store the first owner data per email for reference
          if (!emailMap[email]) {
            emailMap[email] = {
              ...owner,
              // Ensure these fields exist
              name: owner.name || 'Unnamed Owner',
              email: owner.email || 'No Email',
              boatName: owner.boatName || 'Unnamed Vessel'
            };
          }
          
          // Group boats by owner email
          if (!ownerMap[email]) {
            ownerMap[email] = [];
          }
          
          ownerMap[email].push(owner);
          boatCountByEmail[email] = (boatCountByEmail[email] || 0) + 1;
        });
        
        // Store all the processed data in state
        setBoatOwners(ownersData);
        setOwnerBoatCounts(boatCountByEmail);
        setEmailToOwnerMap(emailMap);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error fetching boat owners: ", error);
        setError("Failed to load boat owners data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchBoatData();
  }, []);

  // Get a list of unique owners by email
  const getUniqueOwnersByEmail = () => {
    // Create an array from the values of emailToOwnerMap
    const uniqueOwners = Object.values(emailToOwnerMap);
    
    // Return all entries with proper fallbacks
    return uniqueOwners.map(owner => ({
      ...owner,
      name: owner.name || 'Unnamed Owner',
      email: owner.email || 'No Email',
      boatName: owner.boatName || 'Unnamed Vessel'
    }));
  };

  // Filter boat owners based on search term and view mode
  const filteredOwners = viewMode === 'all' 
    ? boatOwners.filter(owner =>
        (owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (owner.serialNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (owner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : boatOwners.filter(owner => owner.email === selectedEmail);

  // Get unique filtered owners for the owners list
  const uniqueFilteredOwners = viewMode === 'all'
    ? getUniqueOwnersByEmail().filter(owner =>
        (owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (owner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : [emailToOwnerMap[selectedEmail]].filter(Boolean); // Filter out null/undefined

  const handleOwnerClick = (owner) => {
    navigate("/OwnerDetails", { state: { owner } });
  };

  const handleViewBoatsByEmail = (email) => {
    setSelectedEmail(email);
    setOwnerDetails(emailToOwnerMap[email]);
    setViewMode('details');
  };

  const handleBackToAllOwners = () => {
    setSelectedEmail(null);
    setOwnerDetails(null);
    setViewMode('all');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge bg-success">Approved</span>;
      case 'Pending':
        return <span className="badge bg-warning text-dark">Pending</span>;
      case 'Rejected':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff',
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(250, 250, 250, 0.10)',
          margin: '20px',
          borderRadius: '20px',
          height: 'calc(100vh - 40px)',
          width: '95%',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header with Navigation */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3 pb-2 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              style={{ 
                width: '50px', 
                height: '50px', 
                cursor: 'pointer',
                marginRight: '15px',
              }}
              onClick={() => navigate("/Dashboard")}
            />
            <h4 className="mb-0" style={{ fontWeight: '600' }}>Fisheries Management</h4>
          </div>

          <div className="d-flex align-items-center">
            <button 
              className="btn btn-sm btn-outline-light mx-2"
              onClick={() => navigate("/Analytics")}
            >
              <FontAwesomeIcon icon={faChartLine} className="me-1" />
              Analytics
            </button>
            <div className="position-relative mx-2">
              <FontAwesomeIcon 
                icon={faBell} 
                style={{ fontSize: '1.2rem', cursor: 'pointer' }} 
              />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
              </span>
            </div>
            <img
              src={profileIcon}
              alt="Profile"
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%',
                cursor: 'pointer',
                marginLeft: '15px'
              }}
              onClick={() => navigate("/Profile")}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-100 px-4 py-3" style={{ flex: 1 }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">
                {viewMode === 'all' ? (
                  <>
                    <FontAwesomeIcon icon={faShip} className="me-2" />
                    Boat Owners Registry
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    {ownerDetails?.name || 'Owner'}'s Fleet
                    <button 
                      className="btn btn-sm btn-outline-light ms-3"
                      onClick={handleBackToAllOwners}
                    >
                      Back to All Owners
                    </button>
                  </>
                )}
              </h2>
              {viewMode === 'details' && (
                <p className="text-muted mb-0 mt-1">
                  Email: {ownerDetails?.email} • Total Registered Boats: {ownerBoatCounts[selectedEmail] || 0}
                </p>
              )}
            </div>
            <div className="w-50 position-relative">
              <input
                type="text"
                className="form-control rounded-pill ps-5 pe-4 border-0"
                placeholder="Search by name, email, or boat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                }}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="position-absolute"
                style={{
                  top: '50%',
                  left: '20px',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div>{error}</div>
            </div>
          )}

          {viewMode === 'all' && (
            <>
              {/* Stats Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 rounded-3 h-100">
                    <div className="card-body">
                      <h5 className="card-title text-primary">Total Owners</h5>
                      <h2 className="card-text">{Object.keys(emailToOwnerMap).length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success bg-opacity-10 border-success border-opacity-25 rounded-3 h-100">
                    <div className="card-body">
                      <h5 className="card-title text-success">Total Boats</h5>
                      <h2 className="card-text">{boatOwners.length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25 rounded-3 h-100">
                    <div className="card-body">
                      <h5 className="card-title text-warning">Pending</h5>
                      <h2 className="card-text">
                        {boatOwners.filter(o => o.status === 'Pending').length}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info bg-opacity-10 border-info border-opacity-25 rounded-3 h-100">
                    <div className="card-body">
                      <h5 className="card-title text-info">Avg. Boats/Owner</h5>
                      <h2 className="card-text">
                        {(boatOwners.length / (Object.keys(emailToOwnerMap).length || 1)).toFixed(1)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unique Owners Table */}
              <div className="card mb-4" style={{ 
                backgroundColor: 'rgba(250, 243, 243, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Boat Owners
                  </h5>
                  <span className="badge bg-primary">{uniqueFilteredOwners.length} owners</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                        <tr>
                          <th scope="col" className="ps-4">Owner</th>
                          <th scope="col">Email</th>
                          <th scope="col">Contact</th>
                          <th scope="col">Total Boats</th>
                          <th scope="col" className="pe-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <div className="spinner-border text-light me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Loading owner data...
                            </td>
                          </tr>
                        ) : uniqueFilteredOwners.length > 0 ? (
                          uniqueFilteredOwners.map((owner) => (
                            <tr 
                              key={owner.email || owner.id} 
                              style={{ 
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                              }}
                              onClick={() => handleViewBoatsByEmail(owner.email || owner.id)}
                            >
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      backgroundColor: 'rgba(78, 154, 241, 0.2)',
                                      color: '#4e9af1'
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faUser} />
                                  </div>
                                  <div>
                                    <h6 className="mb-0">{owner.name || 'Unnamed Owner'}</h6>
                                    <small className="text-muted">{owner.boatName || 'No primary boat'}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{owner.email || 'No email'}</td>
                              <td>{owner.phone || 'No phone'}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className="badge bg-primary rounded-pill me-2">
                                    {ownerBoatCounts[owner.email || owner.id] || 0}
                                  </span>
                                  <span>registered vessels</span>
                                </div>
                              </td>
                              <td className="pe-4">
                                <button 
                                  className="btn btn-sm btn-primary me-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewBoatsByEmail(owner.email || owner.id);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faList} className="me-1" />
                                  View Fleet
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              {searchTerm ? 'No matching owners found' : 'No boat owners registered'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Owner's Boats List when in details view */}
          {viewMode === 'details' && (
            <div className="card" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faAnchor} className="me-2" />
                  Registered Vessels
                </h5>
                <span className="badge bg-primary">{filteredOwners.length} boats</span>
              </div>
              <div className="card-body p-0">
                <div className="row p-4">
                  <div className="col-md-3 mb-4">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 rounded-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-primary mb-0">Total Vessels</h6>
                          <FontAwesomeIcon icon={faShip} className="text-primary" />
                        </div>
                        <h3 className="mt-2">{filteredOwners.length}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25 rounded-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-success mb-0">Approved</h6>
                          <FontAwesomeIcon icon={faShip} className="text-success" />
                        </div>
                        <h3 className="mt-2">
                          {filteredOwners.filter(o => o.status === 'Approved').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                    <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25 rounded-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-warning mb-0">Pending</h6>
                          <FontAwesomeIcon icon={faShip} className="text-warning" />
                        </div>
                        <h3 className="mt-2">
                          {filteredOwners.filter(o => o.status === 'Pending').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                    <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25 rounded-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-danger mb-0">Rejected</h6>
                          <FontAwesomeIcon icon={faShip} className="text-danger" />
                        </div>
                        <h3 className="mt-2">
                          {filteredOwners.filter(o => o.status === 'Rejected').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                      <tr>
                        <th scope="col" className="ps-4">Boat Name</th>
                        <th scope="col">Serial Number</th>
                        <th scope="col">Year</th>
                        <th scope="col">Power</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOwners.length > 0 ? (
                        filteredOwners.map((boat) => (
                          <tr 
                            key={boat.id} 
                            style={{ 
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                            onClick={() => handleOwnerClick(boat)}
                          >
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: 'rgba(78, 154, 241, 0.2)',
                                    color: '#4e9af1'
                                  }}
                                >
                                  <FontAwesomeIcon icon={faShip} />
                                </div>
                                <div>
                                  <h6 className="mb-0">{boat.boatName || 'Unnamed Vessel'}</h6>
                                  <small className="text-muted">ID: {boat.id.substring(0, 8)}...</small>
                                </div>
                              </div>
                            </td>
                            <td>{boat.serialNumber || 'N/A'}</td>
                            <td>{boat.year || 'N/A'}</td>
                            <td>{boat.power ? `${boat.power} HP` : 'N/A'}</td>
                            <td>{getStatusBadge(boat.status)}</td>
                            <td className="pe-4">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOwnerClick(boat);
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            {searchTerm ? 'No matching boats found' : 'No boats registered for this owner'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-100 px-4 py-3 border-top border-secondary text-center small text-muted">
          <p className="mb-0">
            Fisheries Management System • v2.3.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoatOwnerDetails;