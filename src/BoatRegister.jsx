import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage
import { FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiRefreshCcw } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
const storage = getStorage(app); // Initialize Firebase Storage

const RequestPanel = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "requestDate", direction: "desc" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null);
  
  // State specifically for PDF viewing
  const [pdfSource, setPdfSource] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [imageSource, setImageSource] = useState(null); // Added state for image
  
  const pdfModalRef = useRef(null);

  useEffect(() => {
    const fetchBoatData = async () => {
      try {
        setLoading(true);
        const boatCollection = collection(db, "boat");
        const boatSnapshot = await getDocs(boatCollection);
        
        const boatList = await Promise.all(boatSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Process date
          const requestDate = data.requestDate ? 
            (data.requestDate instanceof Date ? data.requestDate.toLocaleDateString() : new Date(data.requestDate).toLocaleDateString()) 
            : new Date().toLocaleDateString();

          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.name || "Unknown",
            boatName: data.boatName || "Unnamed boat",
            contact: data.contact || "No contact",
            documentUrl: data.documentUrl || null, // Use documentUrl field for Firebase Storage
            imageUrl: data.imageUrl || null, // Use imageUrl field for Firebase Storage
            boatLength: data.boatLength || "N/A",
            capacity: data.capacity || "N/A",
            power: data.power || "N/A",
            serialNumber: data.serialNumber || "N/A",
            nic: data.nic || "N/A",
            address: data.address || "N/A",
            status: data.status || "Pending",
            requestDate: requestDate
          };
        }));
        
        setRequests(boatList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching boat data:", err);
        setError("Failed to load request data. Please try again later.");
        setLoading(false);
      }
    };

    fetchBoatData();
  }, []);

  // Function to get download URL from Firebase Storage
  const getFirebaseStorageUrl = async (storagePath) => {
    try {
      if (!storagePath) return null;
      
      // Check if the path is already a URL or just a storage path
      if (storagePath.startsWith('http')) {
        return storagePath; // It's already a URL, return as is
      }
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, storagePath);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      console.log(`Generated download URL for ${storagePath}:`, downloadUrl);
      return downloadUrl;
      
    } catch (error) {
      console.error("Error getting download URL:", error);
      toast.error(`Failed to get download URL: ${error.message}`);
      return null;
    }
  };

  // PDF functions
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
    setCurrentPage(1);
    console.log("PDF loaded successfully. Total pages:", numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    setPdfLoading(false);
    
    let userErrorMessage = "Failed to load document.";
    if (error.message && error.message.includes("status 403")) {
      userErrorMessage += " (Permission denied - check file access permissions)";
    } else if (error.message && error.message.includes("status 404")) {
      userErrorMessage += " (File not found)";
    } else if (error.message) {
      userErrorMessage += ` (${error.message})`;
    }

    setPdfError(userErrorMessage);
    toast.error(userErrorMessage);
  };

  const changePage = (offset) => {
    setCurrentPage(prevPage => {
      const newPage = prevPage + offset;
      return newPage >= 1 && newPage <= numPages ? newPage : prevPage;
    });
  };

  // Handle document view
  const openPdfViewer = async () => {
    if (selectedRequest && selectedRequest.documentUrl) {
      try {
        setPdfLoading(true);
        setPdfError(null);
        setCurrentPage(1);
        setNumPages(null);
        setImageSource(null); // Clear any existing image source
        
        // Get the download URL from Firebase Storage
        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.documentUrl);
        
        if (downloadUrl) {
          // Check if it's a PDF or image by file extension
          const lowerCaseUrl = downloadUrl.toLowerCase();
          
          if (lowerCaseUrl.endsWith('.pdf')) {
            setPdfSource(downloadUrl);
            setShowPdfViewer(true);
            console.log("Attempting to load PDF from:", downloadUrl);
          } else if (
            lowerCaseUrl.endsWith('.jpg') || 
            lowerCaseUrl.endsWith('.jpeg') || 
            lowerCaseUrl.endsWith('.png') || 
            lowerCaseUrl.endsWith('.gif')
          ) {
            setImageSource(downloadUrl);
            setShowPdfViewer(true);
            setPdfLoading(false);
            console.log("Attempting to load image from:", downloadUrl);
          } else {
            // If neither PDF nor common image format, try to load as PDF anyway
            setPdfSource(downloadUrl);
            setShowPdfViewer(true);
            console.log("Attempting to load document from:", downloadUrl);
          }
        } else {
          setPdfLoading(false);
          const errorMsg = "Failed to retrieve document URL.";
          setPdfError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        setPdfLoading(false);
        setPdfError(`Failed to load document: ${error.message}`);
        toast.error(`Failed to load document: ${error.message}`);
      }
    } else {
      toast.error("No document available to view");
    }
  };

  // Open uploaded image
  const openImageViewer = async () => {
    if (selectedRequest && selectedRequest.imageUrl) {
      try {
        setPdfLoading(true);
        setPdfError(null);
        setPdfSource(null); // Clear any PDF source
        setNumPages(null);
        
        // Get the download URL from Firebase Storage
        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.imageUrl);
        
        if (downloadUrl) {
          setImageSource(downloadUrl);
          setShowPdfViewer(true);
          setPdfLoading(false);
          console.log("Attempting to load image from:", downloadUrl);
        } else {
          setPdfLoading(false);
          const errorMsg = "Failed to retrieve image URL.";
          setPdfError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        setPdfLoading(false);
        setPdfError(`Failed to load image: ${error.message}`);
        toast.error(`Failed to load image: ${error.message}`);
      }
    } else {
      toast.error("No image available to view");
    }
  };

  // Handle document download
  const handleDownloadDocument = async () => {
    if (selectedRequest && selectedRequest.documentUrl) {
      try {
        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.documentUrl);
        
        if (downloadUrl) {
          console.log("Attempting to download from:", downloadUrl);
          // Open in new tab for download
          window.open(downloadUrl, '_blank');
        } else {
          toast.error("Could not generate download URL.");
        }
      } catch (error) {
        toast.error(`Download failed: ${error.message}`);
      }
    } else {
      toast.error("No document available to download");
    }
  };

  // Handle image download
  const handleDownloadImage = async () => {
    if (selectedRequest && selectedRequest.imageUrl) {
      try {
        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.imageUrl);
        
        if (downloadUrl) {
          console.log("Attempting to download image from:", downloadUrl);
          // Open in new tab for download
          window.open(downloadUrl, '_blank');
        } else {
          toast.error("Could not generate download URL.");
        }
      } catch (error) {
        toast.error(`Download failed: ${error.message}`);
      }
    } else {
      toast.error("No image available to download");
    }
  };

  // Retry loading document/image
  const retryLoading = () => {
    if (selectedRequest) {
      if (pdfSource) {
        openPdfViewer();
      } else if (imageSource) {
        openImageViewer();
      }
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    // Reset viewer state when a new request is selected
    setShowPdfViewer(false);
    setPdfSource(null);
    setImageSource(null);
    setPdfLoading(false);
    setPdfError(null);
    setNumPages(null);
    setCurrentPage(1);
  };

  const initiateApproval = () => {
    setActionType("approve");
    setShowConfirmation(true);
  };

  const initiateRejection = () => {
    setActionType("reject");
    setShowConfirmation(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const newStatus = actionType === "approve" ? "Approved" : "Rejected";
      
      // Update in Firestore
      const requestRef = doc(db, "boat", selectedRequest.id);
      await updateDoc(requestRef, {
        status: newStatus
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === selectedRequest.id ? {...req, status: newStatus} : req
      ));
      
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
      setSelectedRequest(prev => ({...prev, status: newStatus}));
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(`Failed to ${actionType} request. Please try again.`);
    }
  };

  const cancelAction = () => {
    setShowConfirmation(false);
    setActionType(null);
  };

  const handleBack = () => {
    navigate("/Dashboard");
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-warning';
    }
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedRequests = () => {
    // First filter by search term
    let filteredRequests = requests.filter(request => {
      const searchFields = [
        request.name,
        request.email,
        request.boatName,
        request.contact,
        request.id,
        request.status,
        request.requestDate,
        request.nic,
        request.serialNumber
      ].join(" ").toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
    
    // Then filter by status if needed
    if (filterStatus !== "All") {
      filteredRequests = filteredRequests.filter(request => 
        request.status === filterStatus
      );
    }
    
    // Finally sort
    const sorted = [...filteredRequests].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  // Close viewer when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfModalRef.current && !pdfModalRef.current.contains(event.target)) {
        setShowPdfViewer(false);
        setPdfSource(null);
        setImageSource(null);
        setPdfError(null);
      }
    };

    if (showPdfViewer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPdfViewer]);

  // Render viewer content (PDF or Image)
  const renderViewerContent = () => {
    if (pdfLoading) {
      return (
        <div className="text-center my-5">
          <div className="spinner-border"></div>
          <p className="mt-2">Loading content...</p>
        </div>
      );
    }
    
    if (pdfError) {
      return (
        <div className="alert alert-danger my-4 text-start">
          <h5 className="alert-heading">Error Loading Content</h5>
          <p>{pdfError}</p>
          
          <hr />
          
          <p className="mb-3">Possible solutions:</p>
          <ul className="mb-3">
            <li>Ensure the file exists in Firebase Storage.</li>
            <li>Check if the storage path is correct.</li>
            <li>Verify the security rules allow access to this file.</li>
            <li>Try downloading the file instead of viewing it.</li>
          </ul>

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button 
              className="btn btn-outline-primary"
              onClick={retryLoading}
            >
              <FiRefreshCcw className="me-1" /> Retry Loading
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={handleDownloadDocument}
            >
              <FiDownload className="me-1" /> Download Content
            </button>
          </div>
        </div>
      );
    }
    
    // If we have an image to display
    if (imageSource) {
      return (
        <div className="text-center">
          <img 
            src={imageSource}
            alt="Boat Registration Document" 
            className="img-fluid rounded border" 
            style={{ maxHeight: '70vh' }}
            onError={(e) => {
              console.error("Image failed to load");
              setPdfError("Failed to load image. The image might be corrupted or inaccessible.");
              e.target.style.display = 'none';
            }}
          />
          <div className="mt-3">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleDownloadImage}
            >
              <FiDownload className="me-1" /> Download Image
            </button>
          </div>
        </div>
      );
    }
    
    // If we have a PDF to display
    if (pdfSource) {
      return (
        <>
          {/* PDF Controls */}
          {numPages && (
            <div className="text-center mb-3">
              <div className="btn-group">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage <= 1} 
                  onClick={() => changePage(-1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  disabled={currentPage >= numPages} 
                  onClick={() => changePage(1)}
                >
                  Next
                </button>
              </div>
              <span className="ms-3">
                Page {currentPage} of {numPages}
              </span>
            </div>
          )}

          {/* PDF Document */}
          <div className="border rounded p-2 d-flex justify-content-center" style={{ minHeight: '300px' }}>
            <Document
              file={pdfSource}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-center my-5"><div className="spinner-border"></div><p>Loading PDF...</p></div>}
              noData={() => <div className="alert alert-info text-center">No PDF file source provided.</div>}
            >
              {numPages && !pdfError && (
                <Page 
                  pageNumber={currentPage} 
                  scale={1.2}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="d-flex justify-content-center"
                  onError={(err) => console.error("Page rendering error:", err)}
                />
              )}
            </Document>
          </div>
          
          {/* Download Hint */}
          {pdfSource && (
            <div className="mt-3 text-center">
              <small className="text-muted">
                If you have trouble viewing this document, try downloading it instead.
              </small>
              <div className="mt-2">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleDownloadDocument}
                >
                  <FiDownload className="me-1" /> Download Document
                </button>
              </div>
            </div>
          )}
        </>
      );
    }
    
    // No content to display
    return (
      <div className="alert alert-info text-center">
        No content selected for viewing. Please try again.
      </div>
    );
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto",
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Content Viewer Modal */}
      {showPdfViewer && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div 
            ref={pdfModalRef}
            className="bg-white rounded-4 p-4 shadow" 
            style={{ maxWidth: "90%", maxHeight: "90%", overflow: "auto", width: "800px" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">
                {imageSource ? "Image Viewer" : "Document Viewer"} - {selectedRequest?.boatName || 'Selected Request'}
              </h5>
              <button className="btn-close" onClick={() => {
                setShowPdfViewer(false);
                setPdfSource(null);
                setImageSource(null);
                setPdfError(null);
              }} aria-label="Close"></button>
            </div>
            
            {/* Render the main content inside the modal */}
            {renderViewerContent()}

          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-4 shadow" style={{ maxWidth: "400px" }}>
            <h5 className="mb-3">Confirm Action</h5>
            <p>
              Are you sure you want to {actionType === "approve" ? "approve" : "reject"} the 
              boat registration request for <b>{selectedRequest?.boatName || 'this request'}</b>?
            </p>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button className="btn btn-outline-secondary" onClick={cancelAction}>
                Cancel
              </button>
              <button 
                className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={confirmAction}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="w-100 mx-3 my-4 rounded-5"
        style={{
          maxWidth: "1200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          overflowY: "auto",
          maxHeight: "95vh"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              width="60"
              height="60"
              className="rounded-circle"
              style={{ cursor: "pointer" }}
              onClick={handleBack}
            />
            <h4 className="ms-3 mb-0 text-primary fw-bold d-none d-sm-block">Fisheries Management System</h4>
            <h4 className="ms-3 mb-0 text-primary fw-bold d-block d-sm-none">FMS</h4>
          </div>
          <h2 className="text-center flex-grow-1 fw-bold m-0 fs-4">Boat Registration Requests</h2>
          <div className="d-flex align-items-center">
            <span className="me-2 text-muted d-none d-sm-inline">Admin</span>
            <img
              src={profileImage}
              alt="Profile"
              width="60"
              height="60"
              className="rounded-circle"
            />
          </div>
        </div>

        {/* Filter and Search Row */}
        <div className="row mb-4 g-3">
          <div className="col-md-5 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 col-lg-3">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-3 col-lg-5 text-md-end">
            <span className="text-muted me-2 d-block d-md-inline-block mt-2 mt-md-0">
              {getSortedRequests().length} matching requests
            </span>
          </div>
        </div>

        {/* Selected Request Detail Card */}
        {selectedRequest && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Request Details - {selectedRequest.boatName}</h5>
              <button 
                className="btn-close btn-close-white" 
                onClick={() => setSelectedRequest(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Owner Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{selectedRequest.name}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Email Address</small>
                      <strong>{selectedRequest.email}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Contact Number</small>
                      <strong>{selectedRequest.contact}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">NIC</small>
                      <strong>{selectedRequest.nic}</strong>
                    </div>
                     <div className="mb-2">
                      <small className="text-muted d-block">Address</small>
                      <strong>{selectedRequest.address || "N/A"}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                   <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Boat Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Boat Name</small>
                      <strong>{selectedRequest.boatName}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Length</small>
                      <strong>{selectedRequest.boatLength}{selectedRequest.boatLength !== "N/A" ? " meters" : ""}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Capacity</small>
                      <strong>{selectedRequest.capacity}{selectedRequest.capacity !== "N/A" ? " people" : ""}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Engine Power</small>
                     
                      <strong>{selectedRequest.power}{selectedRequest.power !== "N/A" ? " HP" : ""}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Serial Number</small>
                        <strong>{selectedRequest.serialNumber}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Status</small>
                        <span className={`badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Request Date</small>
                        <strong>{selectedRequest.requestDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                {/* Document & Image Section */}
                <div className="row">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <h6 className="text-primary mb-3">Registration Document</h6>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={openPdfViewer}
                        disabled={!selectedRequest.documentUrl}
                      >
                        <FiEye className="me-2" /> View Document
                      </button>
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={handleDownloadDocument}
                        disabled={!selectedRequest.documentUrl}
                      >
                        <FiDownload className="me-2" /> Download
                      </button>
                    </div>
                    {!selectedRequest.documentUrl && (
                      <p className="text-muted small mt-2">
                        <FiFileText className="me-1" /> No document uploaded
                      </p>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="text-primary mb-3">Boat Image</h6>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={openImageViewer}
                        disabled={!selectedRequest.imageUrl}
                      >
                        <FiEye className="me-2" /> View Image
                      </button>
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={handleDownloadImage}
                        disabled={!selectedRequest.imageUrl}
                      >
                        <FiDownload className="me-2" /> Download
                      </button>
                    </div>
                    {!selectedRequest.imageUrl && (
                      <p className="text-muted small mt-2">
                        <FiFileText className="me-1" /> No image uploaded
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-4 text-end">
                  {selectedRequest.status === "Pending" && (
                    <>
                      <button 
                        className="btn btn-danger me-2" 
                        onClick={initiateRejection}
                      >
                        <FiXCircle className="me-1" /> Reject
                      </button>
                      <button 
                        className="btn btn-success" 
                        onClick={initiateApproval}
                      >
                        <FiCheckCircle className="me-1" /> Approve
                      </button>
                    </>
                  )}
                  {selectedRequest.status !== "Pending" && (
                    <span className="badge bg-secondary me-2">
                      Request already {selectedRequest.status.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
  
          {/* Request Table */}
          <div className="table-responsive rounded">
            <table className="table table-hover bg-white rounded">
              <thead className="table-light">
                <tr>
                  <th 
                    style={{ cursor: "pointer" }} 
                    onClick={() => requestSort("boatName")}
                    className={sortConfig.key === "boatName" ? "text-primary" : ""}
                  >
                    Boat Name
                    {sortConfig.key === "boatName" && (
                      <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`}></i>
                    )}
                  </th>
                  <th 
                    style={{ cursor: "pointer" }} 
                    onClick={() => requestSort("name")}
                    className={sortConfig.key === "name" ? "text-primary" : ""}
                  >
                    Owner
                    {sortConfig.key === "name" && (
                      <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`}></i>
                    )}
                  </th>
                  <th 
                    style={{ cursor: "pointer" }} 
                    onClick={() => requestSort("requestDate")}
                    className={sortConfig.key === "requestDate" ? "text-primary" : ""}
                  >
                    Date
                    {sortConfig.key === "requestDate" && (
                      <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`}></i>
                    )}
                  </th>
                  <th 
                    style={{ cursor: "pointer" }} 
                    onClick={() => requestSort("status")}
                    className={sortConfig.key === "status" ? "text-primary" : ""}
                  >
                    Status
                    {sortConfig.key === "status" && (
                      <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1`}></i>
                    )}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedRequests().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No matching requests found.
                    </td>
                  </tr>
                ) : (
                  getSortedRequests().map((request) => (
                    <tr 
                      key={request.id}
                      onClick={() => handleRequestClick(request)}
                      className={selectedRequest?.id === request.id ? "table-active" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                            style={{ width: "35px", height: "35px" }}
                          >
                            <span className="text-primary fw-bold">{request.boatName.charAt(0)}</span>
                          </div>
                          {request.boatName}
                        </div>
                      </td>
                      <td>{request.name}</td>
                      <td>{request.requestDate}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestClick(request);
                          }}
                        >
                          Details
                        </button>
                        {request.status === "Pending" && (
                          <>
                            <button 
                              className="btn btn-sm btn-outline-success me-1 d-none d-md-inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestClick(request);
                                initiateApproval();
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger d-none d-md-inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestClick(request);
                                initiateRejection();
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-center">
            <button className="btn btn-primary" onClick={handleBack}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default RequestPanel;