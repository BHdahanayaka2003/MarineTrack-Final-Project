import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg'; // Make sure this path is correct
import logoImage from './logo.png'; // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShip,
  faUser,
  faIdCard,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faEdit,
  faSave,
  faArrowLeft,
  faCalendarAlt,
  faTachometerAlt,
  faAnchor,
  faFileAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

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

const OwnerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const receivedOwner = location.state?.owner;

  const [owner, setOwner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    boatName: '',
    serialNumber: '',
    year: '',
    power: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    status: '',
    requirements: '',
    lastInspection: '',
    registrationDate: ''
  });

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (receivedOwner) {
          // If we have owner data from navigation state
          setOwner(receivedOwner);
          setFormData({
            name: receivedOwner.name || '',
            boatName: receivedOwner.boatName || '',
            serialNumber: receivedOwner.serialNumber || '',
            year: receivedOwner.year || '',
            power: receivedOwner.power || '',
            email: receivedOwner.email || '',
            phone: receivedOwner.phone || '',
            address: receivedOwner.address || '',
            idNumber: receivedOwner.idNumber || '',
            status: receivedOwner.status || 'Pending',
            requirements: receivedOwner.requirements || '',
            lastInspection: receivedOwner.lastInspection || '',
            registrationDate: receivedOwner.registrationDate || ''
          });
        } else {
          // If no data is passed, redirect back to the owners list
          setError("No owner data received. Redirecting to owners list...");
          // Fetch data from Firestore using ID if available in URL params?
          // For now, stick to the original logic and redirect
          setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
        }
      } catch (err) {
        console.error("Error fetching owner data:", err);
        setError("Failed to load owner details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Consider fetching data by ID if receivedOwner is null but an ID is in the URL
    // This makes the page bookmarkable or refreshable.
    // For now, we'll stick to the state-based approach as per the original code,
    // but fetching by ID would be a good enhancement.
    // Example: const { ownerId } = useParams();
    // if (ownerId && !receivedOwner) { fetch by ownerId } else if (receivedOwner) { use receivedOwner } else { redirect }
    fetchOwnerData();
  }, [receivedOwner, navigate]); // Added navigate to dependency array

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If currently editing, then save changes
      handleSave();
    } else {
      // Start editing
      setIsEditing(true);
      // Optional: Reset formData to owner's current state before editing
      // setFormData({ ...owner });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null); // Clear previous success message

      if (!owner?.id) {
        setError("Cannot save: Missing owner ID");
        setIsSaving(false); // Stop saving state
        return;
      }

      // Check for any required fields if necessary before saving
      // Example: if (!formData.name || !formData.boatName) { setError("Name and Boat Name are required."); setIsSaving(false); return; }

      // Update document in Firestore
      const ownerRef = doc(db, "boat", owner.id); // Assuming collection is "boat" and id is stored in owner.id
      await updateDoc(ownerRef, {
        ...formData,
        updatedAt: new Date().toISOString() // Add an updated timestamp
      });

      // Update local state with the saved data
      setOwner({
        ...owner,
        ...formData
      });

      setIsEditing(false);
      setSuccess("Owner details updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating owner:", err);
      setError("Failed to update owner details. Please try again. " + err.message); // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#000' }}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2 text-light">Loading owner details...</span>
      </div>
    );
  }

   // Handle case where owner data was expected but not found/received
   if (!owner && !isLoading && !error) {
       // This handles the case where receivedOwner was null and the timeout hasn't redirected yet
       // Or if there's another unexpected state.
       // The useEffect should handle the redirect, but this provides a visual fallback.
        return (
            <div className="d-flex justify-content-center align-items-center text-light" style={{ height: '100vh', background: '#000' }}>
                No owner data available. Redirecting...
            </div>
        );
   }


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
        color: '#fff', // Base text color is white
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          margin: '20px',
          borderRadius: '20px',
          height: 'calc(100vh - 40px)',
          width: '95%',
          overflowY: 'auto', // Use overflowY for vertical scrolling
          overflowX: 'hidden', // Hide horizontal overflow
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          // Added padding bottom to ensure content isn't hidden by footer
          paddingBottom: '20px'
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3 pb-2 border-bottom border-secondary"
             style={{ flexShrink: 0 }} // Prevent header from shrinking
        >
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: 'pointer',
                marginRight: '15px',
                border: '2px solid #4e9af1'
              }}
              onClick={() => navigate("/Dashboard")}
            />
            <h4 className="mb-0" style={{ fontWeight: '600' }}>Fisheries Management</h4>
          </div>

          <button
            className="btn btn-outline-light"
            onClick={() => navigate("/BoatOwnerDetails")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Owners List
          </button>
        </div>

        {/* Main Content */}
        {/* Use flex-grow to make content area fill available space */}
        <div className="w-100 px-4 py-3" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Title Section */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faShip} className="me-2" />
                Boat & Owner Details
              </h2>
              <p className="text-muted mb-0">
                View and manage detailed information for this registration
              </p>
            </div>
            <button
              className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
              onClick={handleEditToggle}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="me-2" />
                  {isEditing ? 'Save Changes' : 'Edit Details'}
                </>
              )}
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span className={`badge ${getStatusClass(formData.status)} fs-6 px-3 py-2`}>
              Status: {formData.status || 'Pending'}
            </span>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faSave} className="me-2" />
              <div>{success}</div>
            </div>
          )}

          {/* Details Cards */}
          <div className="row">
            {/* Owner Information Card */}
            <div className="col-md-6 mb-4">
              <div className="card h-100" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  <h5 className="mb-0">Owner Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faIdCard} className="me-2" />
                      ID Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.idNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.address || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boat Information Card */}
            <div className="col-md-6 mb-4">
              <div className="card h-100" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                  <h5 className="mb-0">Vessel Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faAnchor} className="me-2" />
                      Boat Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="boatName"
                        value={formData.boatName}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.boatName || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faIdCard} className="me-2" />
                      Serial Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                       // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.serialNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Year of Manufacture
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.year || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                      Engine Power (HP)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="power"
                        value={formData.power}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.power ? `${formData.power} HP` : 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Last Inspection Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control"
                        name="lastInspection"
                        value={formData.lastInspection}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      // FIX: Add style={{ color: '#fff' }} to ensure text is white
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.lastInspection || 'Not available'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Card */}
            <div className="col-12 mb-4">
              <div className="card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                  <h5 className="mb-0">Additional Requirements & Notes</h5>
                </div>
                <div className="card-body">
                  {isEditing ? (
                    <textarea
                      className="form-control"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Enter any additional requirements or notes..."
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  ) : (
                    // FIX: Add style={{ color: '#fff' }} to ensure text is white
                    <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#fff' }}>
                      {formData.requirements || 'No additional requirements or notes specified.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Control (Only shown when editing) */}
            {isEditing && (
              <div className="col-md-6 mb-4">
                <div className="card" style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}>
                  <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                    <h5 className="mb-0">Update Registration Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label text-muted">Registration Status</label> {/* Added text-muted */}
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff', // Ensure dropdown text is white
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          // Added arrow color fix for some browsers if needed (optional)
                          // '-webkit-appearance': 'none',
                          // 'appearance': 'none',
                          // backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")',
                          // backgroundRepeat: 'no-repeat',
                          // backgroundPosition: 'right .75rem center',
                          // backgroundSize: '16px 12px',
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {/* Use flex-shrink to prevent footer from growing */}
        <div className="w-100 px-4 py-3 border-top border-secondary text-center small text-muted"
             style={{ flexShrink: 0 }}
        >
          <p className="mb-0">
            Fisheries Management System • v2.3.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDetails;