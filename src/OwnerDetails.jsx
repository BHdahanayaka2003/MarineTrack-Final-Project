import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './OwnerDetails.css'; // Import the custom CSS
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
  faFileAlt,
  faExclamationTriangle,
  faDownload,
  faExternalLinkAlt // Icon for external links
} from '@fortawesome/free-solid-svg-icons';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { jsPDF } from 'jspdf';

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
  const receivedOwner = location.state?.owner;

  const [owner, setOwner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    boatName: '',
    serialNumber: '',
    registrationId: '',
    year: '',
    power: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '', // Maps to 'nic' in Firestore
    contact: '',
    documentUrl: '',
    imageUrl: '',
    status: '',
    requirements: '',
    lastInspection: '',
    registrationDate: ''
  });

  // --- Effect to fetch data ---
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (receivedOwner && receivedOwner.id) {
          const ownerRef = doc(db, "boat", receivedOwner.id);
          const docSnap = await getDoc(ownerRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Map Firestore 'nic' to local 'idNumber'
            setOwner({ id: docSnap.id, ...data, idNumber: data.nic || '' });
            setFormData({
              name: data.name || '',
              boatName: data.boatName || '',
              serialNumber: data.serialNumber || '',
              registrationId: data.registrationId || '',
              year: data.year || '',
              power: data.power || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              idNumber: data.nic || '', // Populate from 'nic'
              contact: data.contact || '',
              documentUrl: data.documentUrl || '',
              imageUrl: data.imageUrl || '',
              status: data.status || 'Pending',
              requirements: data.requirements || '',
              lastInspection: data.lastInspection || '',
              registrationDate: data.registrationDate || ''
            });
          } else {
             setError("Owner document not found. Redirecting...");
             setOwner(null);
             setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
          }
        } else {
          setError("No owner selected. Redirecting to owners list...");
          setOwner(null);
          setTimeout(() => navigate("/BoatOwnerDetails"), 2000);
        }
      } catch (err) {
        console.error("Error fetching owner data:", err);
        setError("Failed to load owner details. Please try again. " + err.message);
        setOwner(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerData();

  }, [receivedOwner, navigate]);

  // --- Handle Input Changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- Handle Edit/Save Toggle ---
  const handleEditToggle = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
      // Sync formData with current owner state when starting edit
      if (owner) {
         setFormData({
            name: owner.name || '',
            boatName: owner.boatName || '',
            serialNumber: owner.serialNumber || '',
            registrationId: owner.registrationId || '',
            year: owner.year || '',
            power: owner.power || '',
            email: owner.email || '',
            phone: owner.phone || '',
            address: owner.address || '',
            idNumber: owner.idNumber || '', // Use idNumber from state (which came from nic)
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

  // --- Handle Save ---
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
        updatedAt: new Date().toISOString()
      };

      const ownerRef = doc(db, "boat", owner.id);
      await updateDoc(ownerRef, updateData);

      // Update local state with the saved data (mapping nic back to idNumber for local state consistency)
      setOwner({
        ...owner, // Keep existing fields like registrationId which aren't in updateData
        ...updateData,
        idNumber: updateData.nic // Ensure local state uses idNumber
      });
       // Ensure formData is also updated
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

  // --- Generate PDF ---
  const generatePdf = () => {
      if (!owner) {
          console.error("Owner data not loaded for PDF generation.");
          setError("Cannot generate PDF: Owner data not available.");
          setTimeout(() => setError(null), 5000);
          return;
      }

      try {
          const doc = new jsPDF();
          let y = 15; // Initial Y position in mm
          const margin = 10;
          const maxWidth = 190; // A4 width (210) - 2*margin

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.text('Boat & Owner Details', margin, y);
          y += 10;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(100); // Grey color for labels
          doc.text('Status:', margin, y);
          doc.setTextColor(0); // Black color for values
          doc.text(formData.status || 'Not specified', margin + 30, y); // Align value slightly right of label
          y += 15;

          // Owner Information
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Owner Information', margin, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(margin, y, margin + maxWidth, y); // Horizontal line
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          const textIndent = 50; // Indentation for values

          doc.setTextColor(100);
          doc.text('Full Name:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.name || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Contact:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.contact || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('ID Number (NIC):', margin, y);
          doc.setTextColor(0);
          doc.text(formData.idNumber || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Phone Number:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.phone || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Email Address:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.email || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Address:', margin, y);
          doc.setTextColor(0);
          const addressLines = doc.splitTextToSize(formData.address || 'Not provided', maxWidth - textIndent);
          doc.text(addressLines, margin + textIndent, y);
          y += (addressLines.length * 7);

          y += 10;

          // Vessel Information
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Vessel Information', margin, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(margin, y, margin + maxWidth, y);
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);

          doc.setTextColor(100);
          doc.text('Boat Name:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.boatName || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Registration ID:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.registrationId || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Serial Number:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.serialNumber || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Year of Manufacture:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.year || 'Not provided', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Engine Power:', margin, y);
          doc.setTextColor(0);
          doc.text((formData.power ? `${formData.power} HP` : 'Not provided'), margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Last Inspection Date:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.lastInspection || 'Not available', margin + textIndent, y);
          y += 7;

          doc.setTextColor(100);
          doc.text('Registration Date:', margin, y);
          doc.setTextColor(0);
          doc.text(formData.registrationDate || 'Not available', margin + textIndent, y);
          y += 15;

          // Requirements
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text('Additional Requirements & Notes', margin, y);
          y += 7;
          doc.setLineWidth(0.1);
          doc.line(margin, y, margin + maxWidth, y);
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(0);
          const requirementsLines = doc.splitTextToSize(formData.requirements || 'No additional requirements or notes specified.', maxWidth);
          doc.text(requirementsLines, margin, y);
          y += (requirementsLines.length * 7);

          y += 15;

          // Linked Documents/Images
           if (formData.documentUrl || formData.imageUrl) {
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(14);
               doc.setTextColor(0);
               doc.text('Linked Resources', margin, y);
               y += 7;
               doc.setLineWidth(0.1);
               doc.line(margin, y, margin + maxWidth, y);
               y += 5;

               doc.setFont('helvetica', 'normal');
               doc.setFontSize(12);
               doc.setTextColor(100);

               if (formData.documentUrl) {
                   doc.text('Document URL:', margin, y);
                   const linkText = formData.documentUrl;
                   const linkX = margin + textIndent;
                   const linkY = y;
                   doc.setTextColor(0, 0, 255); // Blue color for links
                   doc.text(linkText, linkX, linkY);
                   // Add link annotation
                   const textWidth = doc.getTextWidth(linkText);
                   const textHeight = 7;
                   doc.link(linkX, linkY - textHeight + 1.5, textWidth, textHeight, { url: formData.documentUrl });
                   y += 7; // Move down after adding the link text
               }

                if (formData.imageUrl) {
                   if (formData.documentUrl) y += 3; // Add slight space between links

                   doc.setTextColor(100); // Reset label color
                   doc.text('Image URL:', margin, y);
                   const imageLinkText = formData.imageUrl;
                   const imageLinkX = margin + textIndent;
                   const imageLinkY = y;
                   doc.setTextColor(0, 0, 255); // Blue color for links
                   doc.text(imageLinkText, imageLinkX, imageLinkY);
                    // Add link annotation
                   const imageTextWidth = doc.getTextWidth(imageLinkText);
                   const imageTextHeight = 7;
                   doc.link(imageLinkX, imageLinkY - imageTextHeight + 1.5, imageTextWidth, imageTextHeight, { url: formData.imageUrl });
                   y += 7; // Move down after adding the link text
                }
                y += 8; // Add space after this section
           }


          // Footer
          doc.setFontSize(9);
          doc.setTextColor(150);
          doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, doc.internal.pageSize.height - 10);


          // Save the PDF
          const filename = `BoatOwner_${(formData.name || 'Details').replace(/\s+/g, '_')}_${owner.id}.pdf`;
          doc.save(filename);

      } catch (pdfError) {
          console.error("Error generating PDF:", pdfError);
          setError("Failed to generate PDF. " + pdfError.message);
          setTimeout(() => setError(null), 5000);
      }
  };

  // --- Get Status Class ---
  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // --- Render Loading/Error Screens ---
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span>Loading owner details...</span>
      </div>
    );
  }

   if (error && !owner) {
        return (
            <div className="error-screen">
                 <div className="alert alert-danger alert-custom" role="alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-3" size="lg" /> {/* Larger icon */}
                    <div>
                         <h5 className="alert-heading">Error Loading Details</h5> {/* Added heading */}
                         {error}
                    </div>
                </div>
            </div>
        );
   }

   // Fallback if owner is null after loading without an error being set (shouldn't happen with the above, but defensive)
   if (!owner) {
       return (
           <div className="error-screen">
               <div className="alert alert-info alert-custom" role="alert">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-3" size="lg" />
                   <div>No owner data available. Redirecting...</div>
               </div>
           </div>
       );
   }


  // --- Main Render ---
  return (
    <div className="owner-details-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header-section d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img
              src={logoImage}
              alt="Logo"
              className="logo"
              onClick={() => navigate("/Dashboard")}
            />
            <h4 className="mb-0">Fisheries Management</h4>
          </div>

          <button
            className="btn btn-outline-light"
            onClick={() => navigate("/BoatOwnerDetails")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Owners List
          </button>
        </div>

        {/* Main Content Area */}
        <div className="main-content-area">
          {/* Title Section & Action Buttons */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div>
              <h2 className="section-title">
                <FontAwesomeIcon icon={faShip} />
                Boat & Owner Details
              </h2>
              <p className="text-muted mb-0">
                Registration ID: <span className="text-white">{owner.registrationId || 'N/A'}</span>
              </p>
               <p className="text-muted small mb-0">
                 Database ID: <span className="text-white">{owner.id}</span>
               </p>
            </div>

            {/* Buttons */}
            <div className="mt-3 mt-md-0 d-flex align-items-center flex-wrap justify-content-start justify-content-md-end gap-2"> {/* Added gap */}
                {/* PDF Download Button */}
                {!isEditing && owner && (
                    <button
                        className="btn btn-outline-info"
                        onClick={generatePdf}
                        disabled={isSaving}
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Download PDF
                    </button>
                )}

                {/* Edit/Save Button */}
                <button
                  className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleEditToggle}
                  disabled={isSaving || isLoading}
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

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger alert-custom" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-3" size="lg" />
              <div>
                <h5 className="alert-heading mb-1">Error!</h5>
                {error}
                </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-custom" role="alert">
              <FontAwesomeIcon icon={faSave} className="me-3" size="lg" />
              <div>
                 <h5 className="alert-heading mb-1">Success!</h5>
                 {success}
                </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="row g-4"> {/* Added gap between columns/rows */}
            {/* Owner Information Card */}
            <div className="col-md-6">
              <div className="card card-custom h-100">
                <div className="card-header card-header-custom d-flex align-items-center">
                  <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                  <h5 className="mb-0">Owner Information</h5>
                </div>
                <div className="card-body card-body-custom">
                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faUser} />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.name || 'Not provided'}</p>
                    )}
                  </div>

                   <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faPhone} /> {/* Using phone icon for contact */}
                      Contact Person
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="Enter contact person"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.contact || 'Not provided'}</p>
                    )}
                  </div>


                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faIdCard} />
                      ID Number (NIC)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleChange}
                        placeholder="Enter NIC"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.idNumber || 'Not provided'}</p>
                    )}
                  </div>

                   <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faPhone} />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control form-control-custom"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.phone || 'Not provided'}</p>
                    )}
                  </div>


                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        className="form-control form-control-custom"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-0"> {/* mb-0 for the last item in card */}
                    <label className="form-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        className="form-control form-control-custom"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.address || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boat Information Card */}
            <div className="col-md-6">
              <div className="card card-custom h-100">
                <div className="card-header card-header-custom d-flex align-items-center">
                  <FontAwesomeIcon icon={faShip} className="me-2 text-primary" />
                  <h5 className="mb-0">Vessel Information</h5>
                </div>
                <div className="card-body card-body-custom">
                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faAnchor} />
                      Boat Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="boatName"
                        value={formData.boatName}
                        onChange={handleChange}
                        placeholder="Enter boat name"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.boatName || 'Not provided'}</p>
                    )}
                  </div>

                   <div className="mb-3">
                       <label className="form-label">
                           <FontAwesomeIcon icon={faIdCard} />
                           Registration ID
                       </label>
                       {/* Registration ID is generally read-only */}
                       <p className="form-control-plaintext form-control-plaintext-custom">{formData.registrationId || 'Not provided'}</p>
                   </div>


                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faIdCard} /> {/* Using ID card icon for serial number */}
                      Serial Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        placeholder="Enter serial number"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.serialNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Year of Manufacture
                    </label>
                    {isEditing ? (
                      <input
                        type="text" // Can also be 'number' if validation is needed
                        className="form-control form-control-custom"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                         placeholder="e.g., 2020"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.year || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faTachometerAlt} />
                      Engine Power (HP)
                    </label>
                    {isEditing ? (
                      <input
                        type="text" // Can be 'number'
                        className="form-control form-control-custom"
                        name="power"
                        value={formData.power}
                        onChange={handleChange}
                        placeholder="e.g., 150"
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.power ? `${formData.power} HP` : 'Not provided'}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Last Inspection Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control form-control-custom"
                        name="lastInspection"
                        value={formData.lastInspection}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="form-control-plaintext form-control-plaintext-custom">{formData.lastInspection || 'Not available'}</p>
                    )}
                  </div>

                   <div className="mb-0"> {/* mb-0 for the last item */}
                     <label className="form-label">
                       <FontAwesomeIcon icon={faCalendarAlt} />
                       Registration Date
                     </label>
                     {isEditing ? (
                       <input
                         type="date"
                         className="form-control form-control-custom"
                         name="registrationDate"
                         value={formData.registrationDate}
                         onChange={handleChange}
                       />
                     ) : (
                       <p className="form-control-plaintext form-control-plaintext-custom">{formData.registrationDate || 'Not available'}</p>
                     )}
                   </div>

                </div>
              </div>
            </div>

             {/* Status & Documents/URLs Card (Combine these or place them logically) */}
             {/* Placing Status and Documents side-by-side or stacked depending on screen size */}
             <div className="col-md-6">
                 <div className="card card-custom h-100">
                    <div className="card-header card-header-custom d-flex align-items-center">
                        <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                        <h5 className="mb-0">Registration Status & Resources</h5>
                    </div>
                     <div className="card-body card-body-custom">
                          {/* Status Control */}
                           <div className="mb-4">
                             <label className="form-label">Registration Status</label>
                             {isEditing ? (
                               <select
                                 className="form-select form-select-custom"
                                 name="status"
                                 value={formData.status}
                                 onChange={handleChange}
                               >
                                 <option value="Pending">Pending</option>
                                 <option value="Approved">Approved</option>
                                 <option value="Rejected">Rejected</option>
                               </select>
                             ) : (
                                <span className={`badge ${getStatusClass(formData.status)} status-badge`}>
                                  {formData.status || 'Pending'}
                                </span>
                             )}
                           </div>

                           {/* Linked Document URL */}
                           <div className="mb-3">
                             <label className="form-label">Linked Document URL</label>
                             {isEditing ? (
                                 <input
                                   type="text"
                                   className="form-control form-control-custom"
                                   name="documentUrl"
                                   value={formData.documentUrl}
                                   onChange={handleChange}
                                   placeholder="Enter document URL"
                                 />
                             ) : (
                                <p className="form-control-plaintext form-control-plaintext-custom">
                                    {formData.documentUrl ? (
                                        <a href={formData.documentUrl} target="_blank" rel="noopener noreferrer" className="link-display">
                                            {formData.documentUrl} <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" className="ms-1" />
                                        </a>
                                    ) : 'Not provided'}
                                </p>
                             )}
                           </div>

                           {/* Linked Image URL */}
                           <div className="mb-0"> {/* mb-0 for last item */}
                             <label className="form-label">Linked Image URL</label>
                              {isEditing ? (
                                 <input
                                   type="text"
                                   className="form-control form-control-custom"
                                   name="imageUrl"
                                   value={formData.imageUrl}
                                   onChange={handleChange}
                                   placeholder="Enter image URL"
                                 />
                               ) : (
                                 <p className="form-control-plaintext form-control-plaintext-custom">
                                     {formData.imageUrl ? (
                                         <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="link-display">
                                             {formData.imageUrl} <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" className="ms-1" />
                                         </a>
                                     ) : 'Not provided'}
                                 </p>
                               )}
                           </div>
                     </div>
                 </div>
             </div>


            {/* Requirements Card */}
            <div className="col-12">
              <div className="card card-custom">
                <div className="card-header card-header-custom d-flex align-items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                  <h5 className="mb-0">Additional Requirements & Notes</h5>
                </div>
                <div className="card-body card-body-custom">
                  {isEditing ? (
                    <textarea
                      className="form-control form-control-custom"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Enter any additional requirements or notes..."
                    />
                  ) : (
                    <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#fff', whiteSpace: 'pre-wrap' }}>
                      {formData.requirements || 'No additional requirements or notes specified.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div> {/* End row */}
        </div> {/* End main content area */}

        {/* Footer */}
        <div className="w-100 px-4 py-3 border-top border-secondary text-center small text-muted"
             style={{ flexShrink: 0 }}
        >
          <p className="mb-0">
            Fisheries Management System • v2.4.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div> {/* End content wrapper */}
    </div> // End container-fluid
  );
};

export default OwnerDetails;



