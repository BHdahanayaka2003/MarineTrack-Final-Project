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
import { Modal, Spinner } from "react-bootstrap"; // Added Spinner
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
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
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setUserEmail(user.email);
          console.log("Current user email:", user.email);
          
          // First try to match by uid
          let officersRef = collection(db, "officers");
          let q = query(officersRef, where("uid", "==", user.uid));
          let querySnapshot = await getDocs(q);
          
          // If no match by uid, try matching by email
          if (querySnapshot.empty) {
            q = query(officersRef, where("email", "==", user.email));
            querySnapshot = await getDocs(q);
          }
          
          // If still no match, try getting all documents and searching manually
          if (querySnapshot.empty) {
            console.log("No direct match found, checking all documents");
            querySnapshot = await getDocs(collection(db, "officers"));
            
            // Log all documents for debugging
            querySnapshot.forEach(doc => {
              console.log("Document ID:", doc.id, "Data:", doc.data());
            });
          }

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
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
          } else {
            console.error("No officer data found for email:", user.email);
            setError("Officer data not found. Please contact an administrator.");
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to fetch profile: " + err.message);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
    setSaving(true); // Start saving state

    const user = auth.currentUser;
    if (!user || !docId) {
      setError("User not authenticated or document not found.");
      setSaving(false);
      return;
    }

    try {
      const { name, phone, position, nic, address, password } = formData;

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
        await updatePassword(user, password);
      }

      setSaving(false);
      setModalMessage("Profile updated successfully!");
      setShowModal(true);

      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error updating profile: " + err.message);
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        padding: "2rem",
      }}
    >
      <div className="container">
        <div
          className="bg-light bg-opacity-85 p-4 p-md-5 rounded-4 shadow-lg"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <img
                src={logoImage}
                alt="Logo"
                width="60"
                height="60"
                className="me-3"
              />
              <h2 className="fw-bold mb-0">Edit Officer Profile</h2>
            </div>
            <div>
              <button 
                onClick={handleGoBack} 
                className="btn btn-outline-secondary rounded-pill"
              >
                <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          
          {userEmail && (
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle-fill me-2"></i>
              Logged in as: <strong>{userEmail}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-person-fill me-2"></i>Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-lg"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-telephone-fill me-2"></i>Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  className="form-control form-control-lg"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-briefcase-fill me-2"></i>Position
                </label>
                <input
                  type="text"
                  name="position"
                  className="form-control form-control-lg"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  placeholder="Enter your position"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-card-text me-2"></i>NIC
                </label>
                <input
                  type="text"
                  name="nic"
                  className="form-control form-control-lg"
                  value={formData.nic}
                  onChange={handleChange}
                  required
                  placeholder="Enter your NIC number"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="bi bi-geo-alt-fill me-2"></i>Address
              </label>
              <textarea
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Enter your full address"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-key-fill me-2"></i>New Password
              </label>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-lg"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
                <span className="input-group-text bg-light text-muted">Optional</span>
              </div>
              <small className="text-muted">Leave blank to keep your current password</small>
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-success btn-lg rounded-pill fw-semibold py-3"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating Profile...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal Popup */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-check-circle-fill me-2"></i>
            Profile Updated
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
          </div>
          <p className="fs-5">{modalMessage}</p>
          <p className="text-muted">Redirecting to dashboard...</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default OfficerProfileEdit;