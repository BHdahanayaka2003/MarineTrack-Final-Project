import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";
import profileImage from "./profile.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
// Updated imports to include FiFileText
import { FiEye, FiEdit, FiCheckCircle, FiXCircle, FiUser, FiFileText } from "react-icons/fi"; // Removed FiAlertTriangle, added FiFileText
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Firebase configuration (keep your actual config)
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

const FishermanPanel = () => {
  const navigate = useNavigate();
  const [fishermen, setFishermen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFisherman, setSelectedFisherman] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchFishermenData = async () => {
      try {
        setLoading(true);
        const fishermenCollection = collection(db, "fishermen");
        const fishermenSnapshot = await getDocs(fishermenCollection);

        const fishermenList = fishermenSnapshot.docs.map(doc => {
          const data = doc.data();

          // --- Fetch all data including new fields ---
          return {
            id: doc.id,
            email: data.email || "No email provided",
            name: data.fishermenName || "Unknown", // Corresponds to fishermenName in DB
            contact: data.contact || "No contact",
            address: data.address || "N/A", // Assuming you might have address field
            nic: data.nic || data.fishermenNIC || "N/A", // Use fishermenNIC if nic doesn't exist
            fishermenNIC: data.fishermenNIC || "N/A", // Keep this specific field
            boatId: data.boatId || "N/A",
            status: data.status || "Pending",
            statusReason: data.statusReason || "",
            registrationDate: data.registrationDate ?
              (data.registrationDate.toDate ? data.registrationDate.toDate().toLocaleDateString() : new Date(data.registrationDate).toLocaleDateString()) // Handle Firestore Timestamp
              : new Date().toLocaleDateString(),
            // --- Get the new image and document URLs ---
            imageUrl: data.imageUrl || null,
            documentUrl: data.documentUrl || null,
          };
        });

        setFishermen(fishermenList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching fishermen data:", err);
        setError("Failed to load fishermen data. Please try again later.");
        setLoading(false);
      }
    };

    fetchFishermenData();
  }, []);

  // --- Rest of the functions (handleFishermanClick, initiateApproval, etc.) remain largely the same ---
  // (Keep your existing functions for handleFishermanClick, initiateApproval, initiateRejection, confirmAction, cancelAction, handleBack, getStatusBadgeClass, requestSort, getSortedFishermen)

  const handleFishermanClick = (fisherman) => {
    setSelectedFisherman(fisherman);
  };

  const initiateApproval = () => {
    setActionType("approve");
    setActionReason("");
    setShowConfirmation(true);
  };

  const initiateRejection = () => {
    setActionType("reject");
    setActionReason("");
    setShowConfirmation(true);
  };

  const confirmAction = async () => {
    if (!selectedFisherman || !actionType) return;

    try {
      setIsProcessing(true);

      const newStatus = actionType === "approve" ? "Active" : "Inactive";

      // Update in Firestore
      const fishermanRef = doc(db, "fishermen", selectedFisherman.id);
      await updateDoc(fishermanRef, {
        status: newStatus,
        statusReason: actionReason,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: auth.currentUser ? auth.currentUser.email : "Admin"
      });

      // Update local state
      const updatedFisherman = { ...selectedFisherman, status: newStatus, statusReason: actionReason };
      setFishermen(fishermen.map(fish =>
        fish.id === selectedFisherman.id ? updatedFisherman : fish
      ));

      toast.success(`Fisherman ${actionType === "approve" ? "approved" : "rejected"} successfully`);
      setSelectedFisherman(updatedFisherman); // Update selected fisherman details
      setShowConfirmation(false);
      setActionReason("");
      setIsProcessing(false);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(`Failed to ${actionType} fisherman. Please try again.`);
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    setShowConfirmation(false);
    setActionType(null);
    setActionReason("");
  };

  const handleBack = () => {
    navigate("/Dashboard");
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Active': return 'bg-success';
      case 'Inactive': return 'bg-danger';
      case 'Pending': return 'bg-warning';
      default: return 'bg-secondary';
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

 const getSortedFishermen = () => {
    // Filter by search term
    let filteredFishermen = fishermen.filter(fisherman => {
      // Ensure all potential fields are included and handle null/undefined
      const searchFields = [
        fisherman.name,
        fisherman.email,
        fisherman.contact,
        fisherman.nic,
        fisherman.fishermenNIC,
        fisherman.id,
        fisherman.status,
        fisherman.address,
        fisherman.boatId
      ].map(field => String(field || "").toLowerCase()).join(" "); // Convert to string and lowercase safely

      return searchFields.includes(searchTerm.toLowerCase());
    });

    // Filter by status if needed
    if (filterStatus !== "All") {
      filteredFishermen = filteredFishermen.filter(fisherman =>
        fisherman.status === filterStatus
      );
    }

    // Sort the filtered list
    const sorted = [...filteredFishermen].sort((a, b) => {
      // Use a helper function to get comparable values, handling potential nulls/undefined
      const getValue = (obj, key) => {
          // Prioritize specific keys if needed, otherwise access directly
          if (key === 'name') return obj.name || '';
          if (key === 'nic') return obj.nic || obj.fishermenNIC || '';
          if (key === 'boatId') return obj.boatId || '';
          if (key === 'status') return obj.status || '';
          return obj[key] || ''; // Default case
      };

      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      // LocaleCompare is good for string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      // Basic comparison for other types (if any)
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };


  // --- Loading and Error states remain the same ---
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


  // --- JSX Rendering ---
  return (
    <div
      className="vh-100 vw-100 d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto", // Ensure content scrolls if it exceeds viewport height
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Confirmation Modal (no changes needed here) */}
      {showConfirmation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
             style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-4 shadow" style={{ maxWidth: "500px", width: "90%" }}>
            <h5 className="mb-3 d-flex align-items-center">
              {actionType === "approve" ? (
                <><FiCheckCircle className="text-success me-2" size={24} /> Approve Fisherman</>
              ) : (
                <><FiXCircle className="text-danger me-2" size={24} /> Reject Fisherman</>
              )}
            </h5>

            <p>
              You are about to {actionType === "approve" ? "approve" : "reject"} fisherman registration for:
              <strong className="d-block mt-2">{selectedFisherman?.name}</strong>
            </p>

            <div className="mb-3 mt-4">
              <label htmlFor="actionReason" className="form-label">Reason (optional):</label>
              <textarea
                id="actionReason"
                className="form-control"
                rows="3"
                placeholder={`Reason for ${actionType === "approve" ? "approval" : "rejection"}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={cancelAction}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={confirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === "approve" ? "Approve" : "Reject"} Fisherman
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div
        className="w-100 mx-3 my-4 rounded-5"
        style={{
          maxWidth: "1200px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          overflowY: "auto", // Allows scrolling within the container
          maxHeight: "95vh"    // Limits the height to prevent page overflow
        }}
      >
        {/* Header Section (no changes) */}
        <div className="d-flex justify-content-between align-items-center mb-4">
           {/* ... existing header jsx ... */}
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
           <h2 className="text-center flex-grow-1 fw-bold m-0 fs-4">Fishermen Registry</h2>
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

        {/* Filter and Search Row (no changes) */}
        <div className="row mb-4 g-3">
          {/* ... existing filter/search jsx ... */}
          <div className="col-md-5 col-lg-4">
             <div className="input-group">
               <span className="input-group-text bg-light border-end-0">
                 <i className="bi bi-search"></i> {/* Ensure you have bootstrap icons linked or use react-icons */}
               </span>
               <input
                 type="text"
                 className="form-control border-start-0"
                 placeholder="Search fishermen..."
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
               <option value="Active">Approved</option>
               <option value="Inactive">Rejected</option>
             </select>
           </div>
           <div className="col-md-3 col-lg-5 text-md-end">
             <span className="text-muted me-2 d-block d-md-inline-block mt-2 mt-md-0">
               {getSortedFishermen().length} registered fishermen
             </span>
           </div>
        </div>

        {/* --- Selected Fisherman Detail Card (UPDATED) --- */}
        {selectedFisherman && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Fisherman Details - {selectedFisherman.name}</h5>
              <button
                className="btn-close btn-close-white"
                onClick={() => setSelectedFisherman(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body">
              {/* Row for Personal & Registration Info */}
              <div className="row g-4">
                {/* Column 1: Personal Info */}
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Personal Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{selectedFisherman.name}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Email Address</small>
                      <strong>{selectedFisherman.email}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Contact Number</small>
                      <strong>{selectedFisherman.contact}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">NIC / Fisherman NIC</small>
                      <strong>{selectedFisherman.nic || selectedFisherman.fishermenNIC}</strong> {/* Display whichever is available */}
                    </div>
                    {/* You might want separate entries if both NICs are important */}
                    {/* <div className="mb-2">
                      <small className="text-muted d-block">Fisherman NIC</small>
                      <strong>{selectedFisherman.fishermenNIC}</strong>
                    </div> */}
                    <div className="mb-2">
                      <small className="text-muted d-block">Address</small>
                      <strong>{selectedFisherman.address}</strong>
                    </div>
                  </div>
                </div>

                {/* Column 2: Registration Info */}
                <div className="col-md-6">
                  <div className="d-flex flex-column">
                    <h6 className="text-primary mb-3">Registration Information</h6>
                    <div className="mb-2">
                      <small className="text-muted d-block">Associated Boat ID</small>
                      <strong>{selectedFisherman.boatId}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Status</small>
                      <span className={`badge ${getStatusBadgeClass(selectedFisherman.status)}`}>
                        {selectedFisherman.status}
                      </span>
                    </div>
                    {selectedFisherman.statusReason && (
                      <div className="mb-2">
                        <small className="text-muted d-block">Status Reason</small>
                        <span className="fst-italic">{selectedFisherman.statusReason}</span>
                      </div>
                    )}
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration ID</small>
                      <strong>{selectedFisherman.id}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Registration Date</small>
                      <strong>{selectedFisherman.registrationDate}</strong>
                    </div>
                  </div>
                </div>
              </div> {/* End of first row */}

              {/* --- NEW Row for Image and Document --- */}
              <hr className="my-4" /> {/* Visual Separator */}
              <div className="row g-4">
                {/* Column for Image */}
                <div className="col-md-6">
                    <h6 className="text-primary mb-3">Fisherman Image</h6>
                    {selectedFisherman.imageUrl ? (
                        <img
                            src={selectedFisherman.imageUrl}
                            alt={`Profile of ${selectedFisherman.name}`}
                            className="img-fluid rounded shadow-sm border" // Added border for definition
                            style={{ maxHeight: '250px', width: 'auto', objectFit: 'contain' }} // Adjusted style
                        />
                    ) : (
                        <div className="text-center text-muted p-3 border rounded" style={{ minHeight: '100px'}}>
                           <FiUser size={30} className="mb-2"/> <br/>
                           No image uploaded.
                        </div>
                    )}
                </div>

                {/* Column for Document Link */}
                <div className="col-md-6">
                    <h6 className="text-primary mb-3">Supporting Document</h6>
                    {selectedFisherman.documentUrl ? (
                        <a
                            href={selectedFisherman.documentUrl}
                            target="_blank" // Open in new tab
                            rel="noopener noreferrer" // Security best practice
                            className="btn btn-outline-secondary d-inline-flex align-items-center"
                        >
                            <FiFileText className="me-2" /> View Document
                        </a>
                    ) : (
                         <div className="text-center text-muted p-3 border rounded" style={{ minHeight: '100px'}}>
                            <FiFileText size={30} className="mb-2"/> <br/>
                            No document uploaded.
                         </div>
                    )}
                </div>
              </div> {/* End of image/document row */}

              {/* Action Buttons (Keep Existing) */}
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button
                  className="btn btn-sm btn-outline-primary" // Made buttons smaller
                  onClick={() => toast.info("Edit functionality coming soon!")}
                >
                  <FiEdit className="me-1" /> Edit
                </button>

                {selectedFisherman.status === "Pending" && (
                  <>
                    <button
                      className="btn btn-sm btn-danger" // Made buttons smaller
                      onClick={initiateRejection}
                    >
                      <FiXCircle className="me-1" /> Reject
                    </button>
                    <button
                      className="btn btn-sm btn-success" // Made buttons smaller
                      onClick={initiateApproval}
                    >
                      <FiCheckCircle className="me-1" /> Approve
                    </button>
                  </>
                )}

                {selectedFisherman.status === "Active" && (
                  <button
                    className="btn btn-sm btn-danger" // Made buttons smaller
                    onClick={initiateRejection}
                  >
                    <FiXCircle className="me-1" /> Deactivate
                  </button>
                )}

                {selectedFisherman.status === "Inactive" && (
                  <button
                    className="btn btn-sm btn-success" // Made buttons smaller
                    onClick={initiateApproval}
                  >
                    <FiCheckCircle className="me-1" /> Reactivate {/* Changed text */}
                  </button>
                )}
              </div>
            </div> {/* End of card-body */}
          </div>
        )}

        {/* Fishermen Table (no changes needed to structure, data is fetched) */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                 {/* Keep existing table headers */}
                 <th
                   scope="col"
                   onClick={() => requestSort('name')}
                   style={{ cursor: 'pointer' }}
                 >
                   Name {sortConfig.key === 'name' && (
                     <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                   )}
                 </th>
                 <th scope="col">Email</th>
                 <th
                   scope="col"
                   onClick={() => requestSort('nic')}
                   style={{ cursor: 'pointer' }}
                 >
                   NIC {sortConfig.key === 'nic' && (
                     <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                   )}
                 </th>
                 <th
                   scope="col"
                   onClick={() => requestSort('boatId')}
                   style={{ cursor: 'pointer' }}
                 >
                   Boat ID {sortConfig.key === 'boatId' && (
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
                 <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedFishermen().length > 0 ? (
                getSortedFishermen().map((fisherman) => (
                  <tr key={fisherman.id}>
                    {/* Keep existing table data rendering */}
                    <td onClick={() => handleFishermanClick(fisherman)} style={{cursor: "pointer"}}>{fisherman.name}</td>
                     <td onClick={() => handleFishermanClick(fisherman)} style={{cursor: "pointer"}}>{fisherman.email}</td>
                     {/* Display combined NIC field in table */}
                     <td onClick={() => handleFishermanClick(fisherman)} style={{cursor: "pointer"}}>{fisherman.nic || fisherman.fishermenNIC}</td>
                     <td onClick={() => handleFishermanClick(fisherman)} style={{cursor: "pointer"}}>{fisherman.boatId}</td>
                     <td onClick={() => handleFishermanClick(fisherman)} style={{cursor: "pointer"}}>
                       <span className={`badge ${getStatusBadgeClass(fisherman.status)}`}>
                         {fisherman.status === "Active" ? "Approved" :
                          fisherman.status === "Inactive" ? "Rejected" :
                          fisherman.status}
                       </span>
                     </td>
                     <td>
                       <div className="d-flex gap-1"> {/* Reduced gap slightly */}
                         <button
                           className="btn btn-sm btn-outline-primary" // Changed to outline
                           onClick={() => handleFishermanClick(fisherman)}
                           title="View Details" // Added title
                         >
                           <FiEye /> {/* Removed text for smaller button */}
                         </button>

                         {fisherman.status === "Pending" && (
                           <div className="btn-group btn-group-sm">
                             <button
                               className="btn btn-sm btn-success"
                               onClick={() => {
                                 setSelectedFisherman(fisherman);
                                 initiateApproval();
                               }}
                               title="Approve"
                             >
                               <FiCheckCircle />
                             </button>
                             <button
                               className="btn btn-sm btn-danger"
                               onClick={() => {
                                 setSelectedFisherman(fisherman);
                                 initiateRejection();
                               }}
                               title="Reject"
                             >
                               <FiXCircle />
                             </button>
                           </div>
                         )}
                         {/* You could add Activate/Deactivate buttons here too if needed */}
                       </div>
                     </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    {searchTerm || filterStatus !== "All" ?
                      "No matching fishermen found" :
                      "No fishermen records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer (no changes) */}
        <div className="mt-4 pt-3 border-top text-center">
           {/* ... existing footer jsx ... */}
           <p className="text-muted mb-0 small">
             Fisheries Management System • v2.6.0 • © 2025
           </p>
        </div>
      </div> {/* End Main Content Container */}
    </div> // End Background Container
  );
};

export default FishermanPanel;