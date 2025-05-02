import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg"; // Assuming these paths are correct
import logoImage from "./logo.png";           // Assuming these paths are correct
import profileImage from "./profile.png";       // Assuming these paths are correct
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiRefreshCcw } from "react-icons/fi"; // Added FiRefreshCcw for retry
import { Document, Page, pdfjs } from "react-pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Set up PDF.js worker - Ensure this URL is accessible
// Using a reliable CDN like jsdelivr or cdnjs is crucial
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Firebase configuration - Ensure this is secure in a real app (e.g., using environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Replace with your actual API Key
  authDomain: "finalproject-4453c.firebaseapp.com", // Replace with your actual Auth Domain
  projectId: "finalproject-4453c",                 // Replace with your actual Project ID
  storageBucket: "finalproject-4453c.appspot.com",   // Replace with your actual Storage Bucket
  messagingSenderId: "866850090007",          // Replace with your actual Messaging Sender ID
  appId: "1:866850090007:web:111a4fcef7be69de0a8052", // Replace with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // auth is not used in this component currently, but kept for potential future use
const db = getFirestore(app);

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
  const [pdfSource, setPdfSource] = useState(null); // Use pdfSource instead of pdfUrl for flexibility
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  
  const pdfModalRef = useRef(null);

  useEffect(() => {
    const fetchBoatData = async () => {
      try {
        setLoading(true); // Ensure loading is true when fetching starts
        const boatCollection = collection(db, "boat");
        const boatSnapshot = await getDocs(boatCollection);
        
        const boatList = boatSnapshot.docs.map(doc => {
          const data = doc.data();
          // Safely access nested data or use defaults
          const requestDate = data.requestDate ? 
            (data.requestDate instanceof Date ? data.requestDate.toLocaleDateString() : new Date(data.requestDate).toLocaleDateString()) 
            : new Date().toLocaleDateString();

          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.name || "Unknown",
            boatName: data.boatName || "Unnamed boat",
            contact: data.contact || "No contact",
            document: data.document || null,
            boatLength: data.boatLength || "N/A",
            capacity: data.capacity || "N/A",
            power: data.power || "N/A",
            serialNumber: data.serialNumber || "N/A",
            nic: data.nic || "N/A",
            address: data.address || "N/A",
            status: data.status || "Pending",
            requestDate: requestDate // Use processed date
          };
        });
        
        setRequests(boatList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching boat data:", err);
        setError("Failed to load request data. Please try again later.");
        setLoading(false);
      }
    };

    fetchBoatData();
  }, []); // Empty dependency array means this runs once on mount

  // Process URL for viewing or downloading
  const processDocumentUrl = (url, type = 'view') => {
    if (!url) return null;
    
    // Basic check if it looks like a web URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn("Document URL doesn't start with http(s)://", url);
        return null; // Or return url, depending on how you want to handle malformed links
    }

    // Check if it's a Google Drive URL
    if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
      let fileId = "";
      
      // Extract the file ID from common Google Drive URL formats
      const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      } else {
        console.warn("Could not extract Google Drive file ID from URL:", url);
        return url; // Return original URL if ID extraction fails
      }
      
      // Construct the correct Google Drive export URL
      if (type === 'view') {
        // Use the 'export=view' for viewing in iframes or potentially react-pdf
        // This format is generally more reliable for embedding than /preview
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      } else if (type === 'download') {
        // Use 'export=download' for direct download
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    
    // If not a Google Drive URL or extraction failed/type is unknown, return the original URL
    return url;
  };

  // PDF functions
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null); // Clear any previous error
    setCurrentPage(1); // Reset to first page on new document load
    console.log("PDF loaded successfully. Total pages:", numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    setPdfLoading(false);
    // Set a user-friendly error message
    let userErrorMessage = "Failed to load document.";
    if (error.message && error.message.includes("status 403")) {
         userErrorMessage += " (Permission denied - check file sharing settings)";
    } else if (error.message && error.message.includes("status 404")) {
         userErrorMessage += " (File not found)";
    } else if (error.message) {
         userErrorMessage += ` (${error.message})`; // Include browser/react-pdf error if available
    }

    setPdfError(userErrorMessage);
    toast.error(userErrorMessage); // Also show a toast notification
  };

  const changePage = (offset) => {
    setCurrentPage(prevPage => {
      const newPage = prevPage + offset;
      return newPage >= 1 && newPage <= numPages ? newPage : prevPage;
    });
  };

  // Handle document view
  const openPdfViewer = () => {
    if (selectedRequest && selectedRequest.document) {
      setPdfLoading(true);
      setPdfError(null);
      setCurrentPage(1);
      setNumPages(null);
      
      // Process the URL for viewing (prioritizing uc?export=view for GDrive)
      const processedUrl = processDocumentUrl(selectedRequest.document, 'view');
      
      if (processedUrl) {
        setPdfSource(processedUrl);
        setShowPdfViewer(true);
        console.log("Attempting to load PDF from:", processedUrl);
      } else {
        setPdfLoading(false); // Stop loading if URL processing failed
        const errorMsg = "Invalid or unprocessable document URL.";
        setPdfError(errorMsg);
        toast.error(errorMsg);
      }
    } else {
      toast.error("No document available to view");
    }
  };

  // Handle document download
  const handleDownloadDocument = () => {
    if (selectedRequest && selectedRequest.document) {
      // Process the URL specifically for download (prioritizing uc?export=download for GDrive)
      const downloadUrl = processDocumentUrl(selectedRequest.document, 'download');
      
      if (downloadUrl) {
         console.log("Attempting to download from:", downloadUrl);
        // Open in new tab for download
        window.open(downloadUrl, '_blank');
      } else {
         toast.error("Could not generate download URL.");
      }

    } else {
      toast.error("No document available to download");
    }
  };

  // Retry loading PDF
  const retryPdfLoading = () => {
      if (selectedRequest && selectedRequest.document) {
          openPdfViewer(); // Simply call the open logic again
      }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    // Reset PDF viewer state when a new request is selected
    setShowPdfViewer(false);
    setPdfSource(null);
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
      setSelectedRequest(prev => ({...prev, status: newStatus})); // Update selected request state
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
    navigate("/Dashboard"); // Ensure this route is correct
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
        request.status, // Allow searching by status too
        request.requestDate, // Allow searching by date
        request.nic, // Allow searching by NIC
        request.serialNumber // Allow searching by Serial Number
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

      // Handle potential null/undefined or non-comparable types if necessary
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Basic comparison
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0; // values are equal
    });

    return sorted;
  };

  // Close PDF viewer when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the modal content area
      if (pdfModalRef.current && !pdfModalRef.current.contains(event.target)) {
        setShowPdfViewer(false);
        setPdfSource(null); // Clear source on close
        setPdfError(null); // Clear error on close
      }
    };

    if (showPdfViewer) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPdfViewer]); // Re-run effect when showPdfViewer changes

  // Improved PDF viewer display with fallback options
  const renderPdfViewerContent = () => {
    if (pdfLoading) {
      return (
        <div className="text-center my-5">
          <div className="spinner-border"></div>
          <p className="mt-2">Loading document...</p>
        </div>
      );
    }
    
    if (pdfError) {
      return (
        <div className="alert alert-danger my-4 text-start"> {/* Align text left */}
          <h5 className="alert-heading">Error Loading PDF</h5>
          <p>{pdfError}</p> {/* Display specific error message */}
          
          <hr />
          
          <p className="mb-3">Possible solutions:</p>
          <ul className="mb-3">
              <li>Ensure the file exists at the provided URL.</li>
              <li>If it's a Google Drive file, check that the sharing setting is "Anyone with the link can view".</li>
              <li>Try downloading the document and opening it directly.</li>
              <li>The file might not be a standard PDF or is corrupted.</li>
          </ul>

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button 
              className="btn btn-outline-primary"
              onClick={retryPdfLoading} // Add a retry button
            >
              <FiRefreshCcw className="me-1" /> Retry Loading
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={handleDownloadDocument}
            >
              <FiDownload className="me-1" /> Download Document
            </button>
          </div>
          
          {/* Alternate option - try displaying as an iframe if a URL exists */}
          {pdfSource && (
            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-2">Alternative Viewer (Experimental)</h6>
              <p className="small text-muted mb-2">
                 Attempting to display using browser's native capabilities or Google Drive's viewer.
              </p>
              <iframe
                src={pdfSource} // Use the same processed URL
                title="Document Viewer Fallback" 
                width="100%" 
                height="500px"
                className="border rounded"
                allowFullScreen // Allow full screen
                sandbox="allow-scripts allow-same-origin allow-presentation" // Recommended sandbox attributes
                onError={(e) => console.error("iFrame Error:", e)} // Log iframe errors
              />
            </div>
          )}
        </div>
      );
    }
    
    // Successfully loaded or currently rendering
    return (
      <>
         {/* PDF Controls */}
        {numPages && ( // Only show controls if pages are loaded
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
        <div className="border rounded p-2 d-flex justify-content-center" style={{ minHeight: '300px' }}> {/* Add a min-height */}
            {/* pdfSource is checked implicitly by <Document file={...}> */}
             <Document
                file={pdfSource} // Use pdfSource
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                // Custom loading component can be useful
                loading={<div className="text-center my-5"><div className="spinner-border"></div><p>Loading PDF...</p></div>}
                // NoData component can be added if file prop is null/undefined
                noData={() => <div className="alert alert-info text-center">No PDF file source provided.</div>}
             >
                {/* Only render Page if numPages is available and pdfError is null */}
                {numPages && !pdfError && (
                   <Page 
                      pageNumber={currentPage} 
                      scale={1.2} // Adjust scale as needed
                      renderTextLayer={false} // Set to true if you need text selection/search
                      renderAnnotationLayer={false}
                      className="d-flex justify-content-center"
                      // Add onError handler for page rendering if needed
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
      
      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div 
            ref={pdfModalRef}
            className="bg-white rounded-4 p-4 shadow" 
            style={{ maxWidth: "90%", maxHeight: "90%", overflow: "auto", width: "800px" }} // Set a default max width
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Document Viewer - {selectedRequest?.boatName || 'Selected Request'}</h5> {/* Use optional chaining */}
              <button className="btn-close" onClick={() => {
                setShowPdfViewer(false);
                setPdfSource(null);
                setPdfError(null);
              }} aria-label="Close"></button>
            </div>
            
            {/* Render the main PDF content inside the modal */}
            {renderPdfViewerContent()}

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
        className="w-100 mx-3 my-4 rounded-5" // Added my-4 for vertical spacing
        style={{
          maxWidth: "1200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          overflowY: "auto", // Allow scrolling within the main panel if content overflows vertically
          maxHeight: "95vh" // Limit height to fit viewport
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
            <h4 className="ms-3 mb-0 text-primary fw-bold d-none d-sm-block">Fisheries Management System</h4> {/* Hide on small screens */}
            <h4 className="ms-3 mb-0 text-primary fw-bold d-block d-sm-none">FMS</h4> {/* Show on small screens */}
          </div>
          <h2 className="text-center flex-grow-1 fw-bold m-0 fs-4">Boat Registration Requests</h2> {/* Adjusted font size */}
          <div className="d-flex align-items-center">
            <span className="me-2 text-muted d-none d-sm-inline">Admin</span> {/* Hide on small screens */}
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
        <div className="row mb-4 g-3"> {/* Added g-3 for gutter */}
          <div className="col-md-5 col-lg-4"> {/* Adjusted column sizes */}
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i> {/* Ensure bootstrap icons are included if using bi classes */}
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
          <div className="col-md-4 col-lg-3"> {/* Adjusted column sizes */}
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
          <div className="col-md-3 col-lg-5 text-md-end"> {/* Adjusted column sizes */}
            <span className="text-muted me-2 d-block d-md-inline-block mt-2 mt-md-0"> {/* Display block on small, inline on md+ */}
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
                  <div className="d-flex flex-column"> {/* Removed h-100 for better flex behavior */}
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
                   <div className="d-flex flex-column"> {/* Removed h-100 */}
                    <h6 className="text-primary mb-3">Boat Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Boat Name</small>
                      <strong>{selectedRequest.boatName}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Length</small>
                      <strong>{selectedRequest.boatLength}{selectedRequest.boatLength !== "N/A" ? " meters" : ""}</strong> {/* Add unit if not N/A */}
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Capacity</small>
                      <strong>{selectedRequest.capacity}{selectedRequest.capacity !== "N/A" ? " people" : ""}</strong> {/* Add unit if not N/A */}
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Engine Power</small>
                      <strong>{selectedRequest.power}{selectedRequest.power !== "N/A" ? " HP" : ""}</strong> {/* Add unit if not N/A */}
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Serial Number</small>
                      <strong>{selectedRequest.serialNumber}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration Status</small>
                      <span className={`badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center"> {/* Align items differently on small/md */}
                    <div className="mb-3 mb-md-0"> {/* Add margin bottom on small screens */}
                      <h6 className="text-primary mb-2">Documentation</h6>
                      <p className="mb-0 small">
                        {selectedRequest.document ? 
                          "Document attached to this registration request." : 
                          "No documents attached to this request."}
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={openPdfViewer}
                        disabled={!selectedRequest.document}
                        title={selectedRequest.document ? "View Document" : "No document available"} // Add tooltip
                      >
                        <FiEye className="me-1" /> View
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleDownloadDocument}
                        disabled={!selectedRequest.document}
                        title={selectedRequest.document ? "Download Document" : "No document available"} // Add tooltip
                      >
                        <FiDownload className="me-1" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRequest.status === "Pending" && (
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    className="btn btn-danger"
                    onClick={initiateRejection}
                  >
                    <FiXCircle className="me-1" /> Reject Request
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={initiateApproval}
                  >
                    <FiCheckCircle className="me-1" /> Approve Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle"> {/* Added align-middle */}
            <thead className="table-dark">
              <tr>
                <th 
                  scope="col" 
                  onClick={() => requestSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Owner {sortConfig.key === 'name' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col">Email</th>
                <th 
                  scope="col"
                  onClick={() => requestSort('boatName')}
                  style={{ cursor: 'pointer' }}
                >
                  Boat Name {sortConfig.key === 'boatName' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col"
                  onClick={() => requestSort('requestDate')}
                  style={{ cursor: 'pointer' }}
                >
                  Request Date {sortConfig.key === 'requestDate' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col"
                  onClick={() => requestSort('status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {sortConfig.key === 'status' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col">Documents</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedRequests().length > 0 ? (
                getSortedRequests().map((request) => (
                  <tr key={request.id} style={{ cursor: "pointer" }}>
                    <td onClick={() => handleRequestClick(request)}>{request.name}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.email}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.boatName}</td>
                    <td onClick={() => handleRequestClick(request)}>{request.requestDate}</td>
                    <td onClick={() => handleRequestClick(request)}>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td onClick={() => handleRequestClick(request)}>
                      {request.document ? (
                        <FiFileText className="text-primary" size={18} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {/* Action button remains clickable */}
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRequestClick(request)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    {searchTerm || filterStatus !== "All" ? 
                      "No matching registration requests found" : 
                      "No registration requests found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-top text-center">
          <p className="text-muted mb-0 small">
            Fisheries Management System • v2.5.0 • © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;