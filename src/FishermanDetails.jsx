// src/FishermanDetails.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Container, Spinner, Alert as BootstrapAlert, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import backgroundImage from './background.jpeg'; // Assumes in src/
import logoImage from './logo.png';           // Assumes in src/

import { useNavigate } from 'react-router-dom';

// --- START FIREBASE INITIALIZATION ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg",
    authDomain: "finalproject-4453c.firebaseapp.com",
    projectId: "finalproject-4453c",
    storageBucket: "finalproject-4453c.appspot.com",
    messagingSenderId: "866850090007",
    appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// --- END FIREBASE INITIALIZATION ---

const FishermanDetails = () => { // Keeping the name FishermanDetails
    const navigate = useNavigate();

    const [fishermenList, setFishermenList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessages, setActionMessages] = useState({});

    useEffect(() => {
        const fetchAllFishermen = async () => {
            setLoading(true);
            setError(null);
            setActionMessages({});
            try {
                const fishermenCollectionRef = collection(db, "fishermen");
                const querySnapshot = await getDocs(fishermenCollectionRef);
                const fetchedFishermen = [];
                querySnapshot.forEach((docSnap) => {
                    fetchedFishermen.push({ id: docSnap.id, ...docSnap.data() });
                });
                setFishermenList(fetchedFishermen);
                if (fetchedFishermen.length === 0) {
                    // Set a soft error/info message if no fishermen are found, rather than a hard error state
                    setError("No fishermen found in the database. Add some to see them here.");
                }
            } catch (err) {
                console.error("Error fetching all fishermen details:", err);
                setError("Failed to fetch fishermen details. Please try again later.");
                setFishermenList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllFishermen();
    }, []);

    const displayData = (value, placeholder = "N/A") => {
        if (value && typeof value === 'object' && value.toDate instanceof Function) {
            return value.toDate().toLocaleString();
        }
        if (value instanceof Date) {
             return value.toLocaleString();
        }
        if (typeof value === 'string' && value.includes('UTC')) { // For pre-formatted date strings
            return value;
        }
        return value || placeholder;
    };

    const handleAction = async (fishermanId, newStatus) => {
        setActionMessages(prev => ({ ...prev, [fishermanId]: { type: 'info', text: 'Processing...' } }));
        try {
            const fishermanDocRef = doc(db, "fishermen", fishermanId);
            await updateDoc(fishermanDocRef, {
                status: newStatus,
                statusUpdatedAt: serverTimestamp(),
                statusUpdatedBy: "admin@example.com" // TODO: Replace with actual admin user
            });
            setFishermenList(prevList =>
                prevList.map(f =>
                    f.id === fishermanId ? { ...f, status: newStatus, statusUpdatedAt: new Date() } : f
                )
            );
            setActionMessages(prev => ({ ...prev, [fishermanId]: { type: 'success', text: `Status updated to ${newStatus}.` } }));
        } catch (err) {
            console.error(`Error updating status for ${fishermanId} to ${newStatus}:`, err);
            setActionMessages(prev => ({ ...prev, [fishermanId]: { type: 'danger', text: `Failed to update status. ${err.message}` } }));
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}>
                <Spinner animation="border" role="status" variant="light">
                    <span className="visually-hidden">Loading fishermen...</span>
                </Spinner>
            </div>
        );
    }

    // Show general error if list fetching fails completely
    if (error && fishermenList.length === 0 && !error.includes("No fishermen found")) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', padding: '20px' }}>
                <Container>
                    <BootstrapAlert variant="danger" className="text-center">{error}</BootstrapAlert>
                </Container>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
                width: '100vw',
                margin: 0,
                padding: '20px 0',
                overflowY: 'auto',
            }}
        >
            <Container fluid style={{ padding: '20px' }}>
                <div className="d-flex align-items-center mb-4 pb-2 border-bottom bg-light p-3 rounded" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                    <img
                        src={logoImage}
                        alt="Logo"
                        style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'contain',
                            marginRight: '20px',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/Dashboard')}
                    />
                    <h1 className="m-0 w-100 text-center">Fishermen List</h1> {/* Changed title to reflect list */}
                </div>

                {/* Show info/error message if the list is empty or an error occurred that didn't prevent rendering */}
                {fishermenList.length === 0 && !loading && (
                     <BootstrapAlert variant={error && error.includes("Failed to fetch") ? "danger" : "info"} className="text-center">
                        {error || "No fishermen data found. Add some to see them here."}
                     </BootstrapAlert>
                )}

                {fishermenList.map((fishermanData) => (
                    <Card
                        key={fishermanData.id}
                        className="mb-4"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            maxWidth: '800px',
                            margin: '20px auto',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            borderRadius: '15px',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            overflow: 'hidden',
                        }}
                    >
                        <Card.Header as="h5" className="text-primary">
                            Fisherman: {displayData(fishermanData.fishermenName, fishermanData.id)}
                        </Card.Header>
                        <Card.Body>
                            {actionMessages[fishermanData.id] && (
                                <BootstrapAlert variant={actionMessages[fishermanData.id].type} className="mt-2 mb-3">
                                    {actionMessages[fishermanData.id].text}
                                </BootstrapAlert>
                            )}
                            <Table borderless responsive>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold text-secondary">Name</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.fishermenName)}</td>
                                        <td className="fw-bold text-secondary">Boat ID</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.boatId)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">NIC</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.nic || fishermanData.fishermenNIC)}</td>
                                        <td className="fw-bold text-secondary">Fisherman Doc ID</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.id)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Phone Number</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.contact)}</td>
                                        <td colSpan="3"></td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Email</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.email)}</td>
                                        <td colSpan="3"></td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Address</td>
                                        <td>:</td>
                                        <td colSpan="4">{displayData(fishermanData.address)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Status</td>
                                        <td>:</td>
                                        <td className={fishermanData.status === 'Active' ? 'text-success fw-bold' : fishermanData.status === 'Denied' ? 'text-danger fw-bold' : ''}>
                                            {displayData(fishermanData.status)}
                                        </td>
                                        <td className="fw-bold text-secondary">Status Reason</td>
                                        <td>:</td>
                                        <td>{displayData(fishermanData.statusReason, "None")}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Status Updated At</td>
                                        <td>:</td>
                                        <td colSpan="4">{displayData(fishermanData.statusUpdatedAt)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary">Status Updated By</td>
                                        <td>:</td>
                                        <td colSpan="4">{displayData(fishermanData.statusUpdatedBy)}</td>
                                    </tr>
                                </tbody>
                            </Table>

                            <Card className="bg-light mt-3">
                                <Card.Body>
                                    <Card.Text className="mb-0">
                                        <strong>Requirements Document</strong><br />
                                        {fishermanData.requirementsUrl ? (
                                            <a href={fishermanData.requirementsUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                                        ) : (
                                            "No requirements document linked."
                                        )}
                                    </Card.Text>
                                </Card.Body>
                            </Card>

                            <div className="d-flex justify-content-center mt-4">
                                <Button
                                    variant="success"
                                    className="me-3"
                                    style={{ minWidth: "100px" }}
                                    onClick={() => handleAction(fishermanData.id, "Active")}
                                    disabled={actionMessages[fishermanData.id]?.type === 'info'}
                                >
                                    {actionMessages[fishermanData.id]?.type === 'info' ? <Spinner as="span" animation="border" size="sm" /> : "Accept"}
                                </Button>
                                <Button
                                    variant="danger"
                                    style={{ minWidth: "100px" }}
                                    onClick={() => handleAction(fishermanData.id, "Denied")}
                                    disabled={actionMessages[fishermanData.id]?.type === 'info'}
                                >
                                    {actionMessages[fishermanData.id]?.type === 'info' ? <Spinner as="span" animation="border" size="sm" /> : "Deny"}
                                </Button>
                            </div>
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            Last updated: {displayData(fishermanData.statusUpdatedAt, "Not available")}
                        </Card.Footer>
                    </Card>
                ))}
                <div className="mt-4 pt-3 border-top text-center text-muted" style={{ paddingBottom: '10px' }}>
                    <p className="mb-0 small">
                        Fisheries Management System • v2.1.0 • © 2025
                    </p>
                </div>
            </Container>
        </div>
    );
};

export default FishermanDetails;