import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";

const BoatRegister = () => {
  const navigate = useNavigate();

  const requests = [
    "User 1 Request",
    "User 2 Request",
    "User 3 Request",
    "User 4 Request",
    "User 5 Request",
  ];

  const handleRequestClick = (request) => {
    navigate("/BoatRegistationPage", { state: { request } });
  };

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      <div
        className="w-100 mx-3 rounded-5"
        style={{
          maxWidth: "1000px",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(5px)",
          padding: "20px",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <img
            src={logoImage}
            alt="Logo"
            width="60"
            height="60"
            className="rounded-circle"
          />
          <h2 className="text-center flex-grow-1 fw-bold m-0">Registration panel</h2>
          <img
            src={profileImage}
            alt="Profile"
            width="60"
            height="60"
            className="rounded-circle"
          />
        </div>

        <div className="d-flex flex-column">
          {requests.map((request, index) => (
            <button
              key={index}
              className="btn btn-secondary text-center fw-semibold py-3 px-2 rounded-pill mb-3 w-100"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "1.2rem",
              }}
              onClick={() => handleRequestClick(request)}
            >
              {request}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoatRegister;
