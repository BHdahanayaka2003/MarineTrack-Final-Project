import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import backgroundImage from './background.jpeg'; // Make sure this path is correct
import logoImage from './logo.png'; // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShip,
  faUser,
  faIdCard,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faEdit,
  faSave,
  faArrowLeft,
  faCalendarAlt,
  faTachometerAlt,
  faAnchor,
  faFileAlt, // Icon for document/PDF
  faExclamationTriangle,
  faDownload // Icon for download button
} from '@fortawesome/free-solid-svg-icons';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { jsPDF } from 'jspdf'; // Import jsPDF library

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Replace with your actual API Key
  authDomain: "finalproject-4453c.firebaseapp.com",
  projectId: "finalproject-4453c",
  storageBucket: "finalproject-4453c.appspot.com",
  messagingSenderId: "866850090007",
  appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const OwnerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get the owner object passed via navigation state
  const receivedOwner = location.state?.owner;

  const [owner, setOwner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state - Added contact, documentUrl, imageUrl
  const [formData, setFormData] = useState({
    name: '',
    boatName: '',
    serialNumber: '',
    year: '',
    power: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '', // Corresponds to 'nic' in your image
    contact: '', // Added based on your image
    documentUrl: '', // Added based on your image
    imageUrl: '', // Added based on your image
    status: '',
    requirements: '',
    lastInspection: '',
    registrationDate: '' // Kept, assuming it might be used
  });

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (receivedOwner && receivedOwner.id) {
          // Use the ID from the received owner object to fetch the latest data
          // This ensures we have the most up-to-date info, not just the navigation state
          const ownerRef = doc(db, "boat", receivedOwner.id);
          const docSnap = await getDoc(ownerRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setOwner({ id: docSnap.id, ...data }); // Store full owner data with ID
            setFormData({
              name: data.name || '',
              boatName: data.boatName || '',
              serialNumber: data.serialNumber || '',
              year: data.year || '',
              power: data.power || '',
              email: data.email || '',
              phone: data.phone || '', // Keep phone, as contact might be different
              address: data.address || '',
              idNumber: data.nic || '', // Map 'nic' from Firestore to 'idNumber'
              contact: data.contact || '', // Populate contact
              documentUrl: data.documentUrl || '', // Populate documentUrl
              imageUrl: data.imageUrl || '', // Populate imageUrl
              status: data.status || 'Pending',
              requirements: data.requirements || '',
              lastInspection: data.lastInspection || '',
              registrationDate: data.registrationDate || ''
            });
          } else {
            // Document does not exist
             setError("Owner document not found. Redirecting...");
             setOwner(null); // Clear owner state
             // Redirect if document not found
             setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
          }

        } else {
          // If no owner ID is passed via state
          setError("No owner selected. Redirecting to owners list...");
          setOwner(null); // Clear owner state
          // Redirect if no owner object or ID
          setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
        }
      } catch (err) {
        console.error("Error fetching owner data:", err);
        setError("Failed to load owner details. Please try again. " + err.message);
        setOwner(null); // Clear owner state on error
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data when component mounts or receivedOwner changes
    fetchOwnerData();

  }, [receivedOwner, navigate]); // Depend on receivedOwner and navigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If currently editing, then save changes
      handleSave();
    } else {
      // Start editing
      setIsEditing(true);
      // When starting edit, ensure formData is in sync with the current owner state
      if (owner) {
         setFormData({
            name: owner.name || '',
            boatName: owner.boatName || '',
            serialNumber: owner.serialNumber || '',
            year: owner.year || '',
            power: owner.power || '',
            email: owner.email || '',
            phone: owner.phone || '',
            address: owner.address || '',
            idNumber: owner.idNumber || '', // Use the mapped idNumber
            contact: owner.contact || '',
            documentUrl: owner.documentUrl || '',
            imageUrl: owner.imageUrl || '',
            status: owner.status || 'Pending',
            requirements: owner.requirements || '',
            lastInspection: owner.lastInspection || '',
            registrationDate: owner.registrationDate || ''
         });
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!owner?.id) {
        setError("Cannot save: Missing owner ID");
        setIsSaving(false);
        return;
      }

      // Prepare data for update - Map 'idNumber' back to 'nic' for Firestore
      const updateData = {
        name: formData.name,
        boatName: formData.boatName,
        serialNumber: formData.serialNumber,
        year: formData.year,
        power: formData.power,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        nic: formData.idNumber, // Save 'idNumber' from form to 'nic' in Firestore
        contact: formData.contact,
        documentUrl: formData.documentUrl,
        imageUrl: formData.imageUrl,
        status: formData.status,
        requirements: formData.requirements,
        lastInspection: formData.lastInspection,
        registrationDate: formData.registrationDate,
        updatedAt: new Date().toISOString() // Add/update timestamp
      };

      const ownerRef = doc(db, "boat", owner.id);
      await updateDoc(ownerRef, updateData);

      // Update local state with the saved data
      setOwner({
        ...owner,
        ...updateData, // Use updateData which includes the mapped 'nic'
        idNumber: updateData.nic // Keep 'idNumber' in local state for consistency
      });
       // Ensure formData is also updated to reflect the saved state, especially if some fields weren't editable
       setFormData({
            ...formData,
            ...updateData,
            idNumber: updateData.nic
       });

      setIsEditing(false);
      setSuccess("Owner details updated successfully!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating owner:", err);
      setError("Failed to update owner details. Please try again. " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to generate PDF
  const generatePdf = () => {
      if (!owner) {
          console.error("Owner data not loaded for PDF generation.");
          setError("Cannot generate PDF: Owner data not available.");
          // Clear error after a few seconds
          setTimeout(() => setError(null), 5000);
          return;
      }

      try {
          const doc = new jsPDF();
          let y = 15; // Initial Y position in mm

          doc.setFontSize(18);
          doc.text('Boat & Owner Details', 10, y);
          y += 10;

          doc.setFontSize(12);
          doc.setTextColor(100); // Grey color for labels
          doc.text('Status:', 10, y);
          doc.setTextColor(0); // Black color for values (default)
          doc.text(formData.status || 'Not specified', 40, y);
          y += 15;

          // Owner Information
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Owner Information', 10, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(10, y, 200, y); // Horizontal line
          y += 5;

          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text('Full Name:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.name || 'Not provided', 60, y);
          y += 7;

          // Added Contact field
          doc.setTextColor(100);
          doc.text('Contact:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.contact || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('ID Number (NIC):', 10, y);
          doc.setTextColor(0);
          doc.text(formData.idNumber || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Phone Number:', 10, y); // Display Phone explicitly
          doc.setTextColor(0);
          doc.text(formData.phone || 'Not provided', 60, y);
          y += 7;


          doc.setTextColor(100);
          doc.text('Email Address:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.email || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Address:', 10, y);
          doc.setTextColor(0);
          // Handle multiline address
          const addressLines = doc.splitTextToSize(formData.address || 'Not provided', 140); // Max width 140mm
          doc.text(addressLines, 60, y);
          y += (addressLines.length * 7); // Adjust y based on number of lines


          y += 10; // Add space before next section

          // Vessel Information
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Vessel Information', 10, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(10, y, 200, y); // Horizontal line
          y += 5;

          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text('Boat Name:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.boatName || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Serial Number:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.serialNumber || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Year of Manufacture:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.year || 'Not provided', 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Engine Power:', 10, y);
          doc.setTextColor(0);
          doc.text((formData.power ? `${formData.power} HP` : 'Not provided'), 60, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Last Inspection Date:', 10, y);
          doc.setTextColor(0);
          doc.text(formData.lastInspection || 'Not available', 60, y);
          y += 7;

           doc.setTextColor(100);
           doc.text('Registration Date:', 10, y);
           doc.setTextColor(0);
           doc.text(formData.registrationDate || 'Not available', 60, y); // Include Registration Date if available
           y += 15;


          // Requirements
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Additional Requirements & Notes', 10, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(10, y, 200, y); // Horizontal line
          y += 5;

          doc.setFontSize(12);
          doc.setTextColor(0); // Black for note content
          // Handle multiline requirements
          const requirementsLines = doc.splitTextToSize(formData.requirements || 'No additional requirements or notes specified.', 180); // Max width 180mm
          doc.text(requirementsLines, 10, y);
          y += (requirementsLines.length * 7); // Adjust y based on number of lines


          y += 15; // Add space


          // Linked Document (PDF)
          if (formData.documentUrl) {
              doc.setFontSize(14);
              doc.setTextColor(0);
              doc.text('Linked Document (PDF)', 10, y);
              y += 7;
              doc.setLineWidth(0.1);
              doc.line(10, y, 200, y); // Horizontal line
              y += 5;

              doc.setFontSize(12);
              doc.setTextColor(100); // Greyish for label
              doc.text('Document URL:', 10, y);

              const linkText = formData.documentUrl;
              const linkX = 60;
              const linkY = y; // Start drawing text at this Y

              // Add the URL text in blue (standard link color)
              doc.setTextColor(0, 0, 255);
              doc.text(linkText, linkX, linkY);

              // Add a clickable link annotation over the text
              // Calculate text width and approximate height for the link annotation rectangle
              const textWidth = doc.getTextWidth(linkText);
              const textHeight = 7; // Approximate line height for 12pt text (adjust if needed)

              // doc.link(x, y, width, height, { url: '...' })
              // x, y are top-left coordinates of the clickable area
              // The text() method draws from the baseline, so adjust Y
              doc.link(linkX, linkY - textHeight + 1.5, textWidth, textHeight, { // Adjusted Y slightly for baseline
                  url: formData.documentUrl
              });

              // Add a note about clicking the link
              y += textHeight + 2; // Move y down based on approximate text height
              doc.setFontSize(10);
              doc.setTextColor(100); // Grey
              doc.text('(Click the URL above to open the document)', 10, y);


              y += 8; // Add space after this section
          }

           // Linked Image URL (Optional - add as clickable text)
           if (formData.imageUrl) {
               doc.setFontSize(14);
               doc.setTextColor(0);
               doc.text('Linked Image URL', 10, y);
               y += 7;
               doc.setLineWidth(0.1);
               doc.line(10, y, 200, y); // Horizontal line
               y += 5;

               doc.setFontSize(12);
               doc.setTextColor(100); // Greyish for label
               doc.text('Image URL:', 10, y);

               const imageLinkText = formData.imageUrl;
               const imageLinkX = 60;
               const imageLinkY = y;

               doc.setTextColor(0, 0, 255); // Blue for link
               doc.text(imageLinkText, imageLinkX, imageLinkY);

                // Add clickable link annotation
               const imageTextWidth = doc.getTextWidth(imageLinkText);
               const imageTextHeight = 7; // Approximate line height

               doc.link(imageLinkX, imageLinkY - imageTextHeight + 1.5, imageTextWidth, imageTextHeight, {
                   url: formData.imageUrl
               });

               y += imageTextHeight + 2;
               doc.setFontSize(10);
               doc.setTextColor(100); // Grey
               doc.text('(Click the URL above to open the image)', 10, y);

               y += 8; // Add space
           }

          // Footer (optional)
           doc.setFontSize(9);
           doc.setTextColor(150);
           doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 10, doc.internal.pageSize.height - 10);


          // Save the PDF
          const filename = `BoatOwner_${(formData.name || 'Details').replace(/\s+/g, '_')}_${owner.id}.pdf`;
          doc.save(filename);

      } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          setError("Failed to generate PDF. " + pdfError.message);
          // Clear error after a few seconds
          setTimeout(() => setError(null), 5000);
      }
  };


  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#000' }}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2 text-light">Loading owner details...</span>
      </div>
    );
  }

   // Handle case where owner data was expected but not found/received
   if (!owner && !isLoading && !error) {
       // This handles the case where receivedOwner was null and the timeout hasn't redirected yet
       // Or if there's another unexpected state.
       // The useEffect should handle the redirect, but this provides a visual fallback.
        return (
            <div className="d-flex justify-content-center align-items-center text-light" style={{ height: '100vh', background: '#000' }}>
                No owner data available. Redirecting...
            </div>
        );
   }

   // If there's an error after loading attempt (e.g., doc not found), display it
   if (error && !owner && !isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center text-light" style={{ height: '100vh', background: '#000' }}>
                 <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    <div>{error}</div>
                </div>
            </div>
        );
   }


  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center m-0 p-0"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff', // Base text color is white
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-start"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          margin: '20px',
          borderRadius: '20px',
          height: 'calc(100vh - 40px)',
          width: '95%',
          overflowY: 'auto', // Use overflowY for vertical scrolling
          overflowX: 'hidden', // Hide horizontal overflow
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '20px' // Added padding bottom
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3 pb-2 border-bottom border-secondary"
             style={{ flexShrink: 0 }} // Prevent header from shrinking
        >
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: 'pointer',
                marginRight: '15px',
                border: '2px solid #4e9af1'
              }}
              onClick={() => navigate("/Dashboard")}
            />
            <h4 className="mb-0" style={{ fontWeight: '600' }}>Fisheries Management</h4>
          </div>

          <button
            className="btn btn-outline-light"
            onClick={() => navigate("/BoatOwnerDetails")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Owners List
          </button>
        </div>

        {/* Main Content */}
        {/* Use flex-grow to make content area fill available space */}
        <div className="w-100 px-4 py-3" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Title Section & Action Buttons */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faShip} className="me-2" />
                Boat & Owner Details
              </h2>
              <p className="text-muted mb-0">
                View and manage detailed information for this registration (ID: {owner?.id || 'N/A'})
              </p>
            </div>

            {/* Buttons */}
            <div className="d-flex align-items-center">
                {/* PDF Download Button - Show only when not editing and data is loaded */}
                {!isEditing && owner && (
                    <button
                        className="btn btn-outline-info me-2"
                        onClick={generatePdf}
                        disabled={isSaving} // Disable while saving other data if needed
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Download PDF
                    </button>
                )}

                {/* Edit/Save Button */}
                <button
                  className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleEditToggle}
                  disabled={isSaving || isLoading} // Disable if saving or still loading
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="me-2" />
                      {isEditing ? 'Save Changes' : 'Edit Details'}
                    </>
                  )}
                </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span className={`badge ${getStatusClass(formData.status)} fs-6 px-3 py-2`}>
              Status: {formData.status || 'Pending'}
            </span>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faSave} className="me-2" />
              <div>{success}</div>
            </div>
          )}

          {/* Details Cards */}
          <div className="row">
            {/* Owner Information Card */}
            <div className="col-md-6 mb-4">
              <div className="card h-100" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  <h5 className="mb-0">Owner Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Added Contact field display */}
                   <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faPhone} className="me-2" /> {/* Using phone icon, adjust if needed */}
                      Contact
                    </label>
                    {isEditing ? (
                      <input
                        type="text" // Assuming text based on image
                        className="form-control"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.contact || 'Not provided'}</p>
                    )}
                  </div>


                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faIdCard} className="me-2" />
                      ID Number (NIC)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="idNumber" // Map to nic in save
                        value={formData.idNumber}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.idNumber || 'Not provided'}</p>
                    )}
                  </div>

                   {/* Keep Phone Number display as it might be distinct from Contact */}
                   <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.phone || 'Not provided'}</p>
                    )}
                  </div>


                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{formData.address || 'Not provided'}</p> 
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boat Information Card */}
            <div className="col-md-6 mb-4">
              <div className="card h-100" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                  <h5 className="mb-0">Vessel Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faAnchor} className="me-2" />
                      Boat Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="boatName"
                        value={formData.boatName}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.boatName || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faIdCard} className="me-2" />
                      Serial Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.serialNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Year of Manufacture
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.year || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                      Engine Power (HP)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="power"
                        value={formData.power}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.power ? `${formData.power} HP` : 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Last Inspection Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control"
                        name="lastInspection"
                        value={formData.lastInspection}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.lastInspection || 'Not available'}</p>
                    )}
                  </div>

                  {/* Added Registration Date display */}
                   <div className="mb-3">
                     <label className="form-label text-muted">
                       <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                       Registration Date
                     </label>
                     {isEditing ? (
                       <input
                         type="date" // Assuming date type
                         className="form-control"
                         name="registrationDate"
                         value={formData.registrationDate}
                         onChange={handleChange}
                         style={{
                           backgroundColor: 'rgba(255, 255, 255, 0.1)',
                           color: '#fff',
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       />
                     ) : (
                       <p className="form-control-plaintext" style={{ color: '#fff' }}>{formData.registrationDate || 'Not available'}</p>
                     )}
                   </div>

                </div>
              </div>
            </div>

            {/* Documents/URLs Card (Added to display URLs) */}
            {(formData.documentUrl || formData.imageUrl) && ( // Only show if at least one URL exists
             <div className="col-md-6 mb-4"> {/* Use col-md-6 to place next to status if room, else it goes full width */}
               <div className="card" style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.05)',
                 boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 borderRadius: '12px'
               }}>
                 <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                   <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                   <h5 className="mb-0">Linked Documents & Images</h5>
                 </div>
                 <div className="card-body">
                    {formData.documentUrl && (
                       <div className="mb-3">
                         <label className="form-label text-muted">Linked Document URL</label>
                         {/* Display as a clickable link in view mode */}
                         {isEditing ? (
                             <input
                               type="text"
                               className="form-control"
                               name="documentUrl"
                               value={formData.documentUrl}
                               onChange={handleChange}
                               style={{
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 color: '#fff',
                                 border: '1px solid rgba(255, 255, 255, 0.2)'
                               }}
                             />
                         ) : (
                            <p className="form-control-plaintext">
                                <a href={formData.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#8ab4f8' }}> {/* Use a standard link color */}
                                    {formData.documentUrl}
                                </a>
                            </p>
                         )}
                       </div>
                    )}

                    {formData.imageUrl && (
                       <div className="mb-3">
                         <label className="form-label text-muted">Linked Image URL</label>
                          {/* Display as a clickable link in view mode */}
                           {isEditing ? (
                             <input
                               type="text"
                               className="form-control"
                               name="imageUrl"
                               value={formData.imageUrl}
                               onChange={handleChange}
                               style={{
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                 color: '#fff',
                                 border: '1px solid rgba(255, 255, 255, 0.2)'
                               }}
                             />
                           ) : (
                             <p className="form-control-plaintext">
                                 <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#8ab4f8' }}>
                                     {formData.imageUrl}
                                 </a>
                             </p>
                           )}
                       </div>
                    )}
                 </div>
               </div>
             </div>
            )}


            {/* Requirements Card */}
            <div className="col-12 mb-4">
              <div className="card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                  <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                  <h5 className="mb-0">Additional Requirements & Notes</h5>
                </div>
                <div className="card-body">
                  {isEditing ? (
                    <textarea
                      className="form-control"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Enter any additional requirements or notes..."
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  ) : (
                    <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#fff', whiteSpace: 'pre-wrap' }}> {/* Added whiteSpace pre-wrap */}
                      {formData.requirements || 'No additional requirements or notes specified.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Control (Only shown when editing) */}
            {isEditing && (
              <div className="col-md-6 mb-4">
                <div className="card" style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}>
                  <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px 12px 0 0' }}>
                    <h5 className="mb-0">Update Registration Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label text-muted">Registration Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          // Custom styles for dark background dropdown arrow visibility
                           WebkitAppearance: 'none', // Remove default arrow
                           MozAppearance: 'none',
                           appearance: 'none',
                           // Add a custom background image for the arrow (white arrow)
                           backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                           backgroundRepeat: 'no-repeat',
                           backgroundPosition: 'right .75rem center',
                           backgroundSize: '16px 12px',
                           paddingRight: '2.5rem', // Make space for the custom arrow
                           cursor: 'pointer'
                        }}
                      >
                        <option value="Pending" style={{backgroundColor: '#333', color: '#fff'}}>Pending</option>
                        <option value="Approved" style={{backgroundColor: '#333', color: '#fff'}}>Approved</option>
                        <option value="Rejected" style={{backgroundColor: '#333', color: '#fff'}}>Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div> {/* End row */}
        </div> {/* End main content */}

        {/* Footer */}
        <div className="w-100 px-4 py-3 border-top border-secondary text-center small text-muted"
             style={{ flexShrink: 0 }}
        >
          <p className="mb-0">
            Fisheries Management System • v2.3.1 • © {new Date().getFullYear()} {/* Updated version */}
          </p>
        </div>
      </div> {/* End main content wrapper */}
    </div> // End container-fluid
  );
};

export default OwnerDetails;