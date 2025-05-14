import React, { useState, useEffect, useRef } from 'react';
import { Container, Spinner, Alert, Badge, Button, Row, Col, Form, Modal } from 'react-bootstrap';
import {
  FiCheckCircle, FiXCircle, FiFileText, FiUser, FiAnchor, FiPhone, FiMail,
  FiHome, FiClock, FiUserCheck, FiFilter, FiSearch, FiRefreshCw, FiDownload,
  FiMapPin, FiCalendar, FiActivity, FiAlertCircle, FiChevronDown, FiChevronUp, FiEye // Added FiEye for View Document button
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Firebase imports
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc, updateDoc,
  serverTimestamp, query, where, orderBy, limit
} from "firebase/firestore";

// Import custom components
import backgroundImage from './background.jpeg'; // Make sure this path is correct
import logoImage from './logo.png'; // Make sure this path is correct

// Firebase configuration
// IMPORTANT: For production, use environment variables for Firebase config.
// Do not commit API keys directly to your repository.
const firebaseConfig = {
    apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Example: process.env.REACT_APP_FIREBASE_API_KEY
    authDomain: "finalproject-4453c.firebaseapp.com",
    projectId: "finalproject-4453c",
    storageBucket: "finalproject-4453c.appspot.com",
    messagingSenderId: "866850090007",
    appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Custom wave component for visual appeal
const WaveBackground = () => (
  <div className="wave-container" style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: -1 }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ display: 'block' }}>
      <path fill="rgba(0, 123, 255, 0.1)" fillOpacity="1" d="M0,160L48,138.7C96,117,192,75,288,69.3C384,64,480,96,576,128C672,160,768,192,864,192C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ display: 'block', marginTop: '-20px' }}>
      <path fill="rgba(0, 123, 255, 0.05)" fillOpacity="1" d="M0,96L48,122.7C96,149,192,203,288,208C384,213,480,171,576,138.7C672,107,768,85,864,101.3C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>
);

// Custom Stats Card component
const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="stats-card p-3 rounded shadow-sm"
    style={{
      backgroundColor: `rgba(${color}, 0.1)`,
      border: `1px solid rgba(${color}, 0.3)`,
      cursor: 'pointer'
    }}
  >
    <div className="d-flex align-items-center">
      <div className="stats-icon me-3 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: `rgba(${color}, 0.2)`,
          color: `rgb(${color})`,
          width: '48px',
          height: '48px',
          borderRadius: '12px'
        }}>
        {icon}
      </div>
      <div>
        <h3 className="mb-0 fw-bold">{value}</h3>
        <span className="text-muted">{title}</span>
      </div>
    </div>
  </motion.div>
);

// Custom filter badge component
const FilterBadge = ({ label, active, onClick }) => (
  <motion.span
    whileTap={{ scale: 0.95 }}
    className={`filter-badge px-3 py-2 me-2 rounded-pill ${active ? 'active' : ''}`}
    style={{
      backgroundColor: active ? '#0d6efd' : '#e9ecef',
      color: active ? 'white' : '#495057',
      cursor: 'pointer',
      display: 'inline-block',
      transition: 'all 0.2s ease',
      fontWeight: 500,
      boxShadow: active ? '0 2px 8px rgba(13, 110, 253, 0.3)' : 'none'
    }}
    onClick={onClick}
  >
    {label}
  </motion.span>
);

// Helper function to display data with fallbacks
const displayData = (value, placeholder = "N/A") => {
    if (value === null || typeof value === 'undefined' || (typeof value === 'string' && value.trim() === '')) {
        return placeholder;
    }
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
        try {
            return value.toDate().toLocaleString();
        } catch (e) { console.error("Error formatting Firestore Timestamp:", e, value); return placeholder; }
    }
    if (value instanceof Date) {
         try {
            return value.toLocaleString();
        } catch (e) { console.error("Error formatting Date object:", e, value); return placeholder; }
    }
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                try {
                    return date.toLocaleString();
                } catch (e) { console.error("Error formatting date string:", e, value); return placeholder; }
            }
        }
        return value;
    }
    return String(value);
};


