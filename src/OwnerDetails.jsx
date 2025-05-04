import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
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
          setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
        }
      } catch (err) {
        console.error("Error fetching owner data:", err);
        setError("Failed to load owner details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerData();
  }, [receivedOwner, navigate]);

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
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!owner?.id) {
        setError("Cannot save: Missing owner ID");
        return;
      }

      // Update document in Firestore
      const ownerRef = doc(db, "boat", owner.id);
      await updateDoc(ownerRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });

      // Update local state
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
      setError("Failed to update owner details. Please try again.");
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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          margin: '20px',
          borderRadius: '20px',
          height: 'calc(100vh - 40px)',
          width: '95%',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3 pb-2 border-bottom border-secondary">
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
        <div className="w-100 px-4 py-3" style={{ flex: 1 }}>
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
                      <p className="form-control-plaintext">{formData.name || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.idNumber || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.phone || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.email || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.address || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.boatName || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.serialNumber || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.year || 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.power ? `${formData.power} HP` : 'Not provided'}</p>
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
                      <p className="form-control-plaintext">{formData.lastInspection || 'Not available'}</p>
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
                    <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
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
                      <label className="form-label">Registration Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
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
        <div className="w-100 px-4 py-3 border-top border-secondary text-center small text-muted">
          <p className="mb-0">
            Fisheries Management System • v2.3.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDetails;