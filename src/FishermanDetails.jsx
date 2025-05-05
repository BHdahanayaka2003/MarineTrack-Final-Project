import React from 'react';
import { Card, Table, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg'; // Background image
import logoImage from './logo.png'; // Add your logo image here (make sure the path is correct)
import { useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";



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

const FishermanDetails = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '100vh',
                width: '100vw',
                margin: 0,
                padding: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Container
                fluid
                className="d-flex justify-content-center align-items-center"
                style={{
                    height: '100%',
                    padding: '20px',
                }}
            >
                <Card
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        width: '100%',
                        maxWidth: '800px',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '15px',
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                        overflow: 'hidden',
                    }}
                >
                    <Card.Body>
                        <div className="d-flex align-items-center mb-4 pb-2 border-bottom" style={{ width: '100%' }}>
                            <img
                                src={logoImage}
                                alt="Logo"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    objectFit: 'contain',
                                    marginRight: '20px',
                                    position: 'absolute',
                                    top: '20px',
                                    left: '20px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/Dashboard')}
                            />
                            <h1 className="m-0 w-100 text-center">Information</h1>
                        </div>
                        <Table borderless responsive>
                            <tbody>
                                <tr>
                                    <td className="fw-bold text-secondary">Name</td>
                                    <td>:</td>
                                    <td>Pabaya</td>
                                    <td className="fw-bold text-secondary">Boat Name</td>
                                    <td>:</td>
                                    <td>Nagula</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">ID Number</td>
                                    <td>:</td>
                                    <td>123456789V</td>
                                    <td className="fw-bold text-secondary">Boat ID</td>
                                    <td>:</td>
                                    <td>CAT 9666</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Fisherman ID</td>
                                    <td>:</td>
                                    <td>1234567</td>
                                    <td className="fw-bold text-secondary">Boat Type</td>
                                    <td>:</td>
                                    <td>Big Boat</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Phone Number</td>
                                    <td>:</td>
                                    <td>+94 0114555587</td>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Email</td>
                                    <td>:</td>
                                    <td>PabaTenison@gmail.com</td>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr>
                                    <td className="fw-bold text-secondary">Address</td>
                                    <td>:</td>
                                    <td>Kubura</td>
                                    <td colSpan="3"></td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* Requirements Card */}
                        <Card className="bg-light mt-3">
                            <Card.Body>
                                <Card.Text className="mb-0">
                                    <strong>Requirements</strong><br />
                                    PDF
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        <div className="d-flex justify-content-center mt-3">
                            <button
                                className="btn btn-success me-3"
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
                                className="btn btn-danger"
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
                                Denied
                            </button>
                        </div>
                    </Card.Body>
                        {/* Footer */}
                        <div className="mt-4 pt-3 border-top text-center">
                        <p className="text-muted mb-0 small">
                        Fisheries Management System • v2.1.0 • © 2025
                        </p>
                    </div>
                </Card>
            </Container>
        </div>
    );
};


export default FishermanDetails;

