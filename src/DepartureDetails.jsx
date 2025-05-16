import React, { useState, useEffect, useRef, useCallback } from 'react';
// No useNavigate needed in this single component structure, but keep if you plan to route later
// import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  // setDoc, // Not directly used, addDoc or updateDoc are more common
  // query, // Used implicitly or can be explicit
  // where, // Used implicitly or can be explicit
  // orderBy, // Used implicitly or can be explicit
  // limit, // Used implicitly or can be explicit
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShip,
  faUserTie,
  faSearch,
  faCalendarAlt,
  faHistory,
  faExclamationTriangle,
  faAnchor,
  faSignOutAlt,
  faSignInAlt,
  faCheckCircle,
  faSyncAlt,
  faChartLine,
  faUserFriends,
  // faDatabase, // Not used, can remove
  faFilePdf,
  faFileExcel,
  faSpinner,
  faPieChart,
  faTools, // for boat condition
  faRoute, // for destination
} from '@fortawesome/free-solid-svg-icons';
import { format, isValid, parseISO, subDays } from 'date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import _ from 'lodash';
import Select from 'react-select'; // For multi-select
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Firebase configuration (Ensure this is secure, ideally from environment variables in a real app)
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

const DepartureDetails = () => {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [boats, setBoats] = useState([]);
  const [fishermen, setFishermen] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [formData, setFormData] = useState({
    departureDate: format(new Date(), 'yyyy-MM-dd'),
    departureTime: format(new Date(), 'HH:mm'),
    boatId: '',
    selectedFishermen: [],
    weatherCondition: 'Fair',
    estimatedReturn: '',
    destination: '',
    purpose: 'Fishing',
    notes: ''
  });
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [arrivalFormData, setArrivalFormData] = useState({
    boatId: '',
    arrivalDate: format(new Date(), 'yyyy-MM-dd'),
    arrivalTime: format(new Date(), 'HH:mm'),
    notes: '',
    catchDetails: '',
    condition: 'Good'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('boat');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [departureStats, setDepartureStats] = useState({
    totalDepartures: 0,
    activeDepartures: 0,
    returnedBoats: 0,
    overdue: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [filteredDepartures, setFilteredDepartures] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [departureArrivalChartData, setDepartureArrivalChartData] = useState({ labels: [], datasets: [] });
  const [tripPurposeChartData, setTripPurposeChartData] = useState({ labels: [], datasets: [] });
  const [boatConditionChartData, setBoatConditionChartData] = useState({ labels: [], datasets: [] });
  const [availableFishermen, setAvailableFishermen] = useState([]);

  // Refs
  const alertTimeout = useRef();

  // --- HELPER FUNCTIONS ---
  const showNotification = useCallback((message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    if (alertTimeout.current) {
      clearTimeout(alertTimeout.current);
    }
    alertTimeout.current = setTimeout(() => setShowAlert(false), 5000);
  }, []); // setAlertMessage, setAlertType, setShowAlert are stable state setters

  // --- DATA FETCHING & PROCESSING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const boatsSnapshot = await getDocs(collection(db, "boat"));
      const boatsData = boatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBoats(boatsData);

      const fishermenSnapshot = await getDocs(collection(db, "fishermen"));
      const fishermenData = fishermenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFishermen(fishermenData);

      const departuresSnapshot = await getDocs(collection(db, "departures"));
      const departuresData = departuresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestampDate: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date()
      }));
      departuresData.sort((a, b) => (b.timestampDate || 0) - (a.timestampDate || 0));
      setDepartures(departuresData);

    } catch (error) {
      console.error("Error fetching data: ", error);
      showNotification("Failed to load data. Please try again.", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized helper functions for data processing (called within useEffect)
  // These don't need to be useCallback if only used in one useEffect and their dependencies are already in that useEffect
  const calculateStats = useCallback(() => {
    const now = new Date();
    const active = departures.filter(dep => dep.status === 'departed' && !dep.arrivalTimestamp).length;
    const returned = departures.filter(dep => dep.status === 'returned').length;
    const overdueCount = departures.filter(dep => {
      if (!dep.estimatedReturnTimestamp || dep.status === 'returned') return false;
      const estReturn = dep.estimatedReturnTimestamp.toDate ? dep.estimatedReturnTimestamp.toDate() : new Date(dep.estimatedReturnTimestamp);
      return isValid(estReturn) && now > estReturn && dep.status === 'departed';
    }).length;
    setDepartureStats({ totalDepartures: departures.length, activeDepartures: active, returnedBoats: returned, overdue: overdueCount });
  }, [departures]);

  const generateChartsData = useCallback(() => {
    const daysForChart = 30;
    const chartLabels = Array.from({ length: daysForChart }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const depsByDate = _.groupBy(
      departures.filter(d => d.departureTimestamp && isValid(d.departureTimestamp.toDate())),
      item => format(item.departureTimestamp.toDate(), 'yyyy-MM-dd')
    );
    const arrivalsByDate = _.groupBy(
      departures.filter(d => d.arrivalTimestamp && isValid(d.arrivalTimestamp.toDate())),
      item => format(item.arrivalTimestamp.toDate(), 'yyyy-MM-dd')
    );

    setDepartureArrivalChartData({
      labels: chartLabels.map(date => format(parseISO(date), 'MMM dd')),
      datasets: [
        { label: 'Departures', data: chartLabels.map(date => (depsByDate[date] || []).length), backgroundColor: 'rgba(53, 162, 235, 0.7)' },
        { label: 'Arrivals', data: chartLabels.map(date => (arrivalsByDate[date] || []).length), backgroundColor: 'rgba(75, 192, 192, 0.7)' }
      ]
    });

    const purposeCounts = _.countBy(departures, 'purpose');
    setTripPurposeChartData({
      labels: Object.keys(purposeCounts),
      datasets: [{
        label: 'Trip Purposes',
        data: Object.values(purposeCounts),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
      }]
    });

    const returnedDepartures = departures.filter(d => d.status === 'returned' && d.boatCondition);
    const conditionCounts = _.countBy(returnedDepartures, 'boatCondition');
    setBoatConditionChartData({
        labels: Object.keys(conditionCounts),
        datasets: [{
            label: 'Boat Conditions on Return',
            data: Object.values(conditionCounts),
            backgroundColor: ['#4CAF50', '#FFC107', '#FF9800', '#F44336', '#9E9E9E'],
        }]
    });
  }, [departures]);
  
  const filterDeparturesInternal = useCallback(() => {
    let filtered = [...departures];
    if (dateRange.startDate && dateRange.endDate) {
        try {
            const start = parseISO(dateRange.startDate);
            start.setHours(0,0,0,0);
            const end = parseISO(dateRange.endDate);
            end.setHours(23,59,59,999);

            if (!isValid(start) || !isValid(end)) {
                console.warn("Invalid date range for filtering.");
            } else {
                filtered = filtered.filter(dep => {
                    const depDate = dep.departureTimestamp ? dep.departureTimestamp.toDate() : null;
                    return depDate && isValid(depDate) && depDate >= start && depDate <= end;
                });
            }
        } catch (e) {
            console.error("Error parsing date range:", e);
        }
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      if (searchType === 'boat') {
        filtered = filtered.filter(dep =>
          dep.boatName?.toLowerCase().includes(query) || dep.boatId?.toLowerCase().includes(query)
        );
      } else if (searchType === 'fisherman') {
        filtered = filtered.filter(dep =>
          (dep.fishermenNames && dep.fishermenNames.some(name => name.toLowerCase().includes(query))) ||
          (dep.fishermenNICs && dep.fishermenNICs.some(nic => nic.toLowerCase().includes(query))) ||
          dep.fishermanName?.toLowerCase().includes(query) ||
          dep.fishermanNIC?.toLowerCase().includes(query)
        );
      }
    }
    setFilteredDepartures(filtered);
  }, [departures, dateRange, searchQuery, searchType]);

  const extractRecentActivities = useCallback(() => {
    const recent = departures.slice(0, 5).map(dep => {
      let activity = '';
      let timestamp = dep.timestamp; 
      let fishermenDisplay = dep.fishermenNames ? dep.fishermenNames.join(', ') : (dep.fishermanName || 'Unknown Fishermen');

      if (dep.status === 'departed') {
        activity = `${dep.boatName || dep.boatId} departed with ${fishermenDisplay}`;
        timestamp = dep.departureTimestamp;
      } else if (dep.status === 'returned') {
        activity = `${dep.boatName || dep.boatId} returned safely`;
        timestamp = dep.arrivalTimestamp;
      }
      let activityDate = new Date(); // Default to now
      if (timestamp) {
        activityDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (!isValid(activityDate)) activityDate = new Date(); // Fallback for invalid dates
      }

      return {
        id: dep.id, activity,
        timestamp: activityDate,
        type: dep.status
      };
    });
    setRecentActivities(recent);
  }, [departures]);


  useEffect(() => {
    const activeFishermenNICs = departures
        .filter(dep => dep.status === 'departed' && !dep.arrivalTimestamp)
        .flatMap(dep => dep.fishermenNICs || (dep.fishermanNIC ? [dep.fishermanNIC] : [])); 

    const available = fishermen.filter(f => !activeFishermenNICs.includes(f.fishermenNIC));
    setAvailableFishermen(available);

    if (departures.length > 0) {
      calculateStats();
      generateChartsData();
      filterDeparturesInternal();
      extractRecentActivities();
    } else { 
        setDepartureStats({ totalDepartures: 0, activeDepartures: 0, returnedBoats: 0, overdue: 0 });
        setDepartureArrivalChartData({ labels: [], datasets: [] });
        setTripPurposeChartData({ labels: [], datasets: [] });
        setBoatConditionChartData({ labels: [], datasets: [] });
        setFilteredDepartures([]);
        setRecentActivities([]);
    }
  }, [departures, fishermen, searchQuery, searchType, dateRange, calculateStats, generateChartsData, filterDeparturesInternal, extractRecentActivities]);

  useEffect(() => {
    return () => {
      if (alertTimeout.current) clearTimeout(alertTimeout.current);
    };
  }, []);


  const getBoatById = (id) => boats.find(boat => boat.id === id);
  // const getFishermanByNIC = (nic) => fishermen.find(fisherman => fisherman.fishermenNIC === nic); // Not actively used, but keep if needed

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isValid(date) ? format(date, 'MMM dd, yyyy HH:mm') : 'Invalid date';
    } catch (error) {
      console.warn("Error formatting timestamp:", timestamp, error);
      return 'Invalid date';
    }
  };

  // --- FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'boatId') setSelectedBoat(getBoatById(value));
  };
  
  const handleFishermenSelectChange = (selectedOptions) => {
    setFormData(prev => ({ ...prev, selectedFishermen: selectedOptions || [] }));
  };

  const handleArrivalInputChange = (e) => {
    const { name, value } = e.target;
    setArrivalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterDeparture = async (e) => {
    e.preventDefault();
    if (!formData.boatId || formData.selectedFishermen.length === 0) {
      showNotification("Please select a boat and at least one fisherman.", "danger");
      return;
    }
    const currentSelectedBoat = getBoatById(formData.boatId); // Re-fetch boat details at submission time
    if (!currentSelectedBoat) {
        showNotification("Selected boat not found or data is stale. Please re-select.", "danger");
        return;
    }

    setIsSubmitting(true);
    try {
      const activeBoatDeparture = departures.find(
        dep => dep.boatId === formData.boatId && dep.status === 'departed'
      );
      if (activeBoatDeparture) {
        showNotification(`Boat ${currentSelectedBoat.boatName || formData.boatId} is already out at sea.`, "warning");
        setIsSubmitting(false);
        return;
      }

      const departureDatetime = new Date(`${formData.departureDate}T${formData.departureTime}`);
      if (!isValid(departureDatetime)) {
        showNotification("Invalid departure date or time.", "danger");
        setIsSubmitting(false);
        return;
      }
      let estimatedReturnTimestamp = null;
      if (formData.estimatedReturn) {
        const estReturnDate = new Date(formData.estimatedReturn);
        if (isValid(estReturnDate)) {
            estimatedReturnTimestamp = Timestamp.fromDate(estReturnDate);
        } else {
            showNotification("Invalid estimated return date/time.", "warning"); // Non-blocking warning
        }
      }

      const fishermenNICs = formData.selectedFishermen.map(f => f.value);
      const fishermenNames = formData.selectedFishermen.map(f => f.label.split(' (')[0]); 

      const departureData = {
        boatId: formData.boatId,
        boatName: currentSelectedBoat.boatName || 'Unknown Boat',
        fishermenNICs, 
        fishermenNames, 
        departureTimestamp: Timestamp.fromDate(departureDatetime),
        estimatedReturnTimestamp,
        weatherCondition: formData.weatherCondition,
        destination: formData.destination,
        purpose: formData.purpose,
        notes: formData.notes,
        status: 'departed',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "departures"), departureData);
      showNotification(`Successfully registered departure for ${currentSelectedBoat.boatName || formData.boatId}.`, "success");
      setFormData({
        departureDate: format(new Date(), 'yyyy-MM-dd'),
        departureTime: format(new Date(), 'HH:mm'),
        boatId: '', selectedFishermen: [], weatherCondition: 'Fair',
        estimatedReturn: '', destination: '', purpose: 'Fishing', notes: ''
      });
      setSelectedBoat(null);
      fetchData(); 
    } catch (error) {
      console.error("Error registering departure: ", error);
      showNotification("Failed to register departure. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterArrival = async (e) => {
    e.preventDefault();
    if (!arrivalFormData.boatId) {
      showNotification("Please select a boat for arrival.", "danger");
      return;
    }
    setIsSubmitting(true);
    try {
      const activeDeparture = departures.find(
        dep => dep.boatId === arrivalFormData.boatId && dep.status === 'departed'
      );
      if (!activeDeparture) {
        showNotification(`No active departure found for this boat. It might have already returned or was not properly registered.`, "warning");
        setIsSubmitting(false);
        return;
      }

      const arrivalDatetime = new Date(`${arrivalFormData.arrivalDate}T${arrivalFormData.arrivalTime}`);
      if (!isValid(arrivalDatetime)) {
        showNotification("Invalid arrival date or time.", "danger");
        setIsSubmitting(false);
        return;
      }

      const departureRef = doc(db, "departures", activeDeparture.id);
      await updateDoc(departureRef, {
        arrivalTimestamp: Timestamp.fromDate(arrivalDatetime),
        arrivalNotes: arrivalFormData.notes,
        catchDetails: arrivalFormData.catchDetails,
        boatCondition: arrivalFormData.condition,
        status: 'returned',
        lastUpdated: serverTimestamp()
      });

      showNotification(`Successfully registered arrival for boat ${activeDeparture.boatName || arrivalFormData.boatId}.`, "success");
      setArrivalFormData({
        boatId: '', arrivalDate: format(new Date(), 'yyyy-MM-dd'), arrivalTime: format(new Date(), 'HH:mm'),
        notes: '', catchDetails: '', condition: 'Good'
      });
      fetchData(); 
    } catch (error) {
      console.error("Error registering arrival: ", error);
      showNotification("Failed to register arrival. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterDeparturesInternal(); // Explicit call on button click
  };

  // --- REPORT GENERATION ---
  const generatePdfReport = () => {
    if (filteredDepartures.length === 0) {
        showNotification("No data to generate PDF report.", "warning");
        return;
    }
    const pdfDoc = new jsPDF(); // Renamed to avoid conflict with firebase `doc`
    pdfDoc.text("Departure and Arrival Records", 14, 16);
    pdfDoc.setFontSize(10);
    pdfDoc.text(`Report generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 22);
    pdfDoc.text(`Filters: From ${dateRange.startDate} to ${dateRange.endDate}${searchQuery ? `, Query: "${searchQuery}" by ${searchType}` : ''}`, 14, 28);

    const tableColumn = ["Boat", "Fishermen", "Departure", "Est. Return", "Arrival", "Status", "Purpose"];
    const tableRows = [];

    filteredDepartures.forEach(dep => {
      const fishermenDisplay = dep.fishermenNames ? dep.fishermenNames.join(', ') : (dep.fishermanName || 'N/A');
      const departureData = [
        `${dep.boatName || 'Unknown'} (${dep.boatId})`,
        fishermenDisplay,
        formatTimestamp(dep.departureTimestamp),
        formatTimestamp(dep.estimatedReturnTimestamp),
        formatTimestamp(dep.arrivalTimestamp),
        dep.status,
        dep.purpose || 'N/A'
      ];
      tableRows.push(departureData);
    });

    pdfDoc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] }, 
        styles: { fontSize: 8 },
    });
    pdfDoc.save(`departures_report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    showNotification("PDF report generated successfully.", "success");
  };

  const generateExcelReport = () => {
    if (filteredDepartures.length === 0) {
        showNotification("No data to generate Excel report.", "warning");
        return;
    }
    const worksheetData = filteredDepartures.map(dep => ({
      'Boat Name': dep.boatName || 'Unknown',
      'Boat ID': dep.boatId,
      'Fishermen Names': dep.fishermenNames ? dep.fishermenNames.join(', ') : (dep.fishermanName || 'N/A'),
      'Fishermen NICs': dep.fishermenNICs ? dep.fishermenNICs.join(', ') : (dep.fishermanNIC || 'N/A'),
      'Departure Timestamp': formatTimestamp(dep.departureTimestamp),
      'Estimated Return': formatTimestamp(dep.estimatedReturnTimestamp),
      'Arrival Timestamp': formatTimestamp(dep.arrivalTimestamp),
      'Weather': dep.weatherCondition,
      'Destination': dep.destination,
      'Purpose': dep.purpose,
      'Departure Notes': dep.notes,
      'Arrival Notes': dep.arrivalNotes,
      'Catch Details': dep.catchDetails,
      'Boat Condition on Return': dep.boatCondition,
      'Status': dep.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departures");
    XLSX.writeFile(workbook, `departures_report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    showNotification("Excel report generated successfully.", "success");
  };


  // --- UI COMPONENTS ---
  const Alert = () => showAlert && (
    <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert" style={{position: 'fixed', top: '20px', right: '20px', zIndex: 2000, minWidth: '300px'}}>
      {alertMessage}
      <button type="button" className="btn-close" onClick={() => setShowAlert(false)} aria-label="Close"></button>
    </div>
  );

  const LoadingSpinner = ({ message = "Loading data..."}) => (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' /* Adjust based on header/footer height */}}>
      <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary mb-2" />
      <p className="mt-2 text-white">{message}</p>
    </div>
  );

  const StatusBadge = ({ status }) => {
    let badgeClass = 'badge ';
    let icon = null;
    let text = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

    switch (status) {
      case 'departed': badgeClass += 'bg-info text-dark'; icon = faSignOutAlt; break;
      case 'returned': badgeClass += 'bg-success'; icon = faCheckCircle; break;
      case 'overdue': badgeClass += 'bg-danger'; icon = faExclamationTriangle; break;
      default: badgeClass += 'bg-secondary';
    }
    return <span className={badgeClass}>{icon && <FontAwesomeIcon icon={icon} className="me-1" />} {text}</span>;
  };

  const DashboardCard = ({ title, value, icon, color, className = "col-md-3" }) => (
    <div className={`${className} mb-4`}>
      <div className="card border-0 shadow-sm h-100 bg-white text-dark">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className={`rounded-circle bg-${color}-soft p-3 text-${color}`}>
                <FontAwesomeIcon icon={icon} size="2x" />
              </div>
            </div>
            <div className="col">
              <h6 className="text-muted text-uppercase small">{title}</h6>
              <h2 className="mb-0 fw-bold">{value}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- SECTIONS ---
  const DashboardSection = () => (
    <div className="dashboard-section">
      <h4 className="mb-4 text-white"><FontAwesomeIcon icon={faChartLine} className="me-2" />Dashboard Overview</h4>
      <div className="row">
        <DashboardCard title="Total Departures" value={departureStats.totalDepartures} icon={faShip} color="primary" />
        <DashboardCard title="Active Departures" value={departureStats.activeDepartures} icon={faSignOutAlt} color="info" />
        <DashboardCard title="Returned Boats" value={departureStats.returnedBoats} icon={faAnchor} color="success" />
        <DashboardCard title="Overdue" value={departureStats.overdue} icon={faExclamationTriangle} color="danger" />
      </div>

      <div className="row mt-4">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm h-100 bg-white text-dark">
            <div className="card-header bg-light border-0"><h5 className="mb-0">Departure & Arrival Trend (Last 30 Days)</h5></div>
            <div className="card-body" style={{minHeight: '300px'}}>
              {departureArrivalChartData.labels && departureArrivalChartData.labels.length > 0 ?
                <Bar data={departureArrivalChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, suggestedMax: Math.max(...(departureArrivalChartData.datasets?.[0]?.data || []), ...(departureArrivalChartData.datasets?.[1]?.data || [])) + 2 } } }} />
                : <p className="text-center text-muted mt-5">No data for chart.</p>}
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100 bg-white text-dark">
            <div className="card-header bg-light border-0"><h5 className="mb-0">Recent Activities</h5></div>
            <div className="card-body p-0" style={{maxHeight: '350px', overflowY: 'auto'}}>
              {recentActivities.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {recentActivities.map((act, idx) => (
                    <li key={act.id + idx} className="list-group-item">
                      <p className="mb-1 small">{act.activity}</p>
                      <small className={`text-${act.type === 'departed' ? 'info' : 'success'}`}>
                        <FontAwesomeIcon icon={act.type === 'departed' ? faSignOutAlt : faSignInAlt} className="me-1" />
                        {format(act.timestamp, 'MMM dd, HH:mm')}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-center text-muted p-3">No recent activities.</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-2">
        <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100 bg-white text-dark">
                <div className="card-header bg-light border-0"><h5 className="mb-0"><FontAwesomeIcon icon={faPieChart} className="me-2" />Trip Purposes</h5></div>
                <div className="card-body d-flex justify-content-center align-items-center" style={{minHeight: '250px'}}>
                    {tripPurposeChartData.labels && tripPurposeChartData.labels.length > 0 ?
                        <Pie data={tripPurposeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        : <p className="text-center text-muted">No trip purpose data.</p>}
                </div>
            </div>
        </div>
        <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100 bg-white text-dark">
                <div className="card-header bg-light border-0"><h5 className="mb-0"><FontAwesomeIcon icon={faTools} className="me-2" />Boat Conditions on Return</h5></div>
                <div className="card-body d-flex justify-content-center align-items-center" style={{minHeight: '250px'}}>
                     {boatConditionChartData.labels && boatConditionChartData.labels.length > 0 ?
                        <Pie data={boatConditionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        : <p className="text-center text-muted">No boat condition data.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const DepartureFormSection = () => {
    const fishermenOptions = availableFishermen.map(f => ({
        value: f.fishermenNIC,
        label: `${f.fishermenName} (${f.fishermenNIC})`
    }));

    return (
    <div className="departure-form-section">
      <h4 className="mb-4 text-white"><FontAwesomeIcon icon={faSignOutAlt} className="me-2" />Register New Departure</h4>
      <div className="card border-0 shadow-sm bg-white text-dark">
        <div className="card-body">
          <form onSubmit={handleRegisterDeparture}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="boatId" className="form-label">Boat <span className="text-danger">*</span></label>
                  <select className="form-select" id="boatId" name="boatId" value={formData.boatId} onChange={handleInputChange} required>
                    <option value="">Select a boat</option>
                    {boats.map(boat => <option key={boat.id} value={boat.id}>{boat.boatName || 'Unnamed Boat'} ({boat.boatRegNo || boat.id})</option>)}
                  </select>
                  {selectedBoat && <div className="mt-2 p-2 bg-light rounded small"><strong>Details:</strong> Reg No: {selectedBoat.boatRegNo}, L: {selectedBoat.boatLength}m, Cap: {selectedBoat.capacity}, Contact: {selectedBoat.contact}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="selectedFishermen" className="form-label">Fishermen <span className="text-danger">*</span></label>
                  <Select
                    id="selectedFishermen"
                    isMulti
                    options={fishermenOptions}
                    value={formData.selectedFishermen}
                    onChange={handleFishermenSelectChange}
                    placeholder="Select fishermen..."
                    noOptionsMessage={() => availableFishermen.length === 0 && fishermen.length > 0 ? "All fishermen are currently active" : (fishermen.length === 0 ? "No fishermen registered" : "Type to search...")}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    required // Note: react-select doesn't natively support HTML5 required. Validation handled in submit.
                  />
                   {formData.selectedFishermen.length > 0 && (
                    <div className="mt-2 p-2 bg-light rounded small">
                        <strong>Selected:</strong> {formData.selectedFishermen.map(f => f.label.split(' (')[0]).join(', ')}
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="departureDate" className="form-label">Departure Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" id="departureDate" name="departureDate" value={formData.departureDate} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="departureTime" className="form-label">Departure Time <span className="text-danger">*</span></label>
                    <input type="time" className="form-control" id="departureTime" name="departureTime" value={formData.departureTime} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="weatherCondition" className="form-label">Weather Condition</label>
                  <select className="form-select" id="weatherCondition" name="weatherCondition" value={formData.weatherCondition} onChange={handleInputChange}>
                    {['Fair', 'Good', 'Moderate', 'Rough', 'Stormy'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="destination" className="form-label">Destination <FontAwesomeIcon icon={faRoute} className="ms-1 text-muted"/></label>
                  <input type="text" className="form-control" id="destination" name="destination" value={formData.destination} onChange={handleInputChange} placeholder="e.g., North Fishing Grounds" />
                </div>
                <div className="mb-3">
                  <label htmlFor="purpose" className="form-label">Purpose</label>
                  <select className="form-select" id="purpose" name="purpose" value={formData.purpose} onChange={handleInputChange}>
                    {['Fishing', 'Maintenance', 'Transport', 'Tourism', 'Survey', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="estimatedReturn" className="form-label">Estimated Return (Date & Time)</label>
                  <input type="datetime-local" className="form-control" id="estimatedReturn" name="estimatedReturn" value={formData.estimatedReturn} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea className="form-control" id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows="2" placeholder="Any additional information"></textarea>
                </div>
              </div>
            </div>
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Processing...</> : <><FontAwesomeIcon icon={faSignOutAlt} className="me-2" />Register Departure</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )};

  const ArrivalFormSection = () => (
    <div className="arrival-form-section">
      <h4 className="mb-4 text-white"><FontAwesomeIcon icon={faSignInAlt} className="me-2" />Register Boat Arrival</h4>
      <div className="card border-0 shadow-sm bg-white text-dark">
        <div className="card-body">
          <form onSubmit={handleRegisterArrival}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="arrivalBoatId" className="form-label">Boat (Currently Departed) <span className="text-danger">*</span></label>
                  <select className="form-select" id="arrivalBoatId" name="boatId" value={arrivalFormData.boatId} onChange={handleArrivalInputChange} required>
                    <option value="">Select a boat to mark as arrived</option>
                    {departures
                      .filter(dep => dep.status === 'departed')
                      .map(dep => <option key={dep.id} value={dep.boatId}>
                        {dep.boatName || 'Unknown Boat'} ({getBoatById(dep.boatId)?.boatRegNo || dep.boatId}) - Crew: {dep.fishermenNames ? dep.fishermenNames.join(', ') : (dep.fishermanName || 'N/A')}
                      </option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="arrivalDate" className="form-label">Arrival Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" id="arrivalDate" name="arrivalDate" value={arrivalFormData.arrivalDate} onChange={handleArrivalInputChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="arrivalTime" className="form-label">Arrival Time <span className="text-danger">*</span></label>
                    <input type="time" className="form-control" id="arrivalTime" name="arrivalTime" value={arrivalFormData.arrivalTime} onChange={handleArrivalInputChange} required />
                  </div>
                </div>
                 <div className="mb-3">
                  <label htmlFor="condition" className="form-label">Boat Condition <FontAwesomeIcon icon={faTools} className="ms-1 text-muted"/></label>
                  <select className="form-select" id="condition" name="condition" value={arrivalFormData.condition} onChange={handleArrivalInputChange}>
                    {['Good', 'Fair', 'Needs Maintenance', 'Damaged', 'Lost/Sunk'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="catchDetails" className="form-label">Catch Details</label>
                  <textarea className="form-control" id="catchDetails" name="catchDetails" value={arrivalFormData.catchDetails} onChange={handleArrivalInputChange} rows="3" placeholder="e.g., Tuna: 500kg, Mackerel: 200kg"></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="arrivalNotes" className="form-label">Arrival Notes</label>
                  <textarea className="form-control" id="notes" name="notes" value={arrivalFormData.notes} onChange={handleArrivalInputChange} rows="3" placeholder="Any issues during trip, observations, etc."></textarea>
                </div>
              </div>
            </div>
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                {isSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Processing...</> : <><FontAwesomeIcon icon={faAnchor} className="me-2" />Register Arrival</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const RecordsSection = () => (
    <div className="records-section">
      <h4 className="mb-4 text-white"><FontAwesomeIcon icon={faHistory} className="me-2" />Departure & Arrival Records</h4>
      <div className="card border-0 shadow-sm mb-4 bg-white text-dark">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-3 align-items-end">
            <div className="col-md-3"><label htmlFor="searchQuery" className="form-label">Search</label><input type="text" className="form-control" id="searchQuery" placeholder="Boat name/RegNo, Fisherman name/NIC" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="col-md-2"><label htmlFor="searchType" className="form-label">Search By</label><select className="form-select" id="searchType" value={searchType} onChange={(e) => setSearchType(e.target.value)}><option value="boat">Boat</option><option value="fisherman">Fisherman</option></select></div>
            <div className="col-md-2"><label htmlFor="startDate" className="form-label">From Date</label><input type="date" className="form-control" id="startDate" name="startDate" value={dateRange.startDate} onChange={handleDateRangeChange} /></div>
            <div className="col-md-2"><label htmlFor="endDate" className="form-label">To Date</label><input type="date" className="form-control" id="endDate" name="endDate" value={dateRange.endDate} onChange={handleDateRangeChange} /></div>
            <div className="col-md-3 d-flex align-items-end"> {/* align-items-end for button alignment */}
              <button type="submit" className="btn btn-primary me-2"><FontAwesomeIcon icon={faSearch} className="me-1" />Search</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setSearchQuery(''); setSearchType('boat'); setDateRange({ startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') }); filterDeparturesInternal(); }}><FontAwesomeIcon icon={faSyncAlt} className="me-1" />Reset</button>
            </div>
          </form>
          <hr/>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-danger me-2" onClick={generatePdfReport} disabled={filteredDepartures.length === 0}><FontAwesomeIcon icon={faFilePdf} className="me-2" />Export PDF</button>
            <button className="btn btn-success" onClick={generateExcelReport} disabled={filteredDepartures.length === 0}><FontAwesomeIcon icon={faFileExcel} className="me-2" />Export Excel</button>
          </div>
        </div>
      </div>
      <div className="card border-0 shadow-sm bg-white text-dark">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped mb-0">
              <thead className="bg-light">
                <tr><th>Boat</th><th>Fishermen</th><th>Departure</th><th>Est. Return</th><th>Arrival</th><th>Status</th><th>Purpose</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredDepartures.length > 0 ? (
                  filteredDepartures.map(dep => {
                    const boatDetails = getBoatById(dep.boatId);
                    return (
                    <tr key={dep.id}>
                      <td><strong>{dep.boatName || 'N/A'}</strong><br /><small className="text-muted">{boatDetails?.boatRegNo || dep.boatId}</small></td>
                      <td>
                        {(dep.fishermenNames || [dep.fishermanName || 'N/A']).map((name, i) => (
                            <div key={i} title={dep.fishermenNICs ? dep.fishermenNICs[i] : dep.fishermanNIC}>
                                {name} <small className="text-muted d-block">({dep.fishermenNICs ? dep.fishermenNICs[i] : (dep.fishermanNIC || 'N/A')})</small>
                            </div>
                        ))}
                      </td>
                      <td>{formatTimestamp(dep.departureTimestamp)}<br/><small className="text-muted">Weather: {dep.weatherCondition || 'N/A'}</small></td>
                      <td>{formatTimestamp(dep.estimatedReturnTimestamp)}</td>
                      <td>{dep.arrivalTimestamp ? <>{formatTimestamp(dep.arrivalTimestamp)}<br/><small className="text-muted">Condition: {dep.boatCondition || 'N/A'}</small></> : <span className="text-muted">Not returned</span>}</td>
                      <td><StatusBadge status={dep.status} /></td>
                      <td>{dep.purpose || 'N/A'}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target={`#detailsModal-${dep.id}`}>View</button>
                        <div className="modal fade" id={`detailsModal-${dep.id}`} tabIndex="-1" aria-labelledby={`modalLabel-${dep.id}`} aria-hidden="true">
                          <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title" id={`modalLabel-${dep.id}`}>Departure Details: {dep.boatName || dep.boatId}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>
                              <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6><FontAwesomeIcon icon={faShip} className="me-2 text-primary"/>Boat Information</h6>
                                        <p><strong>Name:</strong> {dep.boatName || 'N/A'}<br/>
                                           <strong>Reg No:</strong> {boatDetails?.boatRegNo || 'N/A'}<br/>
                                           <strong>ID:</strong> {dep.boatId}</p>
                                        
                                        <h6><FontAwesomeIcon icon={faUserFriends} className="me-2 text-primary"/>Crew Information</h6>
                                        {(dep.fishermenNames || [dep.fishermanName || 'N/A']).map((name, i) => (
                                            <p key={i} className="mb-1">
                                                <strong>Name:</strong> {name} <br/>
                                                <strong>NIC:</strong> {dep.fishermenNICs ? dep.fishermenNICs[i] : (dep.fishermanNIC || 'N/A')}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="col-md-6">
                                        <h6><FontAwesomeIcon icon={faSignOutAlt} className="me-2 text-info"/>Departure Information</h6>
                                        <p><strong>Date & Time:</strong> {formatTimestamp(dep.departureTimestamp)}<br/>
                                           <strong>Est. Return:</strong> {formatTimestamp(dep.estimatedReturnTimestamp)}<br/>
                                           <strong>Weather:</strong> {dep.weatherCondition || 'N/A'}<br/>
                                           <strong>Destination:</strong> {dep.destination || 'N/A'}<br/>
                                           <strong>Purpose:</strong> {dep.purpose || 'N/A'}<br/>
                                           <strong>Notes:</strong> {dep.notes || 'N/A'}</p>
                                    </div>
                                </div>
                                {dep.status === 'returned' && (
                                  <>
                                    <hr/>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <h6><FontAwesomeIcon icon={faSignInAlt} className="me-2 text-success"/>Arrival Information</h6>
                                            <p><strong>Date & Time:</strong> {formatTimestamp(dep.arrivalTimestamp)}<br/>
                                            <strong>Boat Condition:</strong> {dep.boatCondition || 'N/A'}<br/>
                                            <strong>Catch Details:</strong> {dep.catchDetails || 'N/A'}<br/>
                                            <strong>Notes:</strong> {dep.arrivalNotes || 'N/A'}</p>
                                        </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )})) : (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No departure records match your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div style={{
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(10, 25, 41, 0.85), rgba(10, 25, 41, 0.95)), url('https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTZ8fGhhcmJvcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=1000&q=60')`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        color: '#e0e0e0' 
      }}>
      <div className="container-fluid d-flex flex-column p-0" style={{minHeight: '100vh'}}> {/* Ensure this container-fluid also takes minHeight */}
        <header className="py-3 bg-dark bg-opacity-50 shadow-sm">
          <div className="container-fluid"> {/* Changed to container-fluid */}
            <div className="row align-items-center">
              <div className="col-md-6">
                <h2 className="mb-0 d-flex align-items-center text-white">
                  <FontAwesomeIcon icon={faShip} className="me-3 text-primary-emphasis" style={{ filter: 'drop-shadow(0 0 5px #0dcaf0)'}}/>
                  Harbor Departure Management
                </h2>
              </div>
              <div className="col-md-6 text-md-end">
                <button type="button" className="btn btn-outline-info me-2" onClick={fetchData} disabled={isLoading && !isSubmitting}> {/* Allow refresh even if submitting form */}
                  {(isLoading && !isSubmitting) ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Refreshing...</> : <><FontAwesomeIcon icon={faSyncAlt} className="me-2" />Refresh Data</>}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow-1">
          <div className="container-fluid py-4"> {/* Changed to container-fluid */}
            <Alert />
            <ul className="nav nav-pills nav-fill mb-4">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: faChartLine },
                { key: 'departure', label: 'Register Departure', icon: faSignOutAlt },
                { key: 'arrival', label: 'Register Arrival', icon: faSignInAlt },
                { key: 'records', label: 'Records', icon: faHistory },
              ].map(tab => (
                <li className="nav-item mx-1" key={tab.key}>
                  <button
                    className={`nav-link ${activeTab === tab.key ? 'active bg-primary text-white shadow' : 'bg-light bg-opacity-10 text-white'}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="me-2" />{tab.label}
                  </button>
                </li>
              ))}
            </ul>
            
            {activeTab === 'dashboard' && (isLoading ? <LoadingSpinner message="Loading dashboard..."/> : <DashboardSection />)}
            {activeTab === 'departure' && <DepartureFormSection />}
            {activeTab === 'arrival' && <ArrivalFormSection />}
            {activeTab === 'records' && (isLoading ? <LoadingSpinner message="Loading records..."/> : <RecordsSection />)}
          </div>
        </main>

        <footer className="py-3 bg-dark bg-opacity-75 text-center mt-auto">
          <div className="container-fluid"> {/* Changed to container-fluid */}
            <p className="mb-0 text-white-50">Harbor Departure Management System © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
      <style jsx global>{`
        .bg-primary-soft { background-color: rgba(var(--bs-primary-rgb), 0.15) !important; }
        .bg-info-soft { background-color: rgba(var(--bs-info-rgb), 0.15) !important; }
        .bg-success-soft { background-color: rgba(var(--bs-success-rgb), 0.15) !important; }
        .bg-danger-soft { background-color: rgba(var(--bs-danger-rgb), 0.15) !important; }
        
        .react-select-container .react-select__control {
          background-color: var(--bs-body-bg); /* Bootstrap 5 form input background */
          border-color: var(--bs-border-color); /* Bootstrap 5 form input border */
          min-height: 38px; 
          color: var(--bs-body-color); /* Text color for input */
        }
        .react-select-container .react-select__control--is-focused {
          border-color: #86b7fe; 
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); 
        }
        .react-select-container .react-select__input-container { /* Ensure input text is visible */
            color: var(--bs-body-color);
        }
        .react-select-container .react-select__single-value { /* Ensure single selected value text is visible */
            color: var(--bs-body-color);
        }
        .react-select-container .react-select__multi-value {
          background-color: var(--bs-primary);
          color: white;
        }
        .react-select-container .react-select__multi-value__label {
          color: white;
        }
        .react-select-container .react-select__multi-value__remove {
          color: white;
        }
        .react-select-container .react-select__multi-value__remove:hover {
          background-color: #0b5ed7; /* Darker primary for hover, e.g., --bs-primary-darker */
          color: white;
        }
        .react-select-container .react-select__menu {
          background-color: var(--bs-body-bg);
          color: var(--bs-body-color); /* Text color for dropdown options */
          z-index: 1050; 
        }
        .react-select-container .react-select__option--is-focused {
          background-color: var(--bs-primary-bg-subtle); /* Bootstrap 5 subtle primary bg */
        }
        .react-select-container .react-select__option--is-selected {
          background-color: var(--bs-primary);
          color: white;
        }
        .react-select-container .react-select__placeholder {
            color: var(--bs-secondary-color); /* Lighter color for placeholder */
        }
        .table th, .table td {
          vertical-align: middle;
        }
        /* Ensure bootstrap modal content has dark text on light background */
        .modal-content {
            color: #212529; /* Default dark text color */
            background-color: #fff; /* Default light background */
        }
        .modal-header, .modal-body, .modal-footer {
            color: inherit; /* Inherit from modal-content */
        }
      `}</style>
    </div>
  );
};

export default DepartureDetails;