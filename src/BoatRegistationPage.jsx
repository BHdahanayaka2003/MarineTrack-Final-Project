import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const BoatRegistrationPage = () => {
    const [boatData, setBoatData] = useState({
        name: "",
        nic: "",
        contact: "",
        email: "",
        address: "",
        boatName: "",
        boatLength: "",
        capacity: "",
        power: "",
        serialNumber: "",
        year: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // The document ID from the URL or props
    const boatDocId = "kSvTGjHIZ8Stb6AoV23y"; // This should ideally come from URL params or props

    useEffect(() => {
        const fetchBoatData = async () => {
            try {
                const boatRef = doc(db, "boat", boatDocId);
                const boatSnap = await getDoc(boatRef);
                
                if (boatSnap.exists()) {
                    setBoatData(boatSnap.data());
                } else {
                    setError("No boat found with this ID");
                }
            } catch (err) {
                setError("Error fetching boat data: " + err.message);
                console.error("Error fetching boat data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBoatData();
    }, [boatDocId]);

    const handleAccept = () => {
        const alertBox = document.createElement("div");
        alertBox.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3";
        alertBox.style.zIndex = "1050";
        alertBox.innerText = "Boat registration accepted!";
        document.body.appendChild(alertBox);
        setTimeout(() => alertBox.remove(), 3000);
    };

    const handleDeny = () => {
        const alertBox = document.createElement("div");
        alertBox.className = "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3";
        alertBox.style.zIndex = "1050";
        alertBox.innerText = "Boat registration denied!";
        document.body.appendChild(alertBox);
        setTimeout(() => alertBox.remove(), 3000);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-5" role="alert">
                {error}
            </div>
        );
    }

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
                        <h2 className="mb-0 text-center flex-grow-1">Boat Registration Details</h2>
                    </div>
                    <div className="card-body">
                        <form>
                            {/* Owner Information Section */}
                            <h5 className="fw-bold mb-3 text-primary">Owner Information</h5>
                            {[
                                { label: "Name", id: "name", value: boatData.name },
                                { label: "NIC Number", id: "nic", value: boatData.nic },
                                { label: "Contact", id: "contact", value: boatData.contact },
                                { label: "Email", id: "email", value: boatData.email },
                                { label: "Address", id: "address", value: boatData.address },
                            ].map((field) => (
                                <div className="row mb-3" key={field.id}>
                                    <label htmlFor={field.id} className="col-sm-3 col-form-label fw-bold">
                                        {field.label}
                                    </label>
                                    <div className="col-sm-9">
                                        <div className="input-group">
                                            <span className="input-group-text">:</span>
                                            <span
                                                className="form-control bg-light"
                                                id={field.id}
                                                style={{ border: "none" }}
                                            >
                                                {field.value}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Boat Information Section */}
                            <h5 className="fw-bold mb-3 mt-4 text-primary">Boat Information</h5>
                            {[
                                { label: "Boat Name", id: "boatName", value: boatData.boatName },
                                { label: "Boat Length", id: "boatLength", value: boatData.boatLength + " feet" },
                                { label: "Capacity", id: "capacity", value: boatData.capacity + " persons" },
                                { label: "Engine Power", id: "power", value: boatData.power + " HP" },
                                { label: "Serial Number", id: "serialNumber", value: boatData.serialNumber },
                                { label: "Year", id: "year", value: boatData.year },
                            ].map((field) => (
                                <div className="row mb-3" key={field.id}>
                                    <label htmlFor={field.id} className="col-sm-3 col-form-label fw-bold">
                                        {field.label}
                                    </label>
                                    <div className="col-sm-9">
                                        <div className="input-group">
                                            <span className="input-group-text">:</span>
                                            <span
                                                className="form-control bg-light"
                                                id={field.id}
                                                style={{ border: "none" }}
                                            >
                                                {field.value}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4">
                                <h5 className="fw-bold mb-3 text-primary">Documentation</h5>
                                <div className="mb-3">
                                    <label className="form-label">Required Documents</label>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-outline-secondary btn-sm">
                                            View Registration PDF
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary btn-sm">
                                            View Owner ID
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-3 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-success px-4 py-2"
                                    style={{ minWidth: "100px" }}
                                    onClick={handleAccept}
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-4 py-2"
                                    style={{ minWidth: "100px" }}
                                    onClick={handleDeny}
                                >
                                    Deny
                                </button>
                            </div>
                            
                            {/* Footer */}
                            <div className="mt-4 pt-3 border-top text-center">
                                <p className="text-muted mb-0 small">
                                    Fisheries Management System • v2.1.0 • © 2025
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoatRegistrationPage;