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
import { Modal } from "react-bootstrap"; // Import Modal from react-bootstrap
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// ✅ Initialize Firebase (only once)
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
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [modalMessage, setModalMessage] = useState("");
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const officersRef = collection(db, "officers");
          const q = query(officersRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const officer = docSnap.data();

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
            setError("Officer data not found.");
          }
        } catch (err) {
          setError("Failed to fetch profile.");
          console.error(err);
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
    setModalMessage(""); // Reset modal message before updating

    const user = auth.currentUser;
    if (!user || !docId) {
      setError("User not authenticated or document not found.");
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
      });

      if (password.trim() !== "") {
        await updatePassword(user, password);
      }

      // Show success modal after profile update
      setModalMessage("Profile updated successfully!");
      setShowModal(true);

      // Navigate to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Error updating profile.");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading profile...</div>;

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
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {["name", "phone", "position", "nic", "address"].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label fw-semibold">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="text"
                  name={field}
                  className="form-control"
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div className="mb-4">
              <label className="form-label fw-semibold">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 rounded-pill fw-semibold py-2"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>

      {/* Modal Popup */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Profile Updated</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
      </Modal>
    </div>
  );
};

export default OfficerProfileEdit;
