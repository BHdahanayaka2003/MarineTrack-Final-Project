import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged,signOut } from "firebase/auth";
import { Dropdown } from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import profileImage from "./profile.png";
import logoImage from "./logo.png";
import backgroundImage from "./background.jpeg";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState("Administrator");
  const [loading, setLoading] = useState(true);

  // Check auth state when component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Use email from location state if available, otherwise from auth
        const email = location.state?.userEmail || user.email;
        setUserEmail(email);
      } else {
        // If no user is logged in, redirect to login
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.state]);

  const handleLogout = () => {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          navigate('/'); // Redirect to login page after logout
        })
        .catch((error) => {
          console.error("Error during logout:", error);
        });
    };

  const buttons = [
    { 
      label: "Boat Register", 
      color: "warning", 
      path: "/BoatRegister",
      icon: "bi-ship",
      description: "Register new boats in the system"
    },
    { 
      label: "Display Boat Owners", 
      color: "danger", 
      path: "/BoatOwnerDetails",
      icon: "bi-people-fill",
      description: "View and manage boat owner information"
    },
    { 
      label: "Handle Fisherman ID", 
      color: "success", 
      path: "/HandleFishermanID",
      icon: "bi-person-badge",
      description: "Process fisherman identification cards"
    },
    { 
      label: "Remove Register Details", 
      color: "info", 
      path: "/remove-details",
      icon: "bi-trash",
      description: "Delete registration records from database"
    },
    { 
      label: "Owner Register", 
      color: "primary", 
      path: "/BoatOwnerDetails",
      icon: "bi-person-plus",
      description: "Add new boat owners to the system"
    },
    { 
      label: "Rejected Boat Details", 
      color: "danger", 
      path: "/RejectBoat",
      icon: "bi-x-circle",
      description: "View boats that failed registration"
    },
    { 
      label: "Display Fisherman Details", 
      color: "secondary", 
      path: "/FishermanDetails",
      icon: "bi-info-circle",
      description: "Access detailed fisherman records"
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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
        paddingTop: "2rem",
        paddingBottom: "2rem"
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
            </div>
            <h1 className="text-center flex-grow-1 fw-bold text-uppercase d-none d-md-block">
              Dashboard
            </h1>
            <h1 className="text-center fw-bold text-uppercase d-block d-md-none">
              Dashboard
            </h1>
            <div className="d-flex align-items-center">
              <div className="text-end me-3 d-none d-md-block">
                <h6 className="mb-0">{userEmail}</h6>
                <small className="text-muted">Online</small>
              </div>
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="link" 
                  id="user-dropdown"
                  className="d-flex align-items-center">
                    <img 
                       src={profileImage} 
                       alt="User" 
                       width="50" 
                       height="50" 
                       className="rounded-circle border border-3 border-primary" 
                    />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                <Dropdown.Item onClick={() => navigate("/officerProfileEdit")}>
                 Edit Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              
            </div>
          </div>

          <div className="row g-4">
            {buttons.map((btn, index) => (
              <div className="col-12 col-md-6 col-lg-4" key={index}>
                <div 
                  className={`card h-100 border-${btn.color} shadow-sm hover-shadow`} 
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className={`card-header bg-${btn.color} bg-opacity-25 text-${btn.color}`}>
                    <div className="d-flex align-items-center">
                      <i className={`${btn.icon} fs-4 me-2`}></i>
                      <h5 className="mb-0">{btn.label}</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3 small">{btn.description}</p>
                    <button
                      className={`btn btn-${btn.color} w-100 py-2 fw-semibold rounded-pill`}
                      onClick={() => navigate(btn.path)}
                    >
                      <i className={`${btn.icon} me-2`}></i>
                      Access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-top text-center">
            <p className="text-muted mb-0 small">
              Fisheries Management System • v2.1.0 • © 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;