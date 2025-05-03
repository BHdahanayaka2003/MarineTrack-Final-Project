import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
// No need to import getAuth if not used for auth in this component
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Removed addDoc since we'll use Email.js
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiRefreshCcw } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // Ensure bootstrap icons are included
import emailjs from '@emailjs/browser'; // Import Email.js

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
const db = getFirestore(app);
const storage = getStorage(app);

// Email.js configuration
const EMAIL_SERVICE_ID = "service_znfqdnc"; // Your Email.js service ID
const EMAIL_TEMPLATE_ID = "template_crtrt7k"; // You'll need to create this template in Email.js
const EMAIL_USER_ID = "BAak8o95YOEPNz3DxxhF9"; // Replace with your Email.js user ID

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Added state for button loading indicator

  // State specifically for PDF viewing
  const [pdfSource, setPdfSource] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [imageSource, setImageSource] = useState(null);

  const pdfModalRef = useRef(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchBoatData = async () => {
      try {
        setLoading(true);
        const boatCollection = collection(db, "boat");
        const boatSnapshot = await getDocs(boatCollection);

        const boatList = boatSnapshot.docs.map((doc) => {
          const data = doc.data();

          // Process date: Assuming requestDate might be a Firestore Timestamp
          const requestDate = data.requestDate ?
            (data.requestDate.toDate ? data.requestDate.toDate().toLocaleDateString() : new Date(data.requestDate).toLocaleDateString())
            : new Date().toLocaleDateString(); // Fallback to current date

          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.name || "Unknown",
            boatName: data.boatName || "Unnamed boat",
            contact: data.contact || "No contact",
            documentUrl: data.documentUrl || null,
            imageUrl: data.imageUrl || null,
            boatLength: data.boatLength || "N/A",
            capacity: data.capacity || "N/A",
            power: data.power || "N/A",
            serialNumber: data.serialNumber || "N/A",
            nic: data.nic || "N/A",
            address: data.address || "N/A",
            status: data.status || "Pending",
            requestDate: requestDate,
            // Keep original Firestore timestamp if available for sorting purposes, if needed later
             _requestDateTimestamp: data.requestDate && data.requestDate.toDate ? data.requestDate.toDate() : new Date(data.requestDate),
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
  }, []);

  // Function to get download URL from Firebase Storage
  const getFirebaseStorageUrl = async (storagePath) => {
    try {
      if (!storagePath) return null;

      // Check if the path is already a URL
      if (storagePath.startsWith('http')) {
        // It might be a direct HTTP URL or a pre-signed URL.
        // If it's a storage path starting with 'gs://' or just a path like 'images/foo.jpg',
        // the ref(storage, storagePath) handles it correctly.
        // If it's already a long download URL from a previous getDownloadURL call stored in db,
        // ref() might not handle it, but window.open will. Let's assume documentUrl/imageUrl
        // stores either the storage path or a permanent download URL if generated once.
        // The ref approach is safer if the DB stores paths.
        try {
             const storageRef = ref(storage, storagePath);
             const downloadUrl = await getDownloadURL(storageRef);
             console.log(`Generated download URL for ${storagePath}:`, downloadUrl);
             return downloadUrl;
        } catch(e) {
            // If ref fails (e.g., it was already a http URL that ref can't parse as a path),
            // assume it's already a valid URL.
            if (storagePath.startsWith('http')) {
                 console.log(`Assuming storagePath is already a valid HTTP URL: ${storagePath}`);
                 return storagePath;
            }
             console.error("Error resolving storage path:", e);
             throw e; // Re-throw if it wasn't an http URL and ref failed
        }

      } else {
          // Assume it's a storage path
          const storageRef = ref(storage, storagePath);
          const downloadUrl = await getDownloadURL(storageRef);
          console.log(`Generated download URL for ${storagePath}:`, downloadUrl);
          return downloadUrl;
      }

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
    if (error.message) {
        userErrorMessage += ` (${error.message.substring(0, 100)}...)`; // Truncate long messages
    }
    if (error.code) {
         userErrorMessage += ` [Code: ${error.code}]`;
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

        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.documentUrl);

        if (downloadUrl) {
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
            // Treat as image
            setImageSource(downloadUrl);
            setShowPdfViewer(true);
            setPdfLoading(false); // No PDF.js loading needed for images
            setPdfError(null); // Clear potential previous PDF error
            console.log("Attempting to load image from:", downloadUrl);
          } else {
            // Unknown type, try loading as PDF anyway (might fail)
             setPdfSource(downloadUrl);
             setImageSource(null); // Ensure image source is clear
             setShowPdfViewer(true);
             console.log("Attempting to load unknown document type as PDF from:", downloadUrl);
          }
        } else {
          setPdfLoading(false);
          const errorMsg = "Failed to retrieve document URL.";
          setPdfError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        setPdfLoading(false);
        setPdfError(`Failed to initiate document loading: ${error.message}`);
        toast.error(`Failed to initiate document loading: ${error.message}`);
      }
    } else {
      toast.error("No document available to view");
    }
  };

  // Open uploaded image
  const openImageViewer = async () => {
    if (selectedRequest && selectedRequest.imageUrl) {
      try {
        setPdfLoading(true); // Use pdfLoading state for any viewer loading
        setPdfError(null);
        setPdfSource(null); // Clear any PDF source
        setNumPages(null);

        const downloadUrl = await getFirebaseStorageUrl(selectedRequest.imageUrl);

        if (downloadUrl) {
          setImageSource(downloadUrl);
          setShowPdfViewer(true);
          setPdfLoading(false); // Image loading doesn't use PDF.js
          console.log("Attempting to load image from:", downloadUrl);
        } else {
          setPdfLoading(false);
          const errorMsg = "Failed to retrieve image URL.";
          setPdfError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        setPdfLoading(false);
        setPdfError(`Failed to initiate image loading: ${error.message}`);
        toast.error(`Failed to initiate image loading: ${error.message}`);
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
          toast.error("Could not generate download URL for document.");
        }
      } catch (error) {
        console.error("Download document failed:", error);
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
          toast.error("Could not generate download URL for image.");
        }
      } catch (error) {
         console.error("Download image failed:", error);
        toast.error(`Download failed: ${error.message}`);
      }
    } else {
      toast.error("No image available to download");
    }
  };


  const retryLoading = () => {
    if (selectedRequest) {
      // Determine which content source was being used before the error
      if (pdfSource) {
        openPdfViewer(); // Re-attempt PDF loading
      } else if (imageSource) {
         openImageViewer(); // Re-attempt image loading
      } else if (selectedRequest.documentUrl && !imageSource) {
         // If there was a document URL but no source loaded yet (initial failed attempt?)
         openPdfViewer(); // Try viewing as document (could be pdf or image)
      } else if (selectedRequest.imageUrl && !pdfSource) {
          // If there was an image URL but no source loaded yet
          openImageViewer(); // Try viewing as image
      } else {
           toast.info("No specific content selected to retry loading.");
      }
    } else {
       toast.error("No request selected to retry loading content.");
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

  // Helper function to send email using Email.js
  const sendEmail = async (recipientEmail, recipientName, boatName, status) => {
    if (!recipientEmail || recipientEmail === "No email provided") {
      console.warn("No valid email to send notification to");
      return false;
    }

    try {
      // Prepare email parameters
      const emailSubject = `Update on Your Boat Registration Request for ${boatName}`;
      let emailBody = '';
      
      if (status === "Approved") {
        emailBody = `We are pleased to inform you that your boat registration request for "${boatName}" has been Approved. You can now proceed with the next steps as required by the Fisheries Management System. Thank you for your patience.`;
      } else {
        emailBody = `Regarding your boat registration request for "${boatName}", we regret to inform you that it has been Rejected. Please check the system or contact the administration for more details regarding the rejection reason. Thank you for your understanding.`;
      }

      const templateParams = {
        to_email: recipientEmail,
        to_name: recipientName,
        subject: emailSubject,
        message: emailBody,
        boat_name: boatName,
        status: status
      };

      const response = await emailjs.send(
        EMAIL_SERVICE_ID,
        EMAIL_TEMPLATE_ID,
        templateParams,
        EMAIL_USER_ID
      );

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsUpdatingStatus(true); // Indicate loading
    const newStatus = actionType === "approve" ? "Approved" : "Rejected";
    
    try {
        // 1. Update status in 'boat' collection
        const requestRef = doc(db, "boat", selectedRequest.id);
        await updateDoc(requestRef, {
            status: newStatus
        });

        // 2. Send email using Email.js
        const recipientEmail = selectedRequest.email;
        const recipientName = selectedRequest.name || 'Applicant';
        const boatName = selectedRequest.boatName || 'your boat registration request';

        if (recipientEmail && recipientEmail !== "No email provided") {
            const emailSent = await sendEmail(recipientEmail, recipientName, boatName, newStatus);
            
            if (emailSent) {
                toast.success(`Request ${newStatus.toLowerCase()} successfully and email notification sent.`);
            } else {
                toast.warn(`Request ${newStatus.toLowerCase()} successfully, but failed to send email notification.`);
            }
        } else {
            toast.success(`Request ${newStatus.toLowerCase()} successfully. No valid email address was found to send a notification.`);
        }

        // Update local state
        setRequests(requests.map(req =>
            req.id === selectedRequest.id ? { ...req, status: newStatus } : req
        ));
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));

    } catch (err) {
        console.error("Error updating status or sending email:", err);
        toast.error(`Failed to ${actionType} request. Please try again.`);
    } finally {
        setIsUpdatingStatus(false); // Stop loading
        setShowConfirmation(false);
        setActionType(null);
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

      // Handle dates for sorting, assuming _requestDateTimestamp is Date objects
      if (sortConfig.key === 'requestDate') {
         const dateA = a._requestDateTimestamp;
         const dateB = b._requestDateTimestamp;

          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return sortConfig.direction === 'asc' ? -1 : 1;
          if (dateB == null) return sortConfig.direction === 'asc' ? 1 : -1;

          if (dateA < dateB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;

      } else {
        // General string/number sorting
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
      }
    });

    return sorted;
  };

  // Close viewer when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the modal content but inside the overlay
      if (pdfModalRef.current && !pdfModalRef.current.contains(event.target) && showPdfViewer) {
         // Check if the click was outside the specific ref element
         const modalContent = pdfModalRef.current;
         let isOutside = true;
         let targetElement = event.target;
         while(targetElement) {
             if (targetElement === modalContent) {
                 isOutside = false;
                 break;
             }
             targetElement = targetElement.parentElement;
         }

         if (isOutside) {
            setShowPdfViewer(false);
            setPdfSource(null);
            setImageSource(null);
            setPdfError(null);
            setNumPages(null); // Also reset page count
         }
      }
    };

    if (showPdfViewer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPdfViewer]); // Depend on showPdfViewer state


  // Render viewer content (PDF or Image)
  const renderViewerContent = () => {
    if (pdfLoading) {
      return (
        <div className="text-center my-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2 text-muted">Loading content...</p>
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
          <ul className="mb-3 small">
            <li>Ensure the file exists in Firebase Storage at the correct path.</li>
            <li>Verify your Firebase Storage security rules allow this application to read the file.</li>
            <li>The file might be corrupted or not in a valid format (PDF/Image).</li>
            <li>Try downloading the file instead of viewing it.</li>
          </ul>

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button
              className="btn btn-outline-primary"
              onClick={retryLoading}
            >
              <FiRefreshCcw className="me-1" /> Retry Loading
            </button>
            {selectedRequest?.documentUrl && ( // Offer document download if URL exists
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleDownloadDocument}
                >
                  <FiDownload className="me-1" /> Download Document
                </button>
            )}
            {selectedRequest?.imageUrl && !selectedRequest?.documentUrl && ( // Offer image download if only image URL exists
                 <button
                  className="btn btn-outline-secondary"
                  onClick={handleDownloadImage}
                >
                  <FiDownload className="me-1" /> Download Image
                </button>
            )}
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
            alt="Boat Registration Document or Image" // More general alt text
            className="img-fluid rounded border"
            style={{ maxHeight: '70vh', maxWidth: '100%' }} // Ensure image fits within modal width too
            onError={(e) => {
              console.error("Image failed to load:", e);
              setPdfError("Failed to load image. The image might be corrupted, the URL is invalid, or you lack access permissions.");
              e.target.style.display = 'none'; // Hide broken image icon
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
              <span className="ms-3 text-muted">
                Page {currentPage} of {numPages}
              </span>
            </div>
          )}

          {/* PDF Document */}
          <div className="border rounded p-2 d-flex justify-content-center" style={{ minHeight: '300px', overflow: 'hidden' }}> {/* Added overflow:hidden to prevent scrollbars around the document component itself */}
            <Document
              file={pdfSource}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-center my-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Loading PDF...</p></div>}
              noData={() => <div className="alert alert-info text-center m-0">No PDF file source provided or document is empty.</div>} // Added m-0 to reduce margin
            >
              {/* Only render the Page component if numPages is known and there's no error */}
              {numPages !== null && !pdfError && (
                <Page
                  pageNumber={currentPage}
                  scale={1.2} // Adjust scale as needed for modal size
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="d-flex justify-content-center"
                   // Add error handler for page rendering itself
                  onError={(err) => {
                      console.error("PDF Page rendering error:", err);
                      setPdfError("Error rendering PDF page. The document might be invalid.");
                  }}
                />
              )}
            </Document>
          </div>

          {/* Download Hint */}
          {pdfSource && (
            <div className="mt-3 text-center">
              <small className="text-muted">
                If you have trouble viewing this document, try downloading it.
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

    // No content to display fallback
    return (
      <div className="alert alert-info text-center m-4">
        No content selected for viewing. Please select a request with a document or image.
      </div>
    );
  };


  // Check if any action is currently being processed to disable buttons
  const isActionInProgress = isUpdatingStatus;


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
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      {/* Content Viewer Modal */}
      {showPdfViewer && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
             style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div
            ref={pdfModalRef}
            className="bg-white rounded-4 p-4 shadow"
            style={{ maxWidth: "90%", maxHeight: "90%", overflowY: "auto", width: "800px" }} // Added overflowY auto
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 text-primary fw-bold">
                {imageSource ? "Image Viewer" : "Document Viewer"}
                {selectedRequest?.boatName && ` - ${selectedRequest.boatName}`}
              </h5>
              <button
                className="btn-close"
                onClick={() => {
                  setShowPdfViewer(false);
                  setPdfSource(null);
                  setImageSource(null);
                  setPdfError(null);
                  setNumPages(null); // Reset numPages
                }}
                aria-label="Close"
              ></button>
            </div>

            {/* Render the main content inside the modal */}
            {renderViewerContent()}

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
        <div className="bg-white rounded-4 p-4 shadow" style={{ maxWidth: "400px" }}>
          <h5 className="mb-3 text-center">
            {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
          </h5>
          <p className="mb-4">
            Are you sure you want to {actionType === "approve" ? "approve" : "reject"} the boat registration request for
            <strong> {selectedRequest?.boatName || "this boat"}</strong>?
            
            {actionType === "approve" 
              ? " This will grant the boat owner permission to proceed with registration."
              : " The applicant will be notified about this rejection."}
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button 
              className="btn btn-secondary" 
              onClick={cancelAction}
              disabled={isUpdatingStatus}
            >
              Cancel
            </button>
            <button 
              className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`} 
              onClick={confirmAction}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <>
                      <FiCheckCircle className="me-1" /> Approve
                    </>
                  ) : (
                    <>
                      <FiXCircle className="me-1" /> Reject
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    <div
      className="container-fluid bg-white rounded-4 shadow-lg p-4"
      style={{ maxWidth: "1400px", maxHeight: "90vh", overflow: "auto" }}
    >
      {/* Header with logo and back button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <img
            src={logoImage}
            alt="Fisheries Management System Logo"
            style={{ width: "50px", height: "auto" }}
            className="me-3"
          />
          <h2 className="m-0 text-primary fw-bold">Boat Registration Approval Portal</h2>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={handleBack}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Search and filters */}
      <div className="row mb-4">
        <div className="col-md-5 mb-2 mb-md-0">
          <div className="input-group">
            <span className="input-group-text bg-primary text-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, boat, NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3 mb-2 mb-md-0">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-4 text-end">
          <span className="text-muted me-2">
            Total Requests: {getSortedRequests().length}
          </span>
          <span className="badge bg-warning mx-1">
            Pending: {requests.filter(r => r.status === "Pending").length}
          </span>
          <span className="badge bg-success mx-1">
            Approved: {requests.filter(r => r.status === "Approved").length}
          </span>
          <span className="badge bg-danger mx-1">
            Rejected: {requests.filter(r => r.status === "Rejected").length}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="row">
        {/* Request List */}
        <div className="col-md-5 mb-4 mb-md-0">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Registration Requests</h5>
            </div>
            <div className="card-body p-0" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2 text-muted">Loading requests...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger m-3">{error}</div>
              ) : getSortedRequests().length === 0 ? (
                <div className="alert alert-info m-3">
                  No requests found. {searchTerm && 'Try adjusting your search.'}
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {getSortedRequests().map((request) => (
                    <button
                      key={request.id}
                      className={`list-group-item list-group-item-action border-bottom py-3 ${
                        selectedRequest?.id === request.id ? "active" : ""
                      }`}
                      onClick={() => handleRequestClick(request)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">{request.boatName || "Unnamed boat"}</h6>
                        <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                          {request.status || "Pending"}
                        </span>
                      </div>
                      <small>
                        <strong>Owner:</strong> {request.name}
                      </small>
                      <br />
                      <small>
                        <strong>Date:</strong> {request.requestDate}
                      </small>
                      <br />
                      <small className="text-muted">ID: {request.id.substring(0, 8)}...</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Request Details</h5>
              {selectedRequest && (
                <span className={`badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              )}
            </div>
            <div className="card-body">
              {!selectedRequest ? (
                <div className="text-center py-5 text-muted">
                  <FiFileText size={40} className="mb-3" />
                  <h5>Select a request to view details</h5>
                </div>
              ) : (
                <>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="card bg-light border-0">
                        <div className="card-body py-2">
                          <h6 className="card-subtitle mb-2 text-muted">Boat Information</h6>
                          <p className="mb-1">
                            <strong>Name:</strong> {selectedRequest.boatName}
                          </p>
                          <p className="mb-1">
                            <strong>Length:</strong> {selectedRequest.boatLength}
                          </p>
                          <p className="mb-1">
                            <strong>Capacity:</strong> {selectedRequest.capacity}
                          </p>
                          <p className="mb-1">
                            <strong>Power:</strong> {selectedRequest.power}
                          </p>
                          <p className="mb-0">
                            <strong>Serial Number:</strong> {selectedRequest.serialNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="card bg-light border-0">
                        <div className="card-body py-2">
                          <h6 className="card-subtitle mb-2 text-muted">Owner Information</h6>
                          <p className="mb-1">
                            <strong>Name:</strong> {selectedRequest.name}
                          </p>
                          <p className="mb-1">
                            <strong>NIC:</strong> {selectedRequest.nic}
                          </p>
                          <p className="mb-1">
                            <strong>Contact:</strong> {selectedRequest.contact}
                          </p>
                          <p className="mb-1">
                            <strong>Email:</strong> {selectedRequest.email}
                          </p>
                          <p className="mb-0">
                            <strong>Address:</strong> {selectedRequest.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <h6 className="border-bottom pb-2 mb-2">Documentation</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedRequest.documentUrl && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={openPdfViewer}
                            >
                              <FiEye className="me-1" /> View Document
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleDownloadDocument}
                            >
                              <FiDownload className="me-1" /> Download Document
                            </button>
                          </>
                        )}
                        {selectedRequest.imageUrl && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={openImageViewer}
                            >
                              <FiEye className="me-1" /> View Image
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleDownloadImage}
                            >
                              <FiDownload className="me-1" /> Download Image
                            </button>
                          </>
                        )}
                        {!selectedRequest.documentUrl && !selectedRequest.imageUrl && (
                          <span className="text-muted fst-italic">No documents available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex justify-content-end mt-3 border-top pt-3">
                    {selectedRequest.status === "Pending" ? (
                      <>
                        <button
                          className="btn btn-danger me-2"
                          onClick={initiateRejection}
                          disabled={isActionInProgress}
                        >
                          {isActionInProgress && actionType === "reject" ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiXCircle className="me-1" /> Reject
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={initiateApproval}
                          disabled={isActionInProgress}
                        >
                          {isActionInProgress && actionType === "approve" ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiCheckCircle className="me-1" /> Approve
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="alert alert-info mb-0 py-2">
                        This request has already been {selectedRequest.status.toLowerCase()}.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default RequestPanel;