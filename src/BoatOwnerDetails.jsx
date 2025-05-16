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
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // IMPORTANT: Consider environment variables for API keys
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
        const querySnapshot = await getDocs(collection(db, "boat"));
        
        if (querySnapshot.empty) {
          setBoatOwners([]);
          setIsLoading(false);
          return;
        }
        
        const ownersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const ownerMap = {};
        const boatCountByEmail = {};
        const emailMap = {};
        
        ownersData.forEach(owner => {
          const email = owner.email || owner.id; // Use email as primary key, fallback to doc.id if email is missing
          
          // Initialize emailMap entry if it doesn't exist
          if (!emailMap[email]) {
            emailMap[email] = {
              ...owner, // Spread owner data, this will be refined if multiple boats share an email
              name: owner.name || 'Unnamed Owner',
              email: owner.email || 'No Email Provided', // Ensure email field is populated
              boatName: owner.boatName || 'Unnamed Vessel' // Use the first boat's name as a representative
            };
          }
          
          if (!ownerMap[email]) {
            ownerMap[email] = [];
          }
          
          ownerMap[email].push(owner);
          boatCountByEmail[email] = (boatCountByEmail[email] || 0) + 1;
        });
        
        setBoatOwners(ownersData); // This stores all individual boat documents
        setOwnerBoatCounts(boatCountByEmail);
        setEmailToOwnerMap(emailMap); // This stores unique owners by email
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

  const getUniqueOwnersByEmail = () => {
    const uniqueOwners = Object.values(emailToOwnerMap);
    return uniqueOwners.map(owner => ({
      ...owner,
      name: owner.name || 'Unnamed Owner',
      email: owner.email || 'No Email Provided',
      boatName: owner.boatName || 'Unnamed Vessel'
    }));
  };

  const filteredOwners = viewMode === 'all' 
    ? boatOwners.filter(owner => // In 'all' mode, initially we show unique owners, not all boats
        (owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (owner.serialNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // This search is on all boats
        (owner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : boatOwners.filter(owner => owner.email === selectedEmail); // In 'details' mode, show boats for selected email

  // This list is for the main owners table
  const uniqueFilteredOwners = viewMode === 'all'
    ? getUniqueOwnersByEmail().filter(owner =>
        (owner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (owner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : [emailToOwnerMap[selectedEmail]].filter(Boolean); // Should show details of selected owner, not relevant for this list

  const handleOwnerClick = (boat) => { // Renamed for clarity, as it navigates with boat data
    navigate("/OwnerDetails", { state: { owner: boat } }); // Pass the specific boat document
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

  const secondaryTextStyle = { color: 'rgba(200, 200, 210, 0.75)' };
  // tableHeaderStyle color will be largely handled by table-dark, but fontWeight can remain.
  const tableHeaderStyle = { color: 'rgba(220, 220, 230, 0.9)', fontWeight: '500' };


  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.95)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff',
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(20, 25, 40, 0.8)',
          backdropFilter: 'blur(15px)',
          margin: '20px',
          borderRadius: '20px',
          height: 'calc(100vh - 40px)',
          width: '95%',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header with Navigation */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3 pb-2 border-bottom" style={{borderColor: 'rgba(255, 255, 255, 0.15) !important'}}>
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
            <h4 className="mb-0" style={{ fontWeight: '600', color: '#FFFFFF' }}>Fisheries Management</h4>
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
                style={{ fontSize: '1.2rem', cursor: 'pointer', color: 'rgba(255,255,255,0.9)' }} 
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
              <h2 className="mb-0" style={{color: '#FFFFFF'}}>
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
              {viewMode === 'details' && ownerDetails && (
                <p className="mb-0 mt-1" style={{ color: 'rgba(220, 220, 230, 0.8)' }}>
                  Email: {ownerDetails?.email || 'N/A'} • Total Registered Boats: {ownerBoatCounts[selectedEmail] || 0}
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
                  backgroundColor: 'rgba(0, 0, 0, 0.25)', 
                  color: '#fff',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                }}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="position-absolute"
                style={{
                  top: '50%',
                  left: '20px',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert" style={{backgroundColor: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.4)', color: '#f8d7da'}}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div>{error}</div>
            </div>
          )}

          {viewMode === 'all' && (
            <>
              <div className="row mb-4">
                <div className="col-md-3">
                  <div 
                    className="card border-0 rounded-3 h-100"
                    style={{
                      background: 'rgba(13, 110, 253, 0.15)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(13, 110, 253, 0.2)',
                      border: '1px solid rgba(13, 110, 253, 0.3)'
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h5 className="card-title text-primary" style={{fontWeight: '500'}}>Total Owners</h5>
                        <FontAwesomeIcon icon={faUser} className="text-primary" size="lg" />
                      </div>
                      <h2 className="card-text mt-2" style={{color: '#FFFFFF'}}>{Object.keys(emailToOwnerMap).length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="card border-0 rounded-3 h-100"
                    style={{
                      background: 'rgba(25, 135, 84, 0.15)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(25, 135, 84, 0.2)',
                      border: '1px solid rgba(25, 135, 84, 0.3)'
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h5 className="card-title text-success" style={{fontWeight: '500'}}>Total Boats</h5>
                        <FontAwesomeIcon icon={faShip} className="text-success" size="lg" />
                      </div>
                      <h2 className="card-text mt-2" style={{color: '#FFFFFF'}}>{boatOwners.length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="card border-0 rounded-3 h-100"
                    style={{
                      background: 'rgba(255, 193, 7, 0.15)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)',
                      border: '1px solid rgba(255, 193, 7, 0.3)'
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h5 className="card-title text-warning" style={{fontWeight: '500'}}>Pending</h5>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" size="lg" />
                      </div>
                      <h2 className="card-text mt-2" style={{color: '#FFFFFF'}}>
                        {boatOwners.filter(o => o.status === 'Pending').length}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="card border-0 rounded-3 h-100"
                    style={{
                      background: 'rgba(13, 202, 240, 0.15)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(13, 202, 240, 0.2)',
                      border: '1px solid rgba(13, 202, 240, 0.3)'
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h5 className="card-title text-info" style={{fontWeight: '500'}}>Avg. Boats/Owner</h5>
                        <FontAwesomeIcon icon={faAnchor} className="text-info" size="lg" />
                      </div>
                      <h2 className="card-text mt-2" style={{color: '#FFFFFF'}}>
                        {(boatOwners.length / (Object.keys(emailToOwnerMap).length || 1)).toFixed(1)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4" style={{ 
                backgroundColor: 'rgba(10, 15, 25, 0.65)', // Slightly more opaque card
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)' // Kept border for definition
              }}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ 
                  backgroundColor: 'rgba(15, 20, 30, 0.75)', // Slightly more opaque header
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)' // Kept border
                }}>
                  <h5 className="mb-0" style={{color: 'rgba(230,230,240,0.95)'}}>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Boat Owners
                  </h5>
                  <span className="badge" style={{ 
                    backgroundColor: 'rgba(13, 110, 253, 0.3)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(13, 110, 253, 0.5)',
                    color: '#fff'
                  }}>
                    {uniqueFilteredOwners.length} owners
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    {/* ADDED table-dark CLASS HERE */}
                    <table className="table table-dark table-hover align-middle mb-0">
                      {/* REMOVED inline background style from thead as table-dark handles it */}
                      <thead> 
                        <tr>
                          <th scope="col" className="ps-4" style={tableHeaderStyle}>Owner</th>
                          <th scope="col" style={tableHeaderStyle}>Email</th>
                          <th scope="col" style={tableHeaderStyle}>Contact</th>
                          <th scope="col" style={tableHeaderStyle}>Total Boats</th>
                          <th scope="col" className="pe-4" style={tableHeaderStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4"> {/* table-dark handles text color */}
                              <div className="spinner-border me-2" role="status"> {/* text-light not needed if parent is dark */}
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Loading owner data...
                            </td>
                          </tr>
                        ) : uniqueFilteredOwners.length > 0 ? (
                          uniqueFilteredOwners.map((owner) => (
                            <tr 
                              key={owner.email || owner.id} 
                              // REMOVED borderBottom style as table-dark handles borders
                              style={{ cursor: 'pointer' }} 
                              onClick={() => handleViewBoatsByEmail(owner.email || owner.id)}
                            >
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      background: 'rgba(78, 154, 241, 0.2)', // Kept for accent
                                      backdropFilter: 'blur(5px)',
                                      border: '1px solid rgba(78, 154, 241, 0.4)',
                                      color: '#6badec' 
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faUser} />
                                  </div>
                                  <div>
                                    {/* table-dark handles text color, explicit #FFFFFF might be redundant but harmless */}
                                    <h6 className="mb-0" style={{color: '#FFFFFF'}}>{owner.name || 'Unnamed Owner'}</h6>
                                    <small style={secondaryTextStyle}>{owner.boatName || 'No primary boat'}</small>
                                  </div>
                                </div>
                              </td>
                              {/* table-dark handles text color */}
                              <td>{owner.email || 'No email'}</td>
                              <td>{owner.phone || 'No phone'}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span 
                                    className="badge rounded-pill me-2"
                                    style={{ // Custom badge style kept for accent
                                      background: 'rgba(13, 110, 253, 0.25)',
                                      backdropFilter: 'blur(5px)',
                                      border: '1px solid rgba(13, 110, 253, 0.4)',
                                      color: '#e0e0ff',
                                      padding: '0.35em 0.65em',
                                      fontWeight: '500'
                                    }}
                                  >
                                    {ownerBoatCounts[owner.email || owner.id] || 0}
                                  </span>
                                  <span style={secondaryTextStyle}>registered vessels</span>
                                </div>
                              </td>
                              <td className="pe-4">
                                <button 
                                  className="btn btn-sm"
                                  style={{ // Custom button style kept
                                    background: 'rgba(13, 110, 253, 0.25)',
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(13, 110, 253, 0.45)',
                                    color: '#e0e0ff' 
                                  }}
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
                            <td colSpan="5" className="text-center py-4"> {/* table-dark handles text color */}
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

          {viewMode === 'details' && (
            <div className="card" style={{ 
              backgroundColor: 'rgba(10, 15, 25, 0.65)', 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ 
                backgroundColor: 'rgba(15, 20, 30, 0.75)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h5 className="mb-0" style={{color: 'rgba(230,230,240,0.95)'}}>
                  <FontAwesomeIcon icon={faAnchor} className="me-2" />
                  Registered Vessels
                </h5>
                <span className="badge" style={{ 
                  backgroundColor: 'rgba(13, 110, 253, 0.3)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(13, 110, 253, 0.5)',
                  color: '#fff'
                }}>
                  {filteredOwners.length} boats
                </span>
              </div>
              <div className="card-body p-0">
                <div className="row p-4"> {/* Stats cards remain styled as before */}
                  <div className="col-md-3 mb-4">
                    <div 
                      className="card border-0 rounded-3 h-100"
                      style={{ background: 'rgba(13, 110, 253, 0.15)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(13, 110, 253, 0.2)', border: '1px solid rgba(13, 110, 253, 0.3)' }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-primary mb-0" style={{fontWeight: '500'}}>Total Vessels</h6>
                          <FontAwesomeIcon icon={faShip} className="text-primary" />
                        </div>
                        <h3 className="mt-2" style={{color: '#FFFFFF'}}>{filteredOwners.length}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                     <div 
                      className="card border-0 rounded-3 h-100"
                      style={{ background: 'rgba(25, 135, 84, 0.15)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(25, 135, 84, 0.2)', border: '1px solid rgba(25, 135, 84, 0.3)' }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-success mb-0" style={{fontWeight: '500'}}>Approved</h6>
                          <FontAwesomeIcon icon={faShip} className="text-success" />
                        </div>
                        <h3 className="mt-2" style={{color: '#FFFFFF'}}>
                          {filteredOwners.filter(o => o.status === 'Approved').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                    <div 
                      className="card border-0 rounded-3 h-100"
                      style={{ background: 'rgba(255, 193, 7, 0.15)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)', border: '1px solid rgba(255, 193, 7, 0.3)' }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-warning mb-0" style={{fontWeight: '500'}}>Pending</h6>
                          <FontAwesomeIcon icon={faShip} className="text-warning" />
                        </div>
                        <h3 className="mt-2" style={{color: '#FFFFFF'}}>
                          {filteredOwners.filter(o => o.status === 'Pending').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-4">
                    <div 
                      className="card border-0 rounded-3 h-100"
                      style={{ background: 'rgba(220, 53, 69, 0.15)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.3)' }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="card-title text-danger mb-0" style={{fontWeight: '500'}}>Rejected</h6>
                          <FontAwesomeIcon icon={faShip} className="text-danger" />
                        </div>
                        <h3 className="mt-2" style={{color: '#FFFFFF'}}>
                          {filteredOwners.filter(o => o.status === 'Rejected').length}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  {/* ADDED table-dark CLASS HERE */}
                  <table className="table table-dark table-hover align-middle mb-0">
                    {/* REMOVED inline background style from thead */}
                    <thead>
                      <tr>
                        <th scope="col" className="ps-4" style={tableHeaderStyle}>Boat Name</th>
                        <th scope="col" style={tableHeaderStyle}>Serial Number</th>
                        <th scope="col" style={tableHeaderStyle}>Year</th>
                        <th scope="col" style={tableHeaderStyle}>Power</th>
                        <th scope="col" style={tableHeaderStyle}>Status</th>
                        <th scope="col" className="pe-4" style={tableHeaderStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* In details view, 'filteredOwners' now refers to the boats of the selected owner */}
                      {filteredOwners.length > 0 ? (
                        filteredOwners.map((boat) => (
                          <tr 
                            key={boat.id} 
                            // REMOVED borderBottom style
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOwnerClick(boat)} // This passes the specific boat's data
                          >
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                  style={{ // Accent style kept
                                    width: '40px',
                                    height: '40px',
                                    background: 'rgba(78, 154, 241, 0.2)',
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(78, 154, 241, 0.4)',
                                    color: '#6badec'
                                  }}
                                >
                                  <FontAwesomeIcon icon={faShip} />
                                </div>
                                <div>
                                  <h6 className="mb-0" style={{color: '#FFFFFF'}}>{boat.boatName || 'Unnamed Vessel'}</h6>
                                  <small style={secondaryTextStyle}>ID: {boat.id.substring(0, 8)}...</small>
                                </div>
                              </div>
                            </td>
                            {/* table-dark handles text color */}
                            <td>{boat.serialNumber || 'N/A'}</td>
                            <td>{boat.year || 'N/A'}</td>
                            <td>{boat.power ? `${boat.power} HP` : 'N/A'}</td>
                            <td>{getStatusBadge(boat.status)}</td>
                            <td className="pe-4">
                              <button 
                                className="btn btn-sm"
                                style={{ // Custom button style kept
                                  background: 'rgba(13, 110, 253, 0.25)',
                                  backdropFilter: 'blur(5px)',
                                  border: '1px solid rgba(13, 110, 253, 0.45)',
                                  color: '#e0e0ff'
                                }}
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
                          <td colSpan="6" className="text-center py-4"> {/* table-dark handles text color */}
                            {searchTerm && selectedEmail ? 'No matching boats found for this owner with current filter' : 'No boats registered for this owner'}
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
        <div className="w-100 px-4 py-3 border-top text-center small" style={{borderColor: 'rgba(255, 255, 255, 0.15) !important'}}>
          <p className="mb-0" style={{ color: 'rgba(200, 200, 210, 0.7)' }}>
            Fisheries Management System • v2.3.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoatOwnerDetails;