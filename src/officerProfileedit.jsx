import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Modal, Spinner } from "react-bootstrap";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // IMPORTANT: Use environment variables for API keys
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase (only once)
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const db = getFirestore();

const OfficerProfileEdit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    position: "",
    nic: "",
    address: "",
    password: "",
  });
  const [docId, setDocId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Custom CSS for modern look and feel
  const ModernStyles = () => (
    <style>{`
      body {
        font-family: 'Poppins', sans-serif; // Example: Using Poppins font
      }
      .form-container-modern {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        border-radius: 1rem; // 16px
        border: 1px solid rgba(209, 213, 219, 0.3);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
      }
      .form-label-modern {
        font-weight: 600;
        color: #343a40; /* Darker grey for labels */
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .form-control-modern {
        border-radius: 0.5rem; /* 8px */
        padding: 0.8rem 1rem;
        font-size: 1rem;
        border: 1px solid #ced4da;
        transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      }
      .form-control-modern:focus {
        border-color: #0d6efd; /* Bootstrap primary blue */
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        background-color: #fff;
      }
      .input-group-text-modern {
        border-top-right-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        background-color: #e9ecef;
        border-left: 0;
      }
      .btn-modern-submit {
        background-image: linear-gradient(to right, #28a745 0%, #218838 51%, #1e7e34 100%);
        color: white;
        transition: 0.5s;
        background-size: 200% auto;
        border: none;
      }
      .btn-modern-submit:hover {
        background-position: right center; /* change the direction of the change here */
        color: #fff;
        text-decoration: none;
      }
      .page-header-title {
        font-weight: 700;
        color: #2c3e50; /* A deep slate blue */
      }
      .alert-modern {
        border-radius: 0.5rem;
        padding: 1rem 1.25rem;
      }
      .modal-modern .modal-content {
        border-radius: 0.75rem;
        border: none;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      }
      .modal-modern .modal-header {
        border-bottom: none;
        padding: 1.5rem 1.5rem 0.5rem;
      }
      .modal-modern .modal-header .modal-title {
        font-weight: 600;
      }
      .modal-modern .modal-body {
        padding: 1rem 1.5rem 2rem;
      }
      .loading-overlay {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(5px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        text-align: center;
      }
      .loading-overlay img {
        animation: pulseLogo 1.5s infinite ease-in-out;
      }
      @keyframes pulseLogo {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      .spinner-grow-modern {
        width: 4rem;
        height: 4rem;
        color: #0d6efd; /* Bootstrap primary blue */
      }
    `}</style>
  );
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setUserEmail(user.email);
          console.log("Current user email:", user.email);
          console.log("Current user uid:", user.uid);
          
          // FIXED: Correctly access the officers collection by its proper name
          const officersRef = collection(db, "officers");
          
          // First try: Exact match on document ID
          const exactDocRef = doc(db, "officers", "9bV83dEICotGQSYAIFZj");
          
          // First, try exact document fetch by ID seen in the Firestore
          try {
            const exactDocSnapshot = await getDocs(query(officersRef, where("__name__", "==", "9bV83dEICotGQSYAIFZj")));
            if (!exactDocSnapshot.empty) {
              const docSnap = exactDocSnapshot.docs[0];
              handleOfficerData(docSnap);
              return;
            }
          } catch (err) {
            console.log("No exact document match, continuing with uid search");
          }
          
          // FIXED: Try to find officer by UID
          let q = query(officersRef, where("uid", "==", user.uid));
          let querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.log("No uid match, trying email");
            // Try by email if uid match fails
            q = query(officersRef, where("email", "==", user.email));
            querySnapshot = await getDocs(q);
          }
          
          if (querySnapshot.empty) {
            console.log("No direct match found, checking all documents");
            // Fallback to retrieving all documents (only recommended for small collections)
            const allDocsSnapshot = await getDocs(officersRef);
            console.log("Total officers found:", allDocsSnapshot.docs.length);
            
            // Log all document IDs for debugging
            allDocsSnapshot.docs.forEach(doc => {
              console.log("Document ID:", doc.id, "Data:", doc.data());
            });
            
            // Check if we have any documents matching either uid or email
            const foundDoc = allDocsSnapshot.docs.find(doc => {
              const data = doc.data();
              return (data.email && data.email.toLowerCase() === user.email.toLowerCase()) || 
                     (data.uid && data.uid === user.uid);
            });
            
            if (foundDoc) {
              handleOfficerData(foundDoc);
            } else {
              setError("Officer data not found. Please contact an administrator or ensure your profile is correctly set up.");
              setLoading(false);
            }
          } else {
            // We found a match with either uid or email query
            handleOfficerData(querySnapshot.docs[0]);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to fetch profile: " + err.message);
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);
  
  // Helper function to set officer data from document snapshot
  const handleOfficerData = (docSnap) => {
    const officer = docSnap.data();
    console.log("Found officer data:", officer);

    setFormData({
      name: officer.name || "",
      phone: officer.phone || "",
      position: officer.position || "",
      nic: officer.nic || "",
      address: officer.address || "",
      password: "",
    });

    setDocId(docSnap.id);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setModalMessage("");
    setSaving(true);

    const user = auth.currentUser;
    if (!user || !docId) {
      setError("User not authenticated or document not found. Please re-login.");
      setSaving(false);
      return;
    }

    try {
      const { name, phone, position, nic, address, password } = formData;

      // Basic validation (can be expanded)
      if (!name || !phone || !position || !nic || !address) {
        setError("All fields except password are required.");
        setSaving(false);
        return;
      }

      const docRef = doc(db, "officers", docId);
      await updateDoc(docRef, {
        name,
        phone,
        position,
        nic,
        address,
        updatedAt: new Date().toISOString(),
      });

      if (password.trim() !== "") {
        if (password.length < 6) {
            setError("New password must be at least 6 characters long.");
            setSaving(false);
            return;
        }
        await updatePassword(user, password);
      }

      setSaving(false);
      setModalMessage("Profile updated successfully!");
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false); // Close modal before navigating
        navigate("/dashboard");
      }, 2500);
    } catch (err) {
      console.error("Error updating profile:", err);
      let errorMessage = "Error updating profile. Please try again.";
      if (err.code === "auth/requires-recent-login") {
        errorMessage = "This operation is sensitive and requires recent authentication. Please log out and log back in to update your password.";
      } else if (err.message) {
        errorMessage = "Error: " + err.message;
      }
      setError(errorMessage);
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <>
        <ModernStyles />
        <div 
            className="min-vh-100 vw-100 d-flex flex-column justify-content-center align-items-center loading-overlay"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
            }}
        >
          <img src={logoImage} alt="Logo" width="100" height="100" className="mb-4" />
          <Spinner animation="grow" variant="primary" className="spinner-grow-modern mb-3" />
          <h4 className="text-primary fw-bold">Loading Your Profile</h4>
          <p className="text-muted fs-5">Just a moment, we're getting things ready...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ModernStyles />
      <div
        className="min-vh-100 vw-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          padding: "2rem 0", // Add vertical padding for smaller screens
        }}
      >
        <div className="container py-4" style={{ maxWidth: "900px" }}>
          <div
            className="form-container-modern p-4 p-md-5"
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-gray-300">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <img
                  src={logoImage}
                  alt="Logo"
                  width="50" 
                  height="50"
                  className="me-3 rounded-circle" // Make logo image circular
                />
                <h2 className="page-header-title mb-0 fs-3">Edit Officer Profile</h2>
              </div>
              <div>
                <button 
                  onClick={handleGoBack} 
                  className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center px-3 py-2"
                >
                  <i className="bi bi-arrow-left-circle me-2 fs-5"></i>Back to Dashboard
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center alert-modern mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                <div>{error}</div>
                <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
              </div>
            )}
            
            {userEmail && (
              <div className="alert alert-info d-flex align-items-center alert-modern mb-4" role="alert">
                <i className="bi bi-person-check-fill me-3 fs-4"></i>
                <div>Editing profile for: <strong>{userEmail}</strong></div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label-modern">
                    <i className="bi bi-person-fill me-2"></i>Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control form-control-modern"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., John Doe"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label-modern">
                    <i className="bi bi-telephone-fill me-2"></i>Phone Number
                  </label>
                  <input
                    type="tel" // Use tel for phone numbers
                    id="phone"
                    name="phone"
                    className="form-control form-control-modern"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="position" className="form-label-modern">
                    <i className="bi bi-briefcase-fill me-2"></i>Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    className="form-control form-control-modern"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Senior Officer"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="nic" className="form-label-modern">
                    <i className="bi bi-card-text me-2"></i>NIC
                  </label>
                  <input
                    type="text"
                    id="nic"
                    name="nic"
                    className="form-control form-control-modern"
                    value={formData.nic}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 123456789V"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label-modern">
                  <i className="bi bi-geo-alt-fill me-2"></i>Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  className="form-control form-control-modern"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full street address, city, and region"
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label-modern">
                  <i className="bi bi-shield-lock-fill me-2"></i>New Password
                </label>
                <div className="input-group">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control form-control-modern"
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} // Adjust for input group
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                  <span className="input-group-text input-group-text-modern text-muted">Optional</span>
                </div>
                <small className="form-text text-muted">Minimum 6 characters. Leave blank if you don't want to change it.</small>
              </div>

              <div className="d-grid gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-lg rounded-pill fw-semibold py-3 btn-modern-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      UPDATING PROFILE...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill me-2"></i>UPDATE PROFILE
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <Modal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            // navigate("/dashboard"); // Optionally navigate immediately on manual close
          }}
          backdrop="static"
          keyboard={false}
          centered
          className="modal-modern"
        >
          <Modal.Header>
            <Modal.Title className="text-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              Success!
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <div className="mb-3">
              <i className="bi bi-patch-check-fill text-success" style={{ fontSize: "4rem" }}></i>
            </div>
            <p className="fs-5 mb-2">{modalMessage}</p>
            <p className="text-muted">You will be redirected to the dashboard shortly.</p>
            <Spinner animation="border" variant="success" size="sm" className="mt-2"/>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default OfficerProfileEdit;