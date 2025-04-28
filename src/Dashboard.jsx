import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import profileImage from "./profile.png";
import logoImage from "./logo.png";
import backgroundImage from "./background.jpeg";

const Dashboard = () => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Boat Register", color: "warning", path: "/BoatRegister" },
    { label: "Display Boat Owners Details", color: "danger", path: "/display-owners" },
    { label: "Handle Fisherman ID", color: "success", path: "/fisherman-id" },
    { label: "Remove Register Details", color: "info", path: "/remove-details" },
    { label: "Owner Register", color: "primary", path: "/owner-register" },
    { label: "Rejected Boat Details", color: "danger", path: "/rejected-boats" },
    { label: "Display Fisherman Details", color: "secondary", path: "/fisherman-details" },
  ];

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100 vw-100"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="bg-light bg-opacity-75 p-5 rounded-4 w-100" style={{ maxWidth: "1200px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <img src={logoImage} alt="Logo" width="50" height="50" />
          <h1 className="text-center flex-grow-1 fw-bold">Dashboard</h1>
          <img src={profileImage} alt="User" width="50" height="50" className="rounded-circle" />
        </div>
        <div className="row g-4">
          {buttons.map((btn, index) => (
            <div className="col-12 col-md-4" key={index}>
              <button
                className={`btn btn-${btn.color} w-100 py-3 fw-semibold rounded-pill`}
                onClick={() => navigate(btn.path)}
              >
                {btn.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
