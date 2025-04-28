import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';

const BoatRegistrationPage = () => {
return (
    <div
        className="container-fluid vh-100 d-flex flex-column p-0"
        style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}
    >
        <div className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0">
            <div
                className="card w-50 shadow-lg"
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
                    <img
                        src={logoImage}
                        alt="Logo"
                        style={{ maxWidth: "50px", cursor: "pointer" }}
                        onClick={() => {
                            window.location.href = "/Dashboard";
                        }}
                    />
                    <h2 className="mb-0 text-center flex-grow-1">Boat Registration Form</h2>
                </div>
                <div className="card-body">
                    <form>
                        {[
                            { label: "Name", id: "name", placeholder: "Enter your name" },
                            { label: "ID Number", id: "idNumber", placeholder: "Enter your ID number" },
                            { label: "Phone Number", id: "phoneNumber", placeholder: "Enter your phone number" },
                            { label: "Email", id: "email", placeholder: "Enter your email" },
                            { label: "Address", id: "address", placeholder: "Enter your address" },
                        ].map((field) => (
                            <div className="row mb-3" key={field.id}>
                                <label htmlFor={field.id} className="col-sm-3 col-form-label fw-bold">
                                    {field.label}
                                </label>
                                <div className="col-sm-9">
                                    <div className="input-group">
                                        <span className="input-group-text">:</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id={field.id}
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="mt-4">
                            <h5 className="fw-bold mb-3">Requirements</h5>
                            <h6 className="fw-bold">PDF</h6>
                        </div>

                        <div className="d-flex justify-content-end gap-3 mt-4">
                            <button
                                type="button"
                                className="btn btn-success px-4 py-2"
                                style={{ minWidth: "100px" }}
                                onClick={() => {
                                    const alertBox = document.createElement("div");
                                    alertBox.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3";
                                    alertBox.style.zIndex = "1050";
                                    alertBox.innerText = "Action successful!";
                                    document.body.appendChild(alertBox);
                                    setTimeout(() => alertBox.remove(), 3000);
                                }}
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger px-4 py-2"
                                style={{ minWidth: "100px" }}
                                onClick={() => {
                                    const alertBox = document.createElement("div");
                                    alertBox.className = "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3";
                                    alertBox.style.zIndex = "1050";
                                    alertBox.innerText = "Action denied!";
                                    document.body.appendChild(alertBox);
                                    setTimeout(() => alertBox.remove(), 3000);
                                }}
                            >
                                Deny
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
);
};

export default BoatRegistrationPage;
