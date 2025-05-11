import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg"; // Make sure this path is correct
import logoImage from "./logo.png"; // Make sure this path is correct
import profileImage from "./profile.png"; // Make sure this path is correct (if used elsewhere)
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
// UPDATED Firestore imports: Added runTransaction, getDoc
import { getFirestore, collection, getDocs, doc, updateDoc, runTransaction, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiRefreshCcw } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // Ensure bootstrap icons are included
import emailjs from '@emailjs/browser'; // Import Email.js

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Firebase configuration (Ensure this is securely managed, e.g., via environment variables)
const firebaseConfig = {
    apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Replace with your actual API key
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

// Email.js configuration (Ensure these are securely managed)
const EMAIL_SERVICE_ID = "service_1e7zx8q"; // Your Email.js service ID
const EMAIL_TEMPLATE_ID = "template_gzjiwnf"; // Your Email.js template ID for approval/rejection
const EMAIL_USER_ID = "OGOVI1pv0OlKwpHSQ"; // Your Email.js Public Key (User ID)


// --- NEW: Firestore-based Sequential Boat Registration ID Generator ---
async function generateBoatRegId(firestoreDb) {
    const counterRef = doc(firestoreDb, "counters", "boatRegistrationCounter");
    const prefix = "BOAT";
    const padding = 3; // Number of digits (e.g., 3 for BOAT001)

    try {
        // Use a transaction to atomically read and update the counter
        const newRegId = await runTransaction(firestoreDb, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let nextIdNumber = 1; // Default to 1 if counter doesn't exist

            if (counterDoc.exists()) {
                const currentNumber = counterDoc.data()?.lastIdNumber || 0; // Get current number or default to 0
                nextIdNumber = currentNumber + 1;
            } else {
                console.log("Counter document not found, initializing with ID 1.");
                // If the document doesn't exist, we'll create it with the first ID number
            }

            // Format the new ID (e.g., BOAT001, BOAT010, BOAT100)
            const formattedId = `${prefix}${String(nextIdNumber).padStart(padding, '0')}`;

            // Update the counter document with the new lastIdNumber
            // Use set with merge: true if creating, update if existing
            if (counterDoc.exists()) {
                 transaction.update(counterRef, { lastIdNumber: nextIdNumber });
            } else {
                 transaction.set(counterRef, { lastIdNumber: nextIdNumber }); // Create if not exists
            }


            console.log(`Generated next Boat Registration ID: ${formattedId} (Number: ${nextIdNumber})`);
            return formattedId; // Return the generated ID string
        });

        return newRegId; // Return the ID from the transaction

    } catch (error) {
        console.error("Transaction failed: Error generating sequential boat ID:", error);
        toast.error("Failed to generate sequential Boat ID. Please try again.");
        // Propagate the error so the calling function knows it failed
        throw new Error("Failed to generate Boat Registration ID");
    }
}
// --- END NEW ---

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
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Button loading indicator

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
                setError(null); // Clear previous errors
                const boatCollection = collection(db, "boat");
                const boatSnapshot = await getDocs(boatCollection);

                const boatList = boatSnapshot.docs.map((doc) => {
                    const data = doc.data();

                    // Process date: Assuming requestDate might be a Firestore Timestamp or string
                    let requestDateStr = new Date().toLocaleDateString(); // Fallback
                    let requestDateTimestamp = new Date(); // Fallback timestamp

                    if (data.requestDate) {
                        if (data.requestDate.toDate) { // Firestore Timestamp
                            requestDateTimestamp = data.requestDate.toDate();
                            requestDateStr = requestDateTimestamp.toLocaleDateString();
                        } else { // Attempt to parse if it's a string or number
                            try {
                                requestDateTimestamp = new Date(data.requestDate);
                                if (!isNaN(requestDateTimestamp)) { // Check if valid date
                                    requestDateStr = requestDateTimestamp.toLocaleDateString();
                                } else {
                                    requestDateTimestamp = new Date(); // Fallback if parsing failed
                                    requestDateStr = requestDateTimestamp.toLocaleDateString();
                                }
                            } catch (e) {
                                // Handle cases where data.requestDate is not a valid date format
                                requestDateTimestamp = new Date(); // Fallback
                                requestDateStr = requestDateTimestamp.toLocaleDateString();
                            }
                        }
                    }

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
                        registrationId: data.registrationId || null, // Fetch existing registration ID
                        requestDate: requestDateStr,
                        _requestDateTimestamp: requestDateTimestamp, // Keep original Date object for sorting
                    };
                });

                setRequests(boatList);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching boat data:", err);
                setError("Failed to load request data. Please check your connection and try again.");
                setLoading(false);
            }
        };

        fetchBoatData();
    }, []); // Empty dependency array means this runs once on mount

    // Function to get download URL from Firebase Storage
    const getFirebaseStorageUrl = async (storagePath) => {
        if (!storagePath) return null;

        try {
            // Check if it looks like a full HTTPS URL already (possibly a download URL)
            if (storagePath.startsWith('https://firebasestorage.googleapis.com/')) {
                console.log(`Assuming storagePath is already a valid download URL: ${storagePath}`);
                return storagePath;
            }

            // Assume it's a storage path (e.g., 'uploads/images/file.jpg')
            const storageRef = ref(storage, storagePath);
            const downloadUrl = await getDownloadURL(storageRef);
            console.log(`Generated download URL for ${storagePath}:`, downloadUrl);
            return downloadUrl;

        } catch (error) {
            // Handle errors, e.g., object not found, permissions issue
            if (error.code === 'storage/object-not-found') {
                console.error(`Storage object not found at path: ${storagePath}`);
                toast.error(`File not found. It might have been moved or deleted.`);
            } else if (error.code === 'storage/unauthorized') {
                console.error(`Unauthorized access to storage path: ${storagePath}`);
                toast.error(`You don't have permission to access this file.`);
            } else {
                console.error("Error getting download URL:", error);
                toast.error(`Failed to get file URL: ${error.message}`);
            }
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
        // You might check error.name or specific messages for more context
        if (error.name === 'PasswordException') {
            userErrorMessage = "The PDF document is password protected and cannot be displayed.";
        } else if (error.message.includes('invalid') || error.message.includes('corrupt')) {
            userErrorMessage = "The PDF document appears to be invalid or corrupted.";
        }

        setPdfError(userErrorMessage);
        toast.error(userErrorMessage);
    };

    const changePage = (offset) => {
        setCurrentPage(prevPage => {
            const newPage = prevPage + offset;
            // Ensure page number is within valid range
            return newPage >= 1 && newPage <= numPages ? newPage : prevPage;
        });
    };

    const resetViewerState = () => {
        setShowPdfViewer(false);
        setPdfSource(null);
        setImageSource(null);
        setPdfLoading(false);
        setPdfError(null);
        setNumPages(null);
        setCurrentPage(1);
    }

    // Handle viewing document (PDF or Image)
    const openFileViewer = async (fileType) => {
        const urlKey = fileType === 'document' ? 'documentUrl' : 'imageUrl';
        const fileUrl = selectedRequest?.[urlKey];

        if (!selectedRequest || !fileUrl) {
            toast.error(`No ${fileType} available to view.`);
            return;
        }

        try {
            setPdfLoading(true);
            setPdfError(null);
            setImageSource(null);
            setPdfSource(null);
            setCurrentPage(1);
            setNumPages(null);
            setShowPdfViewer(true); // Show modal immediately with loading state

            const downloadUrl = await getFirebaseStorageUrl(fileUrl);

            if (downloadUrl) {
                const lowerCaseUrl = downloadUrl.toLowerCase();
                const isImage = lowerCaseUrl.endsWith('.jpg') || lowerCaseUrl.endsWith('.jpeg') || lowerCaseUrl.endsWith('.png') || lowerCaseUrl.endsWith('.gif');
                const isPdf = lowerCaseUrl.endsWith('.pdf');

                if (isPdf) {
                    setPdfSource(downloadUrl);
                    setImageSource(null);
                    console.log("Attempting to load PDF from:", downloadUrl);
                    // onDocumentLoadSuccess/Error will set pdfLoading to false
                } else if (isImage) {
                    setImageSource(downloadUrl);
                    setPdfSource(null);
                    setPdfLoading(false); // No PDF.js loading needed for images
                    console.log("Attempting to load image from:", downloadUrl);
                } else {
                    // Unknown type, try loading as PDF (might fail), or show error/download link
                    console.warn("Unknown file type, attempting to load as PDF:", downloadUrl);
                    setPdfSource(downloadUrl); // Try as PDF
                    setImageSource(null);
                    // Alternatively, show an error immediately:
                    // setPdfLoading(false);
                    // setPdfError("Cannot display this file type directly. Please download it.");
                }
            } else {
                setPdfLoading(false);
                const errorMsg = `Failed to retrieve ${fileType} URL.`;
                setPdfError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (error) {
            setPdfLoading(false);
            setPdfError(`Failed to initiate ${fileType} loading: ${error.message}`);
            toast.error(`Failed to initiate ${fileType} loading: ${error.message}`);
        }
    };

    // Convenience functions for buttons
    const openPdfViewerHandler = () => openFileViewer('document');
    const openImageViewerHandler = () => openFileViewer('image');


    // Handle file download
    const handleDownloadFile = async (fileType) => {
        const urlKey = fileType === 'document' ? 'documentUrl' : 'imageUrl';
        const fileUrl = selectedRequest?.[urlKey];

        if (!selectedRequest || !fileUrl) {
            toast.error(`No ${fileType} available to download`);
            return;
        }

        try {
            const downloadUrl = await getFirebaseStorageUrl(fileUrl);

            if (downloadUrl) {
                console.log(`Attempting to download ${fileType} from:`, downloadUrl);
                // Create a temporary link element to trigger download
                const link = document.createElement('a');
                link.href = downloadUrl;
                // Try to suggest a filename (extract from URL or use generic)
                const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || `${fileType}_${selectedRequest.id}`;
                link.download = filename; // Suggest filename to the browser
                link.target = '_blank'; // Open in new tab/window, which usually triggers download
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link); // Clean up the link element
            } else {
                toast.error(`Could not generate download URL for ${fileType}.`);
            }
        } catch (error) {
            console.error(`Download ${fileType} failed:`, error);
            toast.error(`Download failed: ${error.message}`);
        }
    };

    // Convenience functions for buttons
    const handleDownloadDocument = () => handleDownloadFile('document');
    const handleDownloadImage = () => handleDownloadFile('image');

    // Retry loading content in the viewer
    const retryLoading = () => {
        if (selectedRequest) {
            // Determine which source was active or intended
            if (pdfSource) {
                openFileViewer('document'); // Re-attempt document (likely PDF) loading
            } else if (imageSource) {
                openFileViewer('image'); // Re-attempt image loading
            } else if (selectedRequest.documentUrl && !imageSource) {
                // If there was a document URL but no source loaded yet (initial failed attempt?)
                openFileViewer('document');
            } else if (selectedRequest.imageUrl && !pdfSource) {
                // If there was an image URL but no source loaded yet
                openFileViewer('image');
            } else {
                toast.info("No specific content selected to retry loading.");
            }
        } else {
            toast.error("No request selected to retry loading content.");
        }
    };

    // Handle clicking on a request in the list
    const handleRequestClick = (request) => {
        setSelectedRequest(request);
        resetViewerState(); // Reset viewer when a new request is selected
    };

    // Initiate Approval/Rejection Confirmation
    const initiateApproval = () => {
        if (!selectedRequest) return;
        setActionType("approve");
        setShowConfirmation(true);
    };

    const initiateRejection = () => {
        if (!selectedRequest) return;
        setActionType("reject");
        setShowConfirmation(true);
    };

    // Helper function to send email using Email.js
    const sendEmail = async (recipientEmail, recipientName, boatName, status, newBoatRegId = null) => {
        if (!recipientEmail || recipientEmail === "No email provided") {
            console.warn("No valid email to send notification to for request ID:", selectedRequest?.id);
            return false; // Indicate email wasn't attempted/sent
        }

        try {
            // Prepare email parameters based on status
            let emailSubject;
            let emailBody;

            if (status === "Approved") {
                emailSubject = `Boat Registration Request Approved`;
                emailBody = `Dear ${recipientName},\n\nWe are pleased to inform you that your boat registration request for "${boatName}" has been Approved.\n\nYour assigned Registration ID is: ${newBoatRegId}\n\nPlease keep this ID for your records and future reference.\n\nThank you,\nThe Fisheries Management System Team`;
            } else { // Rejected
                emailSubject = `Boat Registration Request Rejected`;
                emailBody = `Dear ${recipientName},\n\nRegarding your boat registration request for "${boatName}", we regret to inform you that it has been Rejected.\n\nPlease log in to the system or contact the administration office for more details regarding the reason for rejection.\n\nThank you for your understanding,\nThe Fisheries Management System Team`;
            }

            const templateParams = {
                to_email: recipientEmail,
                to_name: recipientName || 'Applicant', 
                subject: emailSubject,
                message: emailBody,
                //boat_name: boatName,
                //status: status,
                //registration_id: newBoatRegId || 'N/A' 
            };

            console.log("Sending email with params:", templateParams);

            // Ensure EMAIL_USER_ID is the Public Key
            const response = await emailjs.send(
                EMAIL_SERVICE_ID,
                EMAIL_TEMPLATE_ID,
                templateParams,
                EMAIL_USER_ID // This should be your EmailJS Public Key
            );

            console.log('Email sent successfully:', response.status, response.text);
            return true; // Email sent successfully
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error(`Failed to send email notification: ${error.text || error.message || 'Unknown error'}`);
            return false; // Email sending failed
        }
    };

    // Confirm the Approve/Reject Action
    const confirmAction = async () => {
        if (!selectedRequest || !actionType) return;

        setIsUpdatingStatus(true); // Start loading indicator
        const newStatus = actionType === "approve" ? "Approved" : "Rejected";
        let updateData = { status: newStatus }; // Data to update in Firestore
        let newBoatRegId = null; // To store the generated ID if approved

        try {
            // 1. Generate Registration ID *only* on approval using the new function
            if (actionType === "approve") {
                // *** MODIFIED: Call the new function, pass the db instance ***
                newBoatRegId = await generateBoatRegId(db);
                // *** END MODIFICATION ***
                if (!newBoatRegId) { // Handle potential generation failure
                     throw new Error("Boat Registration ID generation failed.");
                }
                updateData.registrationId = newBoatRegId; // Add ID to the update payload
                console.log(`Assigning Registration ID for ${selectedRequest.id}: ${newBoatRegId}`);
            } else {
                // Optional: Ensure registrationId is nullified or removed on rejection if it existed?
                // updateData.registrationId = null; // Or use deleteField() if you want to remove the field
            }

            // 2. Update Firestore document
            const requestRef = doc(db, "boat", selectedRequest.id);
            await updateDoc(requestRef, updateData);
            console.log(`Firestore document ${selectedRequest.id} updated with status: ${newStatus}` + (newBoatRegId ? ` and registrationId: ${newBoatRegId}` : ''));


            // 3. Send email notification using Email.js
            const recipientEmail = selectedRequest.email;
            const recipientName = selectedRequest.name || 'Applicant';
            const boatName = selectedRequest.boatName || 'your boat';
            let emailSent = false; // Track email sending status

            if (recipientEmail && recipientEmail !== "No email provided") {
                emailSent = await sendEmail(recipientEmail, recipientName, boatName, newStatus, newBoatRegId);
            }


            // 4. Update local state to reflect changes immediately
            const updatedRequests = requests.map(req =>
                req.id === selectedRequest.id
                    ? { ...req, status: newStatus, ...(newBoatRegId && { registrationId: newBoatRegId }) } // Conditionally add registrationId
                    : req
            );
            setRequests(updatedRequests);

            // Update the currently selected request in the detail view
            setSelectedRequest(prev => ({
                ...prev,
                status: newStatus,
                ...(newBoatRegId && { registrationId: newBoatRegId }) // Conditionally add registrationId
            }));


            // 5. Show appropriate success messages
            if (emailSent) {
                toast.success(`Request ${newStatus.toLowerCase()} successfully and email notification sent.`);
            } else if (recipientEmail && recipientEmail !== "No email provided") {
                toast.warn(`Request ${newStatus.toLowerCase()} successfully, but failed to send email notification.`);
            } else {
                toast.success(`Request ${newStatus.toLowerCase()} successfully. No valid email found for notification.`);
            }
            if (newBoatRegId) {
                toast.info(`Assigned Registration ID: ${newBoatRegId}`);
            }


        } catch (err) {
            console.error(`Error during ${actionType} action:`, err);
            // More specific error if ID generation failed
            if (err.message === "Boat Registration ID generation failed.") {
                toast.error(`Failed to ${actionType} request because the Registration ID could not be generated. Please check Firestore setup and try again.`);
            } else {
                 toast.error(`Failed to ${actionType} request. ${err.message || 'Please try again.'}`);
            }
        } finally {
            setIsUpdatingStatus(false); // Stop loading indicator
            setShowConfirmation(false); // Close confirmation modal
            setActionType(null); // Reset action type
        }
    };


    // Cancel the Approve/Reject Action
    const cancelAction = () => {
        setShowConfirmation(false);
        setActionType(null);
    };

    // Navigate back
    const handleBack = () => {
        navigate("/Dashboard"); // Adjust route if needed
    };

    // Get Bootstrap badge class based on status
    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) { // Added optional chaining and lowerCase for robustness
            case 'approved': return 'bg-success';
            case 'rejected': return 'bg-danger';
            case 'pending': return 'bg-warning text-dark'; // Added text-dark for better contrast on yellow
            default: return 'bg-secondary'; // Fallback for unknown statuses
        }
    };

    // --- Sorting and Filtering Logic ---

    // Function to handle sorting when table headers are clicked (if you implement a table view)
    const requestSort = (key) => {
        let direction = 'asc';
        // If sorting by the same key, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Function to get the filtered and sorted list of requests
    const getSortedRequests = () => {
        // Start with the full list
        let filteredRequests = [...requests];

        // 1. Filter by search term (case-insensitive)
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredRequests = filteredRequests.filter(request => {
                // Combine relevant fields into a single string for searching
                const searchFields = [
                    request.name,
                    request.email,
                    request.boatName,
                    request.contact,
                    request.id, // Allow searching by Firestore ID
                    request.status,
                    request.requestDate,
                    request.nic,
                    request.serialNumber,
                    request.registrationId // Include registration ID in search
                ].join(" ").toLowerCase();

                return searchFields.includes(lowerSearchTerm);
            });
        }

        // 2. Filter by selected status
        if (filterStatus !== "All") {
            filteredRequests = filteredRequests.filter(request =>
                request.status === filterStatus
            );
        }

        // 3. Sort the filtered results
        filteredRequests.sort((a, b) => {
            const key = sortConfig.key;
            const direction = sortConfig.direction === 'asc' ? 1 : -1;

            // Use the stored Date object for accurate date sorting
            if (key === 'requestDate') {
                const dateA = a._requestDateTimestamp || 0; // Fallback if timestamp missing
                const dateB = b._requestDateTimestamp || 0; // Fallback if timestamp missing
                return (dateA < dateB ? -1 : dateA > dateB ? 1 : 0) * direction;
            }

            // General comparison for other fields (handle null/undefined)
            const aValue = a[key] ?? ''; // Use empty string for null/undefined
            const bValue = b[key] ?? ''; // Use empty string for null/undefined

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * direction;
            } else {
                // Basic comparison for numbers or mixed types
                return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * direction;
            }
        });

        return filteredRequests;
    };

    // Close viewer when clicking outside the modal content
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the modal is shown and the click target is outside the ref's element
            if (showPdfViewer && pdfModalRef.current && !pdfModalRef.current.contains(event.target)) {
                resetViewerState();
            }
        };

        // Add listener only when the modal is shown
        if (showPdfViewer) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup: Remove listener when the modal is hidden or component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPdfViewer]); // Re-run effect when showPdfViewer changes


    // Render viewer content (PDF or Image or Error/Loading)
    const renderViewerContent = () => {
        if (pdfLoading) {
            return (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading content...</p>
                </div>
            );
        }

        if (pdfError) {
            return (
                <div className="alert alert-danger my-4 text-start">
                    <h5 className="alert-heading">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>Error Loading Content
                    </h5>
                    <p>{pdfError}</p>
                    <hr />
                    <p className="mb-3 small">This could be due to network issues, file corruption, incorrect file path in the database, or access permissions.</p>
                    <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                        <button className="btn btn-sm btn-outline-primary" onClick={retryLoading}>
                            <FiRefreshCcw className="me-1" /> Retry
                        </button>
                        {/* Offer download based on which URL might have been attempted */}
                        {(pdfSource || (pdfError && selectedRequest?.documentUrl)) && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadDocument}>
                                <FiDownload className="me-1" /> Download Document
                            </button>
                        )}
                        {(imageSource || (pdfError && selectedRequest?.imageUrl && !pdfSource)) && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadImage}>
                                <FiDownload className="me-1" /> Download Image
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        // Display Image
        if (imageSource) {
            return (
                <div className="text-center">
                    <img
                        src={imageSource}
                        alt="Boat Registration Related Image"
                        className="img-fluid rounded border"
                        style={{ maxHeight: '70vh', maxWidth: '100%' }} // Adjust styling as needed
                        onError={(e) => {
                            console.error("Image failed to load in viewer:", e);
                            setPdfError("Failed to load image. The URL might be invalid or the image corrupted.");
                            setImageSource(null); // Clear the broken source
                        }}
                    />
                    <div className="mt-3">
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadImage}>
                            <FiDownload className="me-1" /> Download Image
                        </button>
                    </div>
                </div>
            );
        }

        // Display PDF
        if (pdfSource) {
            return (
                <>
                    {/* PDF Controls */}
                    {numPages && numPages > 1 && ( // Only show controls if more than 1 page
                        <div className="text-center mb-3">
                            <div className="btn-group btn-group-sm">
                                <button
                                    className="btn btn-outline-primary"
                                    disabled={currentPage <= 1}
                                    onClick={() => changePage(-1)}
                                >
                                    <i className="bi bi-chevron-left"></i> Prev
                                </button>
                                <span className="btn btn-outline-primary disabled" style={{ minWidth: '80px' }}>
                                    Page {currentPage} of {numPages}
                                </span>
                                <button
                                    className="btn btn-outline-primary"
                                    disabled={currentPage >= numPages}
                                    onClick={() => changePage(1)}
                                >
                                    Next <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PDF Document Wrapper */}
                    <div className="border rounded p-2 d-flex justify-content-center bg-light" style={{ minHeight: '300px', overflow: 'hidden' }}>
                        <Document
                            file={pdfSource}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={<div className="text-center my-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Loading PDF...</p></div>}
                            noData={<div className="alert alert-info text-center m-0">No PDF preview available.</div>}
                        >
                            {/* Render page only if no error and pages exist */}
                            {numPages !== null && !pdfError && (
                                <Page
                                    pageNumber={currentPage}
                                    scale={1.3} // Adjust scale for modal size
                                    renderTextLayer={false} // Disable text layer for performance if not needed
                                    renderAnnotationLayer={false} // Disable annotation layer
                                    className="d-flex justify-content-center shadow-sm" // Center page content
                                    onError={(err) => {
                                        console.error("PDF Page rendering error:", err);
                                        setPdfError("Error rendering PDF page. The document might be invalid or corrupted.");
                                    }}
                                />
                            )}
                        </Document>
                    </div>

                    {/* Download Hint/Button */}
                    <div className="mt-3 text-center">
                        <small className="text-muted d-block mb-2">
                            If viewing fails or formatting is incorrect, try downloading.
                        </small>
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadDocument}>
                            <FiDownload className="me-1" /> Download Document
                        </button>
                    </div>
                </>
            );
        }

        // Fallback if nothing is loading, errored, or selected
        return (
            <div className="alert alert-secondary text-center m-4">
                No content is currently selected or available for preview.
            </div>
        );
    };

    // Determine if any action (approve/reject) is in progress
    const isActionInProgress = isUpdatingStatus;
    const displayedRequests = getSortedRequests(); // Get the list to display


    return (
        // Main container div
        <div
            className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                overflow: "hidden", // Prevent body scroll when modal isn't needed
            }}
        >
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

            {/* Content Viewer Modal (PDF/Image) */}
            {showPdfViewer && (
                <div className="modal fade show d-block" // Use Bootstrap modal classes
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)" }} // Semi-transparent background
                    onClick={resetViewerState} // Click outside content closes modal
                >
                    <div className="modal-dialog modal-dialog-centered modal-xl"> {/* Larger modal */}
                        <div
                            ref={pdfModalRef}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()} // Prevent click inside content from closing modal
                        >
                            <div className="modal-header bg-light">
                                <h5 className="modal-title text-primary fw-bold">
                                    <i className={`bi ${imageSource ? 'bi-image' : 'bi-file-earmark-text'} me-2`}></i>
                                    {imageSource ? "Image Viewer" : "Document Viewer"}
                                    {selectedRequest?.boatName && ` - ${selectedRequest.boatName}`}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={resetViewerState}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                {renderViewerContent()}
                            </div>
                            <div className="modal-footer justify-content-center bg-light">
                                <button type="button" className="btn btn-secondary" onClick={resetViewerState}>Close Viewer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal (Approve/Reject) */}
            {showConfirmation && (
                <div className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}> {/* Higher z-index */}
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {actionType === "approve" ? (<><FiCheckCircle className="me-2 text-success" />Confirm Approval</>)
                                        : (<><FiXCircle className="me-2 text-danger" />Confirm Rejection</>)}
                                </h5>
                                <button type="button" className="btn-close" onClick={cancelAction} disabled={isUpdatingStatus} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Are you sure you want to <strong>{actionType}</strong> the boat registration request for:
                                    <br />
                                    <strong className="text-primary"> {selectedRequest?.boatName || "this boat"}</strong> (Owner: {selectedRequest?.name || 'N/A'})?
                                </p>
                                <p className="small text-muted">
                                    {actionType === "approve"
                                        ? "An email notification will be sent to the applicant with the approval status and the generated Registration ID (e.g., BOAT001)." // Updated description
                                        : "An email notification will be sent to the applicant informing them of the rejection."}
                                    {!selectedRequest?.email || selectedRequest?.email === 'No email provided' ? ' (Warning: No valid email address found for notification.)' : ''}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelAction}
                                    disabled={isUpdatingStatus}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
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
                                            {actionType === "approve" ? 'Confirm Approval' : 'Confirm Rejection'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Panel */}
            <div
                className="container-fluid bg-white rounded-4 shadow-lg p-4"
                style={{ maxWidth: "1600px", width: '95%', maxHeight: "95vh", overflowY: "auto" }} // Adjusted max-width and overflow
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div className="d-flex align-items-center">
                        <img
                            src={logoImage}
                            alt="System Logo"
                            style={{ width: "50px", height: "auto" }}
                            className="me-3"
                        />
                        <h2 className="m-0 text-primary fw-bold">Boat Registration Approval</h2>
                    </div>
                    <button
                        className="btn btn-outline-secondary" // Changed style slightly
                        onClick={handleBack}
                    >
                        <i className="bi bi-arrow-left-circle me-1"></i> Back to Dashboard
                    </button>
                </div>

                {/* Filters and Summary */}
                <div className="row mb-4 align-items-center">
                    <div className="col-lg-5 col-md-6 mb-2 mb-md-0">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search requests (Name, Boat, NIC, ID, Reg ID...)" // Updated placeholder
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-2 mb-md-0">
                        <div className="input-group">
                            <span className="input-group-text bg-light"><i className="bi bi-filter"></i></span>
                            <select
                                className="form-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                aria-label="Filter by status"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-4 text-lg-end text-center mt-2 mt-lg-0">
                        <span className="text-muted me-3">
                            Showing: {displayedRequests.length} / {requests.length} Requests
                        </span>
                        <span className={`badge ${getStatusBadgeClass('Pending')} mx-1 p-2`}>
                            Pending: {requests.filter(r => r.status === "Pending").length}
                        </span>
                        <span className={`badge ${getStatusBadgeClass('Approved')} mx-1 p-2`}>
                            Approved: {requests.filter(r => r.status === "Approved").length}
                        </span>
                        <span className={`badge ${getStatusBadgeClass('Rejected')} mx-1 p-2`}>
                            Rejected: {requests.filter(r => r.status === "Rejected").length}
                        </span>
                    </div>
                </div>

                {/* Main Content Area (List and Details) */}
                <div className="row g-4"> {/* Added gutter spacing */}
                    {/* Request List Column */}
                    <div className="col-lg-5">
                        <div className="card h-100 border-0 shadow-sm"> {/* Added h-100 */}
                            <div className="card-header bg-gradient bg-primary text-white">
                                <h5 className="mb-0"><i className="bi bi-list-ul me-2"></i>Registration Requests</h5>
                            </div>
                            <div className="card-body p-0" style={{ maxHeight: "calc(95vh - 280px)", overflowY: "auto" }}> {/* Adjusted maxHeight */}
                                {loading ? (
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                                    </div>
                                ) : error ? (
                                    <div className="alert alert-danger m-3">{error}</div>
                                ) : displayedRequests.length === 0 ? (
                                    <div className="alert alert-light text-center m-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        No requests match your current filters.
                                        {searchTerm && ' Try broadening your search.'}
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {displayedRequests.map((request) => (
                                            <button
                                                key={request.id}
                                                type="button" // Explicitly set type
                                                className={`list-group-item list-group-item-action border-bottom py-3 px-3 ${selectedRequest?.id === request.id ? "active bg-primary-subtle text-primary-emphasis" : "" // More distinct active state
                                                    }`}
                                                onClick={() => handleRequestClick(request)}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '70%' }}>{request.boatName || "Unnamed Boat"}</h6>
                                                    <span className={`badge ${getStatusBadgeClass(request.status)} ms-2`}>
                                                        {request.status || "Unknown"}
                                                    </span>
                                                </div>
                                                <small className="d-block text-muted">
                                                    <i className="bi bi-person me-1"></i>{request.name || 'N/A'}
                                                </small>
                                                <small className="d-block text-muted">
                                                    <i className="bi bi-calendar-event me-1"></i>{request.requestDate || 'N/A'}
                                                </small>
                                                {/* Display Registration ID in the list */}
                                                {request.status === 'Approved' && request.registrationId && (
                                                    <small className="d-block text-success fw-semibold"> {/* Made it stand out more */}
                                                        <i className="bi bi-check-circle-fill me-1"></i>Reg ID: {request.registrationId}
                                                    </small>
                                                )}
                                                <small className="d-block text-muted fst-italic" style={{ fontSize: '0.75em' }}>Ref: {request.id.substring(0, 8)}...</small>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Request Details Column */}
                    <div className="col-lg-7">
                        <div className="card h-100 border-0 shadow-sm"> {/* Added h-100 */}
                            <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0"><i className="bi bi-file-earmark-text me-2"></i>Request Details</h5>
                                {selectedRequest && (
                                    <span className={`badge fs-6 ${getStatusBadgeClass(selectedRequest.status)}`}>
                                        {selectedRequest.status}
                                    </span>
                                )}
                            </div>
                            <div className="card-body d-flex flex-column" style={{ maxHeight: "calc(95vh - 240px)", overflowY: "auto" }}> {/* Adjusted maxHeight and added flex */}
                                {!selectedRequest ? (
                                    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center text-muted flex-grow-1"> {/* Added flex-grow-1 */}
                                        <FiFileText size={50} className="mb-3 opacity-50" />
                                        <h5 className="opacity-75">Select a request from the list</h5>
                                        <p className="opacity-50">Details will be shown here once a request is selected.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Information Sections */}
                                        <div className="row g-3 mb-4"> {/* Added gutters */}
                                            {/* Boat Info Card */}
                                            <div className="col-md-6">
                                                <div className="card bg-light border-0 h-100">
                                                    <div className="card-body">
                                                        <h6 className="card-subtitle mb-2 text-muted fw-bold"><i className="bi bi-tsunami me-2"></i>Boat Information</h6>
                                                        {/* Display Registration ID prominently if Approved */}
                                                        {selectedRequest.status === 'Approved' && selectedRequest.registrationId && (
                                                            <div className="alert alert-success p-2 small mb-2 d-flex align-items-center">
                                                                <i className="bi bi-patch-check-fill me-2"></i>
                                                                <div>
                                                                    <strong className="d-block">Registration ID:</strong> {selectedRequest.registrationId}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <p className="mb-1"><strong className="me-2">Name:</strong> {selectedRequest.boatName || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">Length:</strong> {selectedRequest.boatLength || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">Capacity:</strong> {selectedRequest.capacity || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">Power (HP):</strong> {selectedRequest.power || 'N/A'}</p>
                                                        <p className="mb-0"><strong className="me-2">Serial #:</strong> {selectedRequest.serialNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Owner Info Card */}
                                            <div className="col-md-6">
                                                <div className="card bg-light border-0 h-100">
                                                    <div className="card-body">
                                                        <h6 className="card-subtitle mb-2 text-muted fw-bold"><i className="bi bi-person-badge me-2"></i>Owner Information</h6>
                                                        <p className="mb-1"><strong className="me-2">Name:</strong> {selectedRequest.name || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">NIC:</strong> {selectedRequest.nic || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">Contact:</strong> {selectedRequest.contact || 'N/A'}</p>
                                                        <p className="mb-1"><strong className="me-2">Email:</strong> {selectedRequest.email || 'N/A'}</p>
                                                        <p className="mb-0"><strong className="me-2">Address:</strong> {selectedRequest.address || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Documentation Section */}
                                        <div className="mb-4">
                                            <h6 className="border-bottom pb-2 mb-3 fw-bold"><i className="bi bi-folder2-open me-2"></i>Documentation</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {selectedRequest.documentUrl ? (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={openPdfViewerHandler} title="View Document">
                                                            <FiEye className="me-1" /> View Document
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadDocument} title="Download Document">
                                                            <FiDownload className="me-1" /> Download Doc
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-muted small fst-italic me-3"><i className="bi bi-file-earmark-excel me-1"></i>No document uploaded.</span>
                                                )}

                                                {selectedRequest.imageUrl ? (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={openImageViewerHandler} title="View Image">
                                                            <FiEye className="me-1" /> View Image
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={handleDownloadImage} title="Download Image">
                                                            <FiDownload className="me-1" /> Download Img
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-muted small fst-italic"><i className="bi bi-card-image me-1"></i>No image uploaded.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons Area (Pushed to bottom) */}
                                        <div className="mt-auto border-top pt-3"> {/* Pushes buttons to bottom */}
                                            {selectedRequest.status === "Pending" ? (
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={initiateRejection}
                                                        disabled={isActionInProgress}
                                                    >
                                                        {isActionInProgress && actionType === "reject" ? (
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        ) : (
                                                            <><FiXCircle className="me-1" /> Reject</>
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={initiateApproval}
                                                        disabled={isActionInProgress}
                                                    >
                                                        {isActionInProgress && actionType === "approve" ? (
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        ) : (
                                                            <><FiCheckCircle className="me-1" /> Approve</>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`alert alert-${selectedRequest.status === 'Approved' ? 'success' : 'danger'} mb-0 py-2 text-center small`}>
                                                    This request was <strong>{selectedRequest.status}</strong>.
                                                    {selectedRequest.status === 'Approved' && selectedRequest.registrationId && ` (Reg ID: ${selectedRequest.registrationId})`} {/* Show Reg ID here too */}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div> {/* End card-body */}
                        </div> {/* End card */}
                    </div> {/* End col-lg-7 */}
                </div> {/* End row g-4 */}
            </div> {/* End container-fluid */}
        </div> // End main background div
    );
};

export default RequestPanel;