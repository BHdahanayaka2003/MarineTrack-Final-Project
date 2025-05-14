import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Badge, Button, Row, Col } from 'react-bootstrap';
import { FiCheckCircle, FiXCircle, FiFileText, FiUser, FiAnchor, FiPhone, FiMail, FiHome, FiClock, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Import custom components
import backgroundImage from './background.jpeg';
import logoImage from './logo.png';

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

    const [fishermenList, setFishermenList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessages, setActionMessages] = useState({});
    const [filterStatus, setFilterStatus] = useState('All');

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
        if (typeof value === 'string' && value.includes('UTC')) {
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
            
            // Auto-hide the message after 3 seconds
            setTimeout(() => {
                setActionMessages(prev => {
                    const newMessages = {...prev};
                    delete newMessages[fishermanId];
                    return newMessages;
                });
            }, 3000);
        } catch (err) {
            console.error(`Error updating status for ${fishermanId} to ${newStatus}:`, err);
            setActionMessages(prev => ({ ...prev, [fishermanId]: { type: 'danger', text: `Failed to update status. ${err.message}` } }));
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Active':
                return <Badge bg="success" className="px-3 py-2"><FiCheckCircle className="me-1" /> Active</Badge>;
            case 'Denied':
                return <Badge bg="danger" className="px-3 py-2"><FiXCircle className="me-1" /> Denied</Badge>;
            case 'Pending':
                return <Badge bg="warning" text="dark" className="px-3 py-2"><FiClock className="me-1" /> Pending</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status || 'Unknown'}</Badge>;
        }
    };

    const filteredFishermen = filterStatus === 'All' 
        ? fishermenList 
        : fishermenList.filter(f => f.status === filterStatus);

    if (loading) {
        return (
            <div className="loading-screen" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundImage: `url(${backgroundImage})`, 
                backgroundSize: 'cover' 
            }}>
                <div className="loading-container text-center" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '30px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)'
                }}>
                    <Spinner animation="grow" variant="primary" style={{width: '50px', height: '50px'}} />
                    <h4 className="mt-3 text-primary">Loading fishermen data...</h4>
                </div>
            </div>
        );
    }

    if (error && fishermenList.length === 0 && !error.includes("No fishermen found")) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundImage: `url(${backgroundImage})`, 
                backgroundSize: 'cover', 
                padding: '20px' 
            }}>
                <Container>
                    <Alert variant="danger" className="text-center shadow-lg">
                        <h4>Error</h4>
                        <p>{error}</p>
                        <Button variant="outline-danger" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </Alert>
                </Container>
            </div>
        );
    }

    return (
        <div className="fishermen-list-page" style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '100vh',
            width: '100%',
            margin: 0,
            padding: '0',
            overflowY: 'auto',
        }}>
            {/* Header Bar */}
            <div className="header-bar shadow-sm" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '15px 20px',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
                <Container fluid>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <img
                                src={logoImage}
                                alt="Fisheries Management Logo"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    objectFit: 'contain',
                                    marginRight: '15px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/Dashboard')}
                            />
                            <h2 className="m-0 fw-bold text-primary">Fishermen Management</h2>
                        </div>
                        <div>
                            <Button variant="outline-secondary" size="sm" onClick={() => navigate('/Dashboard')}>
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Main Content */}
            <Container fluid className="py-4 px-4">
                {/* Filters and Stats */}
                <div className="filters-section mb-4 p-3 rounded" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h4 className="mb-0">Fishermen List</h4>
                            <p className="text-muted mb-0">
                                Total: {fishermenList.length} | Active: {fishermenList.filter(f => f.status === 'Active').length} | 
                                Pending: {fishermenList.filter(f => f.status === 'Pending' || !f.status).length} | 
                                Denied: {fishermenList.filter(f => f.status === 'Denied').length}
                            </p>
                        </Col>
                        <Col md={6} className="d-flex justify-content-md-end mt-3 mt-md-0">
                            <div className="filter-buttons">
                                <Button 
                                    variant={filterStatus === 'All' ? 'primary' : 'outline-primary'} 
                                    className="me-2"
                                    onClick={() => setFilterStatus('All')}
                                >
                                    All
                                </Button>
                                <Button 
                                    variant={filterStatus === 'Active' ? 'success' : 'outline-success'} 
                                    className="me-2"
                                    onClick={() => setFilterStatus('Active')}
                                >
                                    Active
                                </Button>
                                <Button 
                                    variant={filterStatus === 'Pending' ? 'warning' : 'outline-warning'} 
                                    className="me-2"
                                    onClick={() => setFilterStatus('Pending')}
                                >
                                    Pending
                                </Button>
                                <Button 
                                    variant={filterStatus === 'Denied' ? 'danger' : 'outline-danger'}
                                    onClick={() => setFilterStatus('Denied')}
                                >
                                    Denied
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Error/Empty State */}
                {(fishermenList.length === 0 || filteredFishermen.length === 0) && !loading && (
                    <Alert variant={error && error.includes("Failed to fetch") ? "danger" : "info"} className="text-center shadow">
                        {filteredFishermen.length === 0 && fishermenList.length > 0 
                            ? `No fishermen with status "${filterStatus}" found.` 
                            : (error || "No fishermen data found. Add some to see them here.")}
                    </Alert>
                )}

                {/* Fishermen Cards */}
                <Row>
                    {filteredFishermen.map((fishermanData) => (
                        <Col lg={6} xxl={4} className="mb-4" key={fishermanData.id}>
                            <div className="fisherman-card h-100" style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                overflow: 'hidden',
                                backdropFilter: 'blur(8px)',
                                border: fishermanData.status === 'Active' 
                                    ? '1px solid rgba(40, 167, 69, 0.5)'
                                    : fishermanData.status === 'Denied'
                                        ? '1px solid rgba(220, 53, 69, 0.5)'
                                        : '1px solid rgba(0, 0, 0, 0.125)'
                            }}>
                                {/* Card Header */}
                                <div className="card-header d-flex justify-content-between align-items-center p-3" style={{
                                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(248, 249, 250, 0.7)'
                                }}>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-circle me-3" style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            backgroundColor: '#e9ecef',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FiUser size={24} />
                                        </div>
                                        <div>
                                            <h5 className="mb-0">{displayData(fishermanData.fishermenName, 'Unnamed')}</h5>
                                            <span className="text-muted small">ID: {fishermanData.id.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(fishermanData.status)}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="card-body p-3">
                                    {/* Action Messages */}
                                    {actionMessages[fishermanData.id] && (
                                        <Alert variant={actionMessages[fishermanData.id].type} className="mb-3 py-2">
                                            {actionMessages[fishermanData.id].text}
                                        </Alert>
                                    )}

                                    {/* Personal Info */}
                                    <div className="info-section mb-3">
                                        <h6 className="text-primary mb-2">Personal Information</h6>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <div className="info-item d-flex">
                                                    <FiUser className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">NIC</div>
                                                        <div>{displayData(fishermanData.nic || fishermanData.fishermenNIC)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="info-item d-flex">
                                                    <FiAnchor className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Boat ID</div>
                                                        <div>{displayData(fishermanData.boatId)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="info-item d-flex">
                                                    <FiPhone className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Contact</div>
                                                        <div>{displayData(fishermanData.contact)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="info-item d-flex">
                                                    <FiMail className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Email</div>
                                                        <div className="text-truncate" style={{maxWidth: '150px'}}>{displayData(fishermanData.email)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xs={12}>
                                                <div className="info-item d-flex">
                                                    <FiHome className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Address</div>
                                                        <div>{displayData(fishermanData.address)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Status Info */}
                                    <div className="status-section mb-3">
                                        <h6 className="text-primary mb-2">Status Information</h6>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <div className="info-item d-flex">
                                                    <FiClock className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Last Updated</div>
                                                        <div>{displayData(fishermanData.statusUpdatedAt)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div className="info-item d-flex">
                                                    <FiUserCheck className="text-secondary me-2 mt-1" />
                                                    <div>
                                                        <div className="text-muted small">Updated By</div>
                                                        <div>{displayData(fishermanData.statusUpdatedBy)}</div>
                                                    </div>
                                                </div>
                                            </Col>
                                            {fishermanData.statusReason && (
                                                <Col md={12}>
                                                    <div className="info-item">
                                                        <div className="text-muted small">Status Reason</div>
                                                        <div className="bg-light p-2 rounded mt-1">
                                                            {displayData(fishermanData.statusReason)}
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>

                                    {/* Documents */}
                                    <div className="documents-section mb-3">
                                        <h6 className="text-primary mb-2">Documents</h6>
                                        <div className="document-link p-3 bg-light rounded d-flex align-items-center">
                                            <FiFileText className="me-2" size={20} />
                                            {fishermanData.requirementsUrl ? (
                                                <a href={fishermanData.requirementsUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                    View Requirements Document
                                                </a>
                                            ) : (
                                                <span className="text-muted">No requirements document linked</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="actions-section d-flex justify-content-center mt-4">
                                        <Button
                                            variant="outline-success"
                                            className="me-3 d-flex align-items-center"
                                            style={{ minWidth: "120px" }}
                                            onClick={() => handleAction(fishermanData.id, "Active")}
                                            disabled={actionMessages[fishermanData.id]?.type === 'info' || fishermanData.status === 'Active'}
                                        >
                                            {actionMessages[fishermanData.id]?.type === 'info' ? (
                                                <><Spinner as="span" animation="border" size="sm" className="me-2" /> Processing...</>
                                            ) : (
                                                <><FiCheckCircle className="me-2" /> Approve</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            className="d-flex align-items-center"
                                            style={{ minWidth: "120px" }}
                                            onClick={() => handleAction(fishermanData.id, "Denied")}
                                            disabled={actionMessages[fishermanData.id]?.type === 'info' || fishermanData.status === 'Denied'}
                                        >
                                            {actionMessages[fishermanData.id]?.type === 'info' ? (
                                                <><Spinner as="span" animation="border" size="sm" className="me-2" /> Processing...</>
                                            ) : (
                                                <><FiXCircle className="me-2" /> Deny</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="card-footer small text-muted text-center py-2" style={{
                                    borderTop: '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(248, 249, 250, 0.7)'
                                }}>
                                    Last updated: {displayData(fishermanData.statusUpdatedAt, "Not available")}
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* Footer */}
                <footer className="mt-5 pt-4 pb-3 text-center" style={{
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                }}>
                    <p className="mb-0 text-muted small">
                        Fisheries Management System • v2.2.0 • © 2025
                    </p>
                </footer>
            </Container>
        </div>
    );
};

export default FishermanDetails;