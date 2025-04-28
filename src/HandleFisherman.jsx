import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";

const HandleFisherman = () => {
  const requests = [
    "User 1 Request",
    "User 2 Request",
    "User 3 Request",
    "User 4 Request",
    "User 5 Request",
  ];

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
            <div
              key={index}
              className="text-center fw-semibold py-3 px-3 rounded-pill mb-3"
              style={{
                backgroundColor: "#e0e0e0",
                fontFamily: "'Georgia', serif",
                fontSize: "1.2rem",
              }}
            >
              {request}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandleFisherman;