// Custom FishermanCard component
const FishermanCard = ({ fishermanData, handleAction, actionMessages }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false); // State for PDF viewer modal

  const handleOpenPdfModal = () => {
    if (fishermanData.documentUrl) { // Ensure URL exists before trying to show
        setShowPdfModal(true);
    }
  };
  const handleClosePdfModal = () => setShowPdfModal(false);

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

  return (
    <> {/* Fragment to wrap card and modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fisherman-card h-100"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: fishermanData.status === 'Active'
            ? '1px solid rgba(40, 167, 69, 0.5)'
            : fishermanData.status === 'Denied'
              ? '1px solid rgba(220, 53, 69, 0.5)'
              : '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Card Header */}
        <div className="card-header d-flex justify-content-between align-items-center p-3" style={{
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: 'rgba(248, 249, 250, 0.7)'
        }}>
          <div className="d-flex align-items-center">
            <div className="avatar-circle me-3" style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <FiUser size={24} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">{displayData(fishermanData.fishermenName, 'Unnamed')}</h5>
              <div className="d-flex align-items-center">
                <span className="text-muted small me-2">ID: {fishermanData.id ? fishermanData.id.substring(0, 8) : 'N/A'}...</span>
                <span className="registration-date small text-primary">
                  <FiCalendar size={12} className="me-1" />
                  {displayData(fishermanData.registrationDate)}
                </span>
              </div>
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant={actionMessages[fishermanData.id].type} className="mb-3 py-2">
                {actionMessages[fishermanData.id].text}
              </Alert>
            </motion.div>
          )}

          {/* Personal Info */}
          <div className="info-section mb-3">
            <h6 className="text-primary mb-3 d-flex align-items-center">
              <div className="section-icon-badge me-2" style={{
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiUser size={14} className="text-primary" />
              </div>
              Personal Information
            </h6>
            <Row className="g-3">
              <Col md={6}>
                <div className="info-item d-flex">
                  <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiUser className="text-secondary" size={14} />
                  </div>
                  <div>
                    <div className="text-muted small">NIC</div>
                    <div className="fw-medium">{displayData(fishermanData.nic || fishermanData.fishermenNIC)}</div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item d-flex">
                  <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiAnchor className="text-secondary" size={14} />
                  </div>
                  <div>
                    <div className="text-muted small">Boat ID</div>
                    <div className="fw-medium">{displayData(fishermanData.boatId)}</div>
                  </div>
                </div>
              </Col>
            </Row>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <div className="info-item d-flex">
                      <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiPhone className="text-secondary" size={14} />
                      </div>
                      <div>
                        <div className="text-muted small">Contact</div>
                        <div className="fw-medium">{displayData(fishermanData.contact)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-item d-flex">
                      <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiMail className="text-secondary" size={14} />
                      </div>
                      <div>
                        <div className="text-muted small">Email</div>
                        <div className="fw-medium text-truncate" style={{maxWidth: '150px'}}>{displayData(fishermanData.email)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="info-item d-flex">
                      <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiHome className="text-secondary" size={14} />
                      </div>
                      <div>
                        <div className="text-muted small">Address</div>
                        <div className="fw-medium">{displayData(fishermanData.address)}</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="info-item d-flex">
                      <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiMapPin className="text-secondary" size={14} />
                      </div>
                      <div>
                        <div className="text-muted small">Fishing Region</div>
                        <div className="fw-medium">{displayData(fishermanData.fishingRegion, 'Not specified')}</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="info-item d-flex">
                      <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiActivity className="text-secondary" size={14} />
                      </div>
                      <div>
                        <div className="text-muted small">Experience (Years)</div>
                        <div className="fw-medium">{displayData(fishermanData.experience, 'Not specified')}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </motion.div>
            )}
          </div>

          {/* Status Info */}
          <div className="status-section mb-3">
            <h6 className="text-primary mb-3 d-flex align-items-center">
              <div className="section-icon-badge me-2" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiAlertCircle size={14} className="text-primary" />
              </div>
              Status Information
            </h6>
            <Row className="g-3">
              <Col md={6}>
                <div className="info-item d-flex">
                  <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiClock className="text-secondary" size={14} />
                  </div>
                  <div>
                    <div className="text-muted small">Last Updated</div>
                    <div className="fw-medium">{displayData(fishermanData.statusUpdatedAt)}</div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item d-flex">
                  <div className="info-icon me-2 mt-1" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiUserCheck className="text-secondary" size={14} />
                  </div>
                  <div>
                    <div className="text-muted small">Updated By</div>
                    <div className="fw-medium">{displayData(fishermanData.statusUpdatedBy)}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Documents Section - MODIFIED FOR PDF VIEWER */}
          <div className="documents-section mb-3">
            <h6 className="text-primary mb-3 d-flex align-items-center">
              <div className="section-icon-badge me-2" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiFileText size={14} className="text-primary" />
              </div>
              Documents
            </h6>
            <div className="document-item p-3 rounded d-flex align-items-center justify-content-between" style={{ backgroundColor: 'rgba(233, 236, 239, 0.5)', transition: 'all 0.2s ease' }}>
              <div className="d-flex align-items-center">
                <div className="document-icon me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', width: '36px', height: '36px', borderRadius: '8px' }}>
                  <FiFileText className="text-primary" size={18} />
                </div>
                <div>
                  <span className="fw-medium">Fisherman Document</span>
                  <div className="small text-muted">
                    {fishermanData.documentUrl ? "Verification PDF available" : "No document uploaded"}
                  </div>
                </div>
              </div>
              {fishermanData.documentUrl ? (
                <Button variant="outline-primary" size="sm" onClick={handleOpenPdfModal} className="d-flex align-items-center">
                  <FiEye className="me-1" /> View
                </Button>
              ) : (
                 <Button variant="outline-secondary" size="sm" disabled className="d-flex align-items-center">
                  <FiEye className="me-1" /> View
                </Button>
              )}
            </div>
             {/* Optionally, display image if imageUrl exists */}
             {fishermanData.imageUrl && (
                <div className="document-item p-3 mt-2 rounded d-flex align-items-center justify-content-between" style={{ backgroundColor: 'rgba(233, 236, 239, 0.5)'}}>
                    <div className="d-flex align-items-center">
                        <div className="document-icon me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', width: '36px', height: '36px', borderRadius: '8px' }}>
                           <FiUser size={18} className="text-primary"/>
                        </div>
                        <div>
                            <span className="fw-medium">Fisherman Image</span>
                             <div className="small text-muted">Profile picture available</div>
                        </div>
                    </div>
                     <Button variant="outline-primary" size="sm" onClick={() => window.open(fishermanData.imageUrl, '_blank')} className="d-flex align-items-center">
                        <FiEye className="me-1" /> View Image
                    </Button>
                </div>
            )}
          </div>


          {/* Toggle expand button */}
          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="light"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-primary border-0 d-flex align-items-center"
            >
              {expanded ? (
                <>Show Less <FiChevronUp className="ms-1" /></>
              ) : (
                <>Show More <FiChevronDown className="ms-1" /></>
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="actions-section d-flex justify-content-center gap-3 mt-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`btn ${fishermanData.status === 'Active' ? 'btn-success' : 'btn-outline-success'} d-flex align-items-center justify-content-center`}
              style={{ minWidth: "130px", boxShadow: fishermanData.status === 'Active' ? '0 4px 12px rgba(40, 167, 69, 0.2)' : 'none' }}
              onClick={() => handleAction(fishermanData.id, "Active")}
              disabled={actionMessages[fishermanData.id]?.type === 'info' || fishermanData.status === 'Active'}
            >
              {actionMessages[fishermanData.id]?.type === 'info' && actionMessages[fishermanData.id]?.actionType === 'Active' ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" /> Processing...</>
              ) : (
                <><FiCheckCircle className="me-2" /> Approve</>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`btn ${fishermanData.status === 'Denied' ? 'btn-danger' : 'btn-outline-danger'} d-flex align-items-center justify-content-center`}
              style={{ minWidth: "130px", boxShadow: fishermanData.status === 'Denied' ? '0 4px 12px rgba(220, 53, 69, 0.2)' : 'none' }}
              onClick={() => handleAction(fishermanData.id, "Denied")}
              disabled={actionMessages[fishermanData.id]?.type === 'info' || fishermanData.status === 'Denied'}
            >
              {actionMessages[fishermanData.id]?.type === 'info' && actionMessages[fishermanData.id]?.actionType === 'Denied' ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" /> Processing...</>
              ) : (
                <><FiXCircle className="me-2" /> Deny</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="card-footer small text-muted text-center py-2" style={{
          borderTop: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: 'rgba(248, 249, 250, 0.7)'
        }}>
          Last updated: {displayData(fishermanData.statusUpdatedAt, "Not available")}
        </div>
      </motion.div>

      {/* PDF Viewer Modal */}
      <Modal show={showPdfModal} onHide={handleClosePdfModal} size="xl" centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid rgba(0,0,0,0.1)'}}>
          <Modal.Title>
            <FiFileText className="me-2 text-primary" />
            Document Viewer: {displayData(fishermanData.fishermenName, 'Fisherman')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: '80vh' }}>
          {fishermanData.documentUrl ? (
            <iframe
              src={fishermanData.documentUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title={`Document for ${fishermanData.fishermenName}`}
            >
              <p>Your browser does not support PDFs. Please download the PDF to view it:
                <a href={fishermanData.documentUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
              </p>
            </iframe>
          ) : (
            <div className="p-5 text-center text-muted">No document URL provided.</div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)'}}>
          <Button variant="outline-secondary" onClick={handleClosePdfModal}>
            Close
          </Button>
          {fishermanData.documentUrl && (
             <Button variant="primary" href={fishermanData.documentUrl} target="_blank" rel="noopener noreferrer">
                <FiDownload className="me-1" /> Download Document
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};


const FishermanDetails = () => {
    const navigate = useNavigate();
    const searchInputRef = useRef(null);

    const [fishermenList, setFishermenList] = useState([]);
    const [filteredFishermen, setFilteredFishermen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessages, setActionMessages] = useState({});
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('lastUpdated');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedFisherman, setSelectedFisherman] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [animateHeader, setAnimateHeader] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    useEffect(() => {
        const handleScroll = () => setAnimateHeader(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchAllFishermen = async () => {
            setLoading(true);
            setError(null);
            try {
                const fishermenCollectionRef = collection(db, "fishermen");
                const querySnapshot = await getDocs(fishermenCollectionRef);
                const fetchedFishermen = querySnapshot.docs.map(docSnap => {
                    const data = docSnap.data();
                    let fishermanData = { ...data, id: docSnap.id };

                    if (data.registrationDate) {
                        fishermanData.registrationDate = typeof data.registrationDate.toDate === 'function'
                            ? data.registrationDate.toDate()
                            : new Date(data.registrationDate);
                    } else {
                        fishermanData.registrationDate = new Date(); // Mock if missing
                    }

                    if (data.statusUpdatedAt) {
                        fishermanData.statusUpdatedAt = typeof data.statusUpdatedAt.toDate === 'function'
                            ? data.statusUpdatedAt.toDate()
                            : new Date(data.statusUpdatedAt);
                    }

                    if (!data.fishingRegion) {
                        const regions = ['Northern Coast', 'Eastern Waters', 'Southern Bay', 'Western Gulf'];
                        fishermanData.fishingRegion = regions[Math.floor(Math.random() * regions.length)];
                    }
                    if (typeof data.experience === 'undefined') {
                        fishermanData.experience = Math.floor(Math.random() * 30) + 1;
                    }
                    // Ensure nic and fishermenNIC are handled (prefer nic if available)
                    fishermanData.nic = data.nic || data.fishermenNIC;

                    return fishermanData;
                });
                setFishermenList(fetchedFishermen);
            } catch (err) {
                console.error("Error fetching fishermen:", err);
                setError("Failed to fetch fishermen details.");
                setFishermenList([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAllFishermen();
    }, []);

    useEffect(() => {
        let result = [...fishermenList];
        if (filterStatus !== 'All') {
            result = result.filter(f => f.status === filterStatus);
        }
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.fishermenName && f.fishermenName.toLowerCase().includes(lowerQuery)) ||
                (String(f.boatId).toLowerCase().includes(lowerQuery)) ||
                (String(f.nic || f.fishermenNIC).toLowerCase().includes(lowerQuery)) || // Use consolidated NIC
                (String(f.contact).toLowerCase().includes(lowerQuery)) ||
                (f.email && f.email.toLowerCase().includes(lowerQuery)) ||
                (f.address && f.address.toLowerCase().includes(lowerQuery))
            );
        }
        result.sort((a, b) => {
            let valA, valB;
            switch(sortBy) {
                case 'name':
                    valA = a.fishermenName || ''; valB = b.fishermenName || '';
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'lastUpdated':
                    valA = a.statusUpdatedAt instanceof Date ? a.statusUpdatedAt.getTime() : 0;
                    valB = b.statusUpdatedAt instanceof Date ? b.statusUpdatedAt.getTime() : 0;
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                case 'boatId':
                    valA = String(a.boatId || ''); valB = String(b.boatId || '');
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'status':
                    valA = a.status || ''; valB = b.status || '';
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                default: return 0;
            }
        });
        setFilteredFishermen(result);
    }, [fishermenList, filterStatus, searchQuery, sortBy, sortDirection]);

    const handleAction = (fishermanId, newStatus) => {
        const fisherman = fishermenList.find(f => f.id === fishermanId);
        if (fisherman) {
            setSelectedFisherman(fisherman);
            setActionType(newStatus);
            setActionReason(fisherman.statusReason || '');
            setShowActionModal(true);
        }
    };

    const submitAction = async () => {
        if (!selectedFisherman || !actionType) return;
        if (actionType === 'Denied' && actionReason.trim() === '') {
            setProcessingAction(true); // To show validation error styling
            setTimeout(() => setProcessingAction(false), 100); // Reset if only for validation
            return; // Prevent submission
        }

        setProcessingAction(true);
        setActionMessages(prev => ({
            ...prev,
            [selectedFisherman.id]: { type: 'info', text: 'Processing...', actionType: actionType }
        }));

        try {
            const fishermanDocRef = doc(db, "fishermen", selectedFisherman.id);
            const updateData = {
                status: actionType,
                statusReason: actionReason.trim() || null,
                statusUpdatedAt: serverTimestamp(),
                statusUpdatedBy: "admin@example.com" // Replace with actual admin user
            };
            await updateDoc(fishermanDocRef, updateData);

            const updatedDate = new Date();
            setFishermenList(prevList =>
                prevList.map(f =>
                    f.id === selectedFisherman.id
                        ? { ...f, status: actionType, statusReason: actionReason.trim() || null, statusUpdatedAt: updatedDate }
                        : f
                )
            );
            setActionMessages(prev => ({
                ...prev,
                [selectedFisherman.id]: { type: 'success', text: `Status updated to ${actionType}.${actionReason.trim() ? ' Reason recorded.' : ''}` }
            }));
            setTimeout(() => {
                setActionMessages(prev => { const newMessages = {...prev}; delete newMessages[selectedFisherman.id]; return newMessages; });
            }, 3000);
            setShowActionModal(false);
            setActionReason(''); // Reset reason
        } catch (err) {
            console.error(`Error updating status:`, err);
            setActionMessages(prev => ({
                ...prev,
                [selectedFisherman.id]: { type: 'danger', text: `Failed to update status. ${err.message}` }
            }));
        } finally {
            setProcessingAction(false);
        }
    };
    
    const escapeCsvCell = (cell) => {
        if (cell === null || typeof cell === 'undefined') return '';
        let cellString = String(cell);
        if (cellString.search(/[,|"\n]/g) >= 0) {
            cellString = `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
    };

    const exportData = () => {
        if (filteredFishermen.length === 0) return;
        const dataToExport = filteredFishermen.map(f => ({
            ID: f.id, Name: f.fishermenName || '', NIC: f.nic || f.fishermenNIC || '', 'Boat ID': f.boatId || '',
            Contact: f.contact || '', Email: f.email || '', Address: f.address || '',
            FishingRegion: f.fishingRegion || '', ExperienceYears: f.experience || '', Status: f.status || '',
            'Registration Date': f.registrationDate ? displayData(f.registrationDate) : '',
            'Last Updated': f.statusUpdatedAt ? displayData(f.statusUpdatedAt) : '',
            'Updated By': f.statusUpdatedBy || '', 'Status Reason': f.statusReason || '',
            'Document URL': f.documentUrl || '', 'Image URL': f.imageUrl || ''
        }));
        const csvHeaders = Object.keys(dataToExport[0]);
        const csvRows = dataToExport.map(row => csvHeaders.map(header => escapeCsvCell(row[header])).join(","));
        const csvContent = "data:text/csv;charset=utf-8," + [csvHeaders.join(","), ...csvRows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fishermen_data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setFilterStatus('All');
        setSearchQuery('');
        setSortBy('lastUpdated');
        setSortDirection('desc');
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}>
                <div className="loading-container text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)', backdropFilter: 'blur(12px)', maxWidth: '450px', width: '100%' }}>
                    <div className="mb-4" style={{ position: 'relative' }}><div className="spinner-ripple" style={{ width: '70px', height: '70px', margin: '0 auto', position: 'relative' }}><div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid transparent', borderRadius: '50%', borderTopColor: '#0d6efd', animation: 'spin 1s cubic-bezier(0.76, 0.35, 0.2, 0.7) infinite' }}></div><div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid transparent', borderRadius: '50%', borderTopColor: '#0d6efd', animation: 'spin 1s cubic-bezier(0.76, 0.35, 0.2, 0.7) infinite', animationDelay: '0.3s' }}></div></div><style>{`@keyframes spin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style></div>
                    <h3 className="mt-3 mb-2 text-primary fw-bold">Loading Fishermen Data</h3><p className="text-muted mb-0">Please wait...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', padding: '20px' }}>
                <Container className="p-0"><Alert variant="danger" className="text-center shadow-lg p-4 mx-auto" style={{ maxWidth: '500px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px' }}><div className="error-icon mb-3" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(220, 53, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><FiAlertCircle size={40} className="text-danger" /></div><h4 className="fw-bold">Error Loading Data</h4><p className="mb-4">{error}</p><Button variant="outline-danger" className="px-4 py-2" onClick={() => window.location.reload()} style={{ borderRadius: '8px' }}><FiRefreshCw className="me-2" /> Try Again</Button></Alert></Container>
            </div>
        );
    }

    return (
        <div className="fishermen-list-page" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', width: '100%', margin: 0, padding: '0', overflowY: 'auto' }}>
            <WaveBackground />
            <div className={`header-bar shadow-sm ${animateHeader ? 'header-scrolled' : ''}`} style={{ backgroundColor: animateHeader ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)', padding: animateHeader ? '10px 20px' : '20px', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)' }}>
                <Container fluid><div className="d-flex align-items-center justify-content-between"><div className="d-flex align-items-center"><motion.img whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} src={logoImage} alt="Logo" style={{ width: animateHeader ? '40px' : '50px', height: animateHeader ? '40px' : '50px', marginRight: '15px', cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => navigate('/Dashboard')} /><div><h2 className="m-0 fw-bold text-primary" style={{ fontSize: animateHeader ? '1.5rem' : '1.8rem', transition: 'all 0.3s ease' }}>Fishermen Management</h2><div className="text-muted small">Manage applications and registrations</div></div></div><div><Button variant="outline-primary" size={animateHeader ? "sm" : undefined} className="me-2 d-flex align-items-center" onClick={() => navigate('/Dashboard')}><span className="d-none d-md-inline me-1">Back to</span> Dashboard</Button></div></div></Container>
            </div>

            <Container fluid className="py-4 px-md-4">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="stats-row mb-4">
                    <Row className="g-3">
                        <Col sm={6} lg={3}><motion.div variants={itemVariants}><StatsCard title="Total Fishermen" value={fishermenList.length} icon={<FiUser size={24} />} color="100, 100, 255" /></motion.div></Col>
                        <Col sm={6} lg={3}><motion.div variants={itemVariants}><StatsCard title="Active" value={fishermenList.filter(f => f.status === 'Active').length} icon={<FiCheckCircle size={24} />} color="40, 167, 69" /></motion.div></Col>
                        <Col sm={6} lg={3}><motion.div variants={itemVariants}><StatsCard title="Pending" value={fishermenList.filter(f => f.status === 'Pending' || !f.status).length} icon={<FiClock size={24} />} color="255, 193, 7" /></motion.div></Col>
                        <Col sm={6} lg={3}><motion.div variants={itemVariants}><StatsCard title="Denied" value={fishermenList.filter(f => f.status === 'Denied').length} icon={<FiXCircle size={24} />} color="220, 53, 69" /></motion.div></Col>
                    </Row>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="filters-section mb-4 p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                    <Row className="g-3 align-items-center">
                        <Col md={6} lg={4}><div className="search-box position-relative"><div className="position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}><FiSearch size={16} className="text-muted" /></div><Form.Control ref={searchInputRef} type="text" placeholder="Search by name, NIC, boat ID..." className="ps-5" style={{ borderRadius: '50px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0, 0, 0, 0.1)' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></Col>
                        <Col md={6} lg={4}><div className="d-flex align-items-center h-100 flex-wrap"><span className="me-2 text-muted small">Sort by:</span><Form.Select onChange={(e) => setSortBy(e.target.value)} value={sortBy} size="sm" className="me-2" style={{ borderRadius: '50px', backgroundColor: 'rgba(255, 255, 255, 0.5)', maxWidth: '150px', flexShrink: 0 }}><option value="lastUpdated">Last Updated</option><option value="name">Name</option><option value="boatId">Boat ID</option><option value="status">Status</option></Form.Select><Button variant="light" className="p-0" style={{ width: '32px', height: '32px', borderRadius: '50%', lineHeight: '1' }} onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>{sortDirection === 'asc' ? <FiChevronUp size={18}/> : <FiChevronDown size={18}/>}</Button><Button variant="outline-secondary" size="sm" className="ms-auto ms-md-3 d-flex align-items-center" onClick={clearFilters}><FiRefreshCw size={14} className="me-1" /> Reset</Button></div></Col>
                        <Col md={12} lg={4} className="d-flex justify-content-lg-end align-items-center mt-3 mt-lg-0"><Button variant="outline-primary" className="d-flex align-items-center w-100 w-lg-auto" onClick={exportData} disabled={filteredFishermen.length === 0}><FiDownload className="me-2" /> Export Data ({filteredFishermen.length})</Button></Col>
                    </Row>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="filter-pills-container mb-4"><div className="d-flex flex-wrap align-items-center gap-2"><div className="me-2 text-muted"><FiFilter size={14} className="me-1" /> Filter:</div><FilterBadge label="All" active={filterStatus === 'All'} onClick={() => setFilterStatus('All')} /><FilterBadge label="Active" active={filterStatus === 'Active'} onClick={() => setFilterStatus('Active')} /><FilterBadge label="Pending" active={filterStatus === 'Pending'} onClick={() => setFilterStatus('Pending')} /><FilterBadge label="Denied" active={filterStatus === 'Denied'} onClick={() => setFilterStatus('Denied')} /></div></motion.div>

                {filteredFishermen.length === 0 && !loading && !error && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                        <Alert variant="info" className="text-center p-4 shadow" style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}><div className="empty-state-icon mb-3" style={{ fontSize: '3rem' }}>{fishermenList.length === 0 ? '🚤' : '🔍'}</div><h5 className="fw-bold">{fishermenList.length === 0 ? "No Fishermen Data" : "No Results Found"}</h5><p className="mb-3">{fishermenList.length === 0 ? "No fishermen data available." : "No fishermen match your filters."}</p>{fishermenList.length > 0 && (<Button variant="outline-primary" size="sm" onClick={clearFilters}>Clear Filters</Button>)}</Alert>
                    </motion.div>
                )}

                {filteredFishermen.length > 0 && (
                    <div className="results-summary mb-3 text-muted small d-flex justify-content-between align-items-center"><div>Showing {filteredFishermen.length} of {fishermenList.length} fishermen</div><div>{searchQuery && <Badge pill bg="light" text="dark" className="me-2 p-2">Search: "{searchQuery}"</Badge>}{filterStatus !== 'All' && <Badge pill bg="info" className="me-2 p-2">{filterStatus}</Badge>}</div></div>
                )}

                <Row className="g-4">
                    {filteredFishermen.map((fishermanData) => (
                        <Col lg={6} xxl={4} key={fishermanData.id}>
                            <FishermanCard
                                fishermanData={fishermanData}
                                handleAction={handleAction}
                                actionMessages={actionMessages}
                            />
                        </Col>
                    ))}
                </Row>

                <Modal show={showActionModal} onHide={() => { if (!processingAction) setShowActionModal(false); }} centered backdrop="static" keyboard={!processingAction}>
                    <Modal.Header closeButton={!processingAction} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Modal.Title>{actionType === 'Active' ? <FiCheckCircle className="me-2 text-success"/> : <FiXCircle className="me-2 text-danger"/>}{actionType === 'Active' ? 'Approve Fisherman' : 'Deny Fisherman'}</Modal.Title></Modal.Header>
                    <Modal.Body>{selectedFisherman && (<><p>Are you sure you want to <strong>{actionType?.toLowerCase()}</strong> for:</p><div className="fisherman-summary p-3 rounded mb-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #eee' }}><h6 className="mb-1 fw-bold">{displayData(selectedFisherman.fishermenName, 'Unnamed')}</h6><div className="small text-muted"><span className="me-3">NIC: {displayData(selectedFisherman.nic || selectedFisherman.fishermenNIC)}</span><span>Boat ID: {displayData(selectedFisherman.boatId)}</span></div></div><Form.Group className="mb-3"><Form.Label>Reason ({actionType === 'Denied' ? 'required if denying' : 'optional'})</Form.Label><Form.Control as="textarea" rows={3} placeholder={`Reason for ${actionType === 'Active' ? 'approval' : 'denial'}...`} value={actionReason} onChange={(e) => setActionReason(e.target.value)} isInvalid={actionType === 'Denied' && actionReason.trim() === '' && processingAction} />{actionType === 'Denied' && actionReason.trim() === '' && processingAction && (<Form.Control.Feedback type="invalid">Reason is required for denial.</Form.Control.Feedback>)}<Form.Text className="text-muted small mt-1">This reason will be recorded.</Form.Text></Form.Group></>)}</Modal.Body>
                    <Modal.Footer style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}><Button variant="outline-secondary" onClick={() => setShowActionModal(false)} disabled={processingAction}>Cancel</Button><Button variant={actionType === 'Active' ? 'success' : 'danger'} onClick={submitAction} disabled={processingAction || (actionType === 'Denied' && actionReason.trim() === '')}>{processingAction && !(actionType === 'Denied' && actionReason.trim() === '') ? (<><Spinner as="span" animation="border" size="sm" className="me-2" /> Processing...</>) : (<>{actionType === 'Active' ? 'Confirm Approval' : 'Confirm Denial'}</>)}</Button></Modal.Footer>
                </Modal>

                <footer className="mt-5 pt-4 pb-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
                    <div className="mb-3"><img src={logoImage} alt="Logo" style={{ width: '40px', height: '40px', opacity: 0.7 }} /></div>
                    <p className="mb-1 text-muted">Fisheries Management System • v2.5.0</p>
                    <p className="text-muted small mb-0">© {new Date().getFullYear()} Department of Fisheries and Aquatic Resources</p>
                </footer>
            </Container>
        </div>
    );
};

export default FishermanDetails;