import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
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
  faDatabase
} from '@fortawesome/free-solid-svg-icons';
import { format, isValid, parseISO } from 'date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import _ from 'lodash';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
    fishermanNIC: '',
    weatherCondition: 'Fair',
    estimatedReturn: '',
    destination: '',
    purpose: 'Fishing',
    notes: ''
  });
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [selectedFisherman, setSelectedFisherman] = useState(null);
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
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  
  // Refs
  const alertTimeout = useRef();
  
  // Side effects
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (departures.length > 0) {
      calculateStats();
      generateChartData();
      filterDepartures();
      extractRecentActivities();
    }
  }, [departures, searchQuery, searchType, dateRange]);
  
  useEffect(() => {
    return () => {
      if (alertTimeout.current) {
        clearTimeout(alertTimeout.current);
      }
    };
  }, []);

  // Data fetching functions
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch boats
      const boatsSnapshot = await getDocs(collection(db, "boat"));
      const boatsData = boatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBoats(boatsData);
      
      // Fetch fishermen
      const fishermenSnapshot = await getDocs(collection(db, "fishermen"));
      const fishermenData = fishermenSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFishermen(fishermenData);
      
      // Fetch departures
      const departuresSnapshot = await getDocs(collection(db, "departures"));
      const departuresData = departuresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestampDate: doc.data().timestamp ? new Date(doc.data().timestamp.toDate()) : new Date()
      }));
      
      // Sort departures by timestamp (most recent first)
      departuresData.sort((a, b) => b.timestampDate - a.timestampDate);
      setDepartures(departuresData);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      showNotification("Failed to load data. Please try again.", "danger");
      setIsLoading(false);
    }
  };
  
  // Helper functions
  const calculateStats = () => {
    const now = new Date();
    
    const activeDepartures = departures.filter(
      dep => dep.status === 'departed' && !dep.arrivalTimestamp
    ).length;
    
    const returnedBoats = departures.filter(
      dep => dep.status === 'returned'
    ).length;
    
    const overdue = departures.filter(dep => {
      if (!dep.estimatedReturnTimestamp || dep.status === 'returned') return false;
      
      const estimatedReturn = new Date(dep.estimatedReturnTimestamp.toDate());
      return now > estimatedReturn && dep.status === 'departed';
    }).length;
    
    setDepartureStats({
      totalDepartures: departures.length,
      activeDepartures,
      returnedBoats,
      overdue
    });
  };
  
  const generateChartData = () => {
    // Group departures by date
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();
    
    const departuresByDate = _.groupBy(
      departures.filter(dep => dep.departureTimestamp), 
      item => format(new Date(item.departureTimestamp.toDate()), 'yyyy-MM-dd')
    );
    
    const arrivalsByDate = _.groupBy(
      departures.filter(dep => dep.arrivalTimestamp), 
      item => format(new Date(item.arrivalTimestamp.toDate()), 'yyyy-MM-dd')
    );
    
    const departureCounts = last7Days.map(date => 
      (departuresByDate[date] || []).length
    );
    
    const arrivalCounts = last7Days.map(date => 
      (arrivalsByDate[date] || []).length
    );
    
    setChartData({
      labels: last7Days.map(date => format(parseISO(date), 'MMM dd')),
      datasets: [
        {
          label: 'Departures',
          data: departureCounts,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Arrivals',
          data: arrivalCounts,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ],
    });
  };
  
  const filterDepartures = () => {
    let filtered = [...departures];
    
    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(dep => {
        const depDate = dep.departureTimestamp ? new Date(dep.departureTimestamp.toDate()) : null;
        return depDate && depDate >= startDate && depDate <= endDate;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      
      if (searchType === 'boat') {
        filtered = filtered.filter(dep => 
          dep.boatId?.toLowerCase().includes(query) || 
          dep.boatName?.toLowerCase().includes(query)
        );
      } else if (searchType === 'fisherman') {
        filtered = filtered.filter(dep => 
          dep.fishermanNIC?.toLowerCase().includes(query) || 
          dep.fishermanName?.toLowerCase().includes(query)
        );
      }
    }
    
    setFilteredDepartures(filtered);
  };
  
  const extractRecentActivities = () => {
    const recent = departures.slice(0, 5).map(dep => {
      let activity = '';
      let timestamp = dep.timestamp;
      
      if (dep.status === 'departed') {
        activity = `${dep.boatName || dep.boatId} departed with ${dep.fishermanName || dep.fishermanNIC}`;
        timestamp = dep.departureTimestamp;
      } else if (dep.status === 'returned') {
        activity = `${dep.boatName || dep.boatId} returned safely`;
        timestamp = dep.arrivalTimestamp;
      }
      
      return {
        id: dep.id,
        activity,
        timestamp: timestamp ? new Date(timestamp.toDate()) : new Date(),
        type: dep.status
      };
    });
    
    setRecentActivities(recent);
  };
  
  const showNotification = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    if (alertTimeout.current) {
      clearTimeout(alertTimeout.current);
    }
    
    alertTimeout.current = setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };
  
  const getBoatById = (id) => {
    return boats.find(boat => boat.id === id);
  };
  
  const getFishermanByNIC = (nic) => {
    return fishermen.find(fisherman => fisherman.fishermenNIC === nic);
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp.toDate());
      return isValid(date) ? format(date, 'MMM dd, yyyy HH:mm') : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'boatId') {
      const boat = getBoatById(value);
      setSelectedBoat(boat || null);
    }
    
    if (name === 'fishermanNIC') {
      const fisherman = getFishermanByNIC(value);
      setSelectedFisherman(fisherman || null);
    }
  };
  
  const handleArrivalInputChange = (e) => {
    const { name, value } = e.target;
    setArrivalFormData({ ...arrivalFormData, [name]: value });
  };
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };
  
  const handleRegisterDeparture = async (e) => {
    e.preventDefault();
    
    if (!formData.boatId || !formData.fishermanNIC) {
      showNotification("Please select both boat and fisherman", "danger");
      return;
    }
    
    if (!selectedBoat) {
      showNotification("Selected boat not found", "danger");
      return;
    }
    
    if (!selectedFisherman) {
      showNotification("Selected fisherman not found", "danger");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if boat is already out at sea
      const activeBoatDeparture = departures.find(
        dep => dep.boatId === formData.boatId && dep.status === 'departed'
      );
      
      if (activeBoatDeparture) {
        showNotification(`Boat ${selectedBoat.boatName || formData.boatId} is already out at sea`, "warning");
        setIsLoading(false);
        return;
      }
      
      // Create departure timestamp
      const departureDatetime = new Date(
        `${formData.departureDate}T${formData.departureTime}`
      );
      
      // Create estimated return timestamp if provided
      let estimatedReturnTimestamp = null;
      if (formData.estimatedReturn) {
        estimatedReturnTimestamp = Timestamp.fromDate(new Date(formData.estimatedReturn));
      }
      
      // Prepare departure document
      const departureData = {
        boatId: formData.boatId,
        boatName: selectedBoat.boatName || 'Unknown',
        fishermanNIC: formData.fishermanNIC,
        fishermanName: selectedFisherman.fishermenName || 'Unknown',
        departureTimestamp: Timestamp.fromDate(departureDatetime),
        estimatedReturnTimestamp,
        weatherCondition: formData.weatherCondition,
        destination: formData.destination,
        purpose: formData.purpose,
        notes: formData.notes,
        status: 'departed',
        timestamp: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, "departures"), departureData);
      
      // Reset form
      setFormData({
        departureDate: format(new Date(), 'yyyy-MM-dd'),
        departureTime: format(new Date(), 'HH:mm'),
        boatId: '',
        fishermanNIC: '',
        weatherCondition: 'Fair',
        estimatedReturn: '',
        destination: '',
        purpose: 'Fishing',
        notes: ''
      });
      
      setSelectedBoat(null);
      setSelectedFisherman(null);
      
      // Show success notification
      showNotification(`Successfully registered departure for ${selectedBoat.boatName || formData.boatId}`);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error registering departure: ", error);
      showNotification("Failed to register departure. Please try again.", "danger");
      setIsLoading(false);
    }
  };
  
  const handleRegisterArrival = async (e) => {
    e.preventDefault();
    
    if (!arrivalFormData.boatId) {
      showNotification("Please select a boat", "danger");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find active departure for this boat
      const activeDeparture = departures.find(
        dep => dep.boatId === arrivalFormData.boatId && dep.status === 'departed'
      );
      
      if (!activeDeparture) {
        showNotification(`No active departure found for this boat`, "warning");
        setIsLoading(false);
        return;
      }
      
      // Create arrival timestamp
      const arrivalDatetime = new Date(
        `${arrivalFormData.arrivalDate}T${arrivalFormData.arrivalTime}`
      );
      
      // Update the departure document
      const departureRef = doc(db, "departures", activeDeparture.id);
      await updateDoc(departureRef, {
        arrivalTimestamp: Timestamp.fromDate(arrivalDatetime),
        arrivalNotes: arrivalFormData.notes,
        catchDetails: arrivalFormData.catchDetails,
        boatCondition: arrivalFormData.condition,
        status: 'returned',
        lastUpdated: serverTimestamp()
      });
      
      // Reset form
      setArrivalFormData({
        boatId: '',
        arrivalDate: format(new Date(), 'yyyy-MM-dd'),
        arrivalTime: format(new Date(), 'HH:mm'),
        notes: '',
        catchDetails: '',
        condition: 'Good'
      });
      
      // Show success notification
      showNotification(`Successfully registered arrival for boat`);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error registering arrival: ", error);
      showNotification("Failed to register arrival. Please try again.", "danger");
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    filterDepartures();
  };
  
  // UI Components
  const Alert = () => {
    if (!showAlert) return null;
    
    return (
      <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
        {alertMessage}
        <button 
          type="button" 
          className="btn-close" 
          onClick={() => setShowAlert(false)}
          aria-label="Close">
        </button>
      </div>
    );
  };
  
  const LoadingSpinner = () => (
    <div className="text-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2 text-white">Loading data...</p>
    </div>
  );
  
  const StatusBadge = ({ status }) => {
    let badgeClass = 'badge ';
    let icon = null;
    
    switch(status) {
      case 'departed':
        badgeClass += 'bg-primary';
        icon = <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />;
        break;
      case 'returned':
        badgeClass += 'bg-success';
        icon = <FontAwesomeIcon icon={faCheckCircle} className="me-1" />;
        break;
      case 'overdue':
        badgeClass += 'bg-danger';
        icon = <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />;
        break;
      default:
        badgeClass += 'bg-secondary';
    }
    
    return (
      <span className={badgeClass}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const DashboardCard = ({ title, value, icon, color }) => (
    <div className="col-md-3 mb-4">
      <div className="card border-0 shadow h-100">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-3">
              <div className={`rounded-circle bg-${color} bg-opacity-25 p-3 text-${color}`}>
                <FontAwesomeIcon icon={icon} size="2x" />
              </div>
            </div>
            <div className="col-9">
              <h6 className="text-muted text-uppercase">{title}</h6>
              <h2 className="mb-0 fw-bold">{value}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Main component sections
  const DashboardSection = () => (
    <div className="dashboard-section">
      <h4 className="mb-4 text-white">
        <FontAwesomeIcon icon={faChartLine} className="me-2" />
        Dashboard Overview
      </h4>
      
      <div className="row">
        <DashboardCard 
          title="Total Departures" 
          value={departureStats.totalDepartures}
          icon={faShip}
          color="primary"
        />
        
        <DashboardCard 
          title="Active Departures" 
          value={departureStats.activeDepartures}
          icon={faSignOutAlt}
          color="info"
        />
        
        <DashboardCard 
          title="Returned Boats" 
          value={departureStats.returnedBoats}
          icon={faAnchor}
          color="success"
        />
        
        <DashboardCard 
          title="Overdue" 
          value={departureStats.overdue}
          icon={faExclamationTriangle}
          color="danger"
        />
      </div>
      
      <div className="row mt-4">
        <div className="col-md-8 mb-4">
          <div className="card border-0 shadow h-100">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Departure & Arrival Statistics (Last 7 Days)</h5>
            </div>
            <div className="card-body">
              <Bar 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    },
                  },
                }}
                height={300}
              />
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow h-100">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Recent Activities</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <p className="mb-1">{activity.activity}</p>
                        <small className={`text-${activity.type === 'departed' ? 'primary' : 'success'}`}>
                          {format(activity.timestamp, 'MMM dd, HH:mm')}
                        </small>
                      </div>
                      <small className="text-muted">
                        <FontAwesomeIcon 
                          icon={activity.type === 'departed' ? faSignOutAlt : faSignInAlt} 
                          className="me-1" 
                        />
                        {activity.type === 'departed' ? 'Departure' : 'Arrival'}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item">
                    <p className="mb-0 text-center text-muted">No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const DepartureFormSection = () => (
    <div className="departure-form-section">
      <h4 className="mb-4 text-white">
        <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
        Register New Departure
      </h4>
      
      <div className="card border-0 shadow">
        <div className="card-body">
          <form onSubmit={handleRegisterDeparture}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="boatId" className="form-label">Boat</label>
                  <select 
                    className="form-select" 
                    id="boatId" 
                    name="boatId"
                    value={formData.boatId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a boat</option>
                    {boats.map(boat => (
                      <option key={boat.id} value={boat.id}>
                        {boat.boatName || 'Unknown'} ({boat.id})
                      </option>
                    ))}
                  </select>
                  
                  {selectedBoat && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small>
                        <strong>Boat Details:</strong> Length: {selectedBoat.boatLength}, 
                        Capacity: {selectedBoat.capacity}, 
                        Contact: {selectedBoat.contact}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="fishermanNIC" className="form-label">Fisherman NIC</label>
                  <select 
                    className="form-select" 
                    id="fishermanNIC" 
                    name="fishermanNIC"
                    value={formData.fishermanNIC}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a fisherman</option>
                    {fishermen.map(fisherman => (
                      <option key={fisherman.id} value={fisherman.fishermenNIC}>
                        {fisherman.fishermenName} ({fisherman.fishermenNIC})
                      </option>
                    ))}
                  </select>
                  
                  {selectedFisherman && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small>
                        <strong>Fisherman Details:</strong> Experience: {selectedFisherman.experience} years, 
                        Contact: {selectedFisherman.contact}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="departureDate" className="form-label">Departure Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="departureDate" 
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="departureTime" className="form-label">Departure Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        id="departureTime" 
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="weatherCondition" className="form-label">Weather Condition</label>
                  <select 
                    className="form-select" 
                    id="weatherCondition" 
                    name="weatherCondition"
                    value={formData.weatherCondition}
                    onChange={handleInputChange}
                  >
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Rough">Rough</option>
                    <option value="Stormy">Stormy</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="destination" className="form-label">Destination</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="destination" 
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="purpose" className="form-label">Purpose</label>
                  <select 
                    className="form-select" 
                    id="purpose" 
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                  >
                    <option value="Fishing">Fishing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Transport">Transport</option>
                    <option value="Tourism">Tourism</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="estimatedReturn" className="form-label">Estimated Return</label>
                  <input 
                    type="datetime-local" 
                    className="form-control" 
                    id="estimatedReturn" 
                    name="estimatedReturn"
                    value={formData.estimatedReturn}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea 
                    className="form-control" 
                    id="notes" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Any additional information"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </span>
                ) : (
                  <span>
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                    Register Departure
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  const ArrivalFormSection = () => (
    <div className="arrival-form-section">
      <h4 className="mb-4 text-white">
        <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
        Register Boat Arrival
      </h4>
      
      <div className="card border-0 shadow">
        <div className="card-body">
          <form onSubmit={handleRegisterArrival}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="arrivalBoatId" className="form-label">Boat</label>
                  <select 
                    className="form-select" 
                    id="arrivalBoatId" 
                    name="boatId"
                    value={arrivalFormData.boatId}
                    onChange={handleArrivalInputChange}
                    required
                  >
                    <option value="">Select a boat</option>
                    {departures
                      .filter(dep => dep.status === 'departed')
                      .map(dep => (
                        <option key={dep.id} value={dep.boatId}>
                          {dep.boatName || 'Unknown'} ({dep.boatId}) - {dep.fishermanName || 'Unknown fisherman'}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="arrivalDate" className="form-label">Arrival Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="arrivalDate" 
                        name="arrivalDate"
                        value={arrivalFormData.arrivalDate}
                        onChange={handleArrivalInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="arrivalTime" className="form-label">Arrival Time</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        id="arrivalTime" 
                        name="arrivalTime"
                        value={arrivalFormData.arrivalTime}
                        onChange={handleArrivalInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="condition" className="form-label">Boat Condition</label>
                  <select 
                    className="form-select" 
                    id="condition" 
                    name="condition"
                    value={arrivalFormData.condition}
                    onChange={handleArrivalInputChange}
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="catchDetails" className="form-label">Catch Details</label>
                  <textarea 
                    className="form-control" 
                    id="catchDetails" 
                    name="catchDetails"
                    value={arrivalFormData.catchDetails}
                    onChange={handleArrivalInputChange}
                    rows="2"
                    placeholder="Type of fish, quantity, etc."
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="arrivalNotes" className="form-label">Notes</label>
                  <textarea 
                    className="form-control" 
                    id="notes" 
                    name="notes"
                    value={arrivalFormData.notes}
                    onChange={handleArrivalInputChange}
                    rows="3"
                    placeholder="Any additional information about the arrival"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </span>
                ) : (
                  <span>
                    <FontAwesomeIcon icon={faAnchor} className="me-2" />
                    Register Arrival
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
  const RecordsSection = () => (
    <div className="records-section">
      <h4 className="mb-4 text-white">
        <FontAwesomeIcon icon={faHistory} className="me-2" />
        Departure & Arrival Records
      </h4>
      
      <div className="card border-0 shadow mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-3">
            <div className="col-md-3">
              <label htmlFor="searchQuery" className="form-label">Search</label>
              <input 
                type="text" 
                className="form-control" 
                id="searchQuery" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="col-md-2">
              <label htmlFor="searchType" className="form-label">Search By</label>
              <select 
                className="form-select" 
                id="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="boat">Boat</option>
                <option value="fisherman">Fisherman</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <label htmlFor="startDate" className="form-label">From Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="startDate" 
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
              />
            </div>
            
            <div className="col-md-2">
              <label htmlFor="endDate" className="form-label">To Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="endDate" 
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
            </div>
            
            <div className="col-md-3 d-flex align-items-end">
              <button type="submit" className="btn btn-primary me-2">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Search
              </button>
              
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSearchType('boat');
                  setDateRange({
                    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
                    endDate: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
              >
                <FontAwesomeIcon icon={faSyncAlt} className="me-2" />
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="card border-0 shadow">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Boat</th>
                  <th>Fisherman</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Status</th>
                  <th>Purpose</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartures.length > 0 ? (
                  filteredDepartures.map(departure => (
                    <tr key={departure.id}>
                      <td>
                        <strong>{departure.boatName || 'Unknown'}</strong>
                        <br />
                        <small className="text-muted">{departure.boatId}</small>
                      </td>
                      <td>
                        <strong>{departure.fishermanName || 'Unknown'}</strong>
                        <br />
                        <small className="text-muted">{departure.fishermanNIC}</small>
                      </td>
                      <td>
                        {formatTimestamp(departure.departureTimestamp)}
                        {departure.weatherCondition && (
                          <div><small className="text-muted">Weather: {departure.weatherCondition}</small></div>
                        )}
                      </td>
                      <td>
                        {departure.arrivalTimestamp ? (
                          <div>
                            {formatTimestamp(departure.arrivalTimestamp)}
                            {departure.boatCondition && (
                              <div><small className="text-muted">Condition: {departure.boatCondition}</small></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Not returned</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={departure.status} />
                      </td>
                      <td>{departure.purpose || 'N/A'}</td>
                      <td>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-primary"
                          data-bs-toggle="modal" 
                          data-bs-target={`#detailsModal-${departure.id}`}
                        >
                          View
                        </button>
                        
                        {/* Modal for departure details */}
                        <div className="modal fade" id={`detailsModal-${departure.id}`} tabIndex="-1" aria-hidden="true">
                          <div className="modal-dialog">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title">Departure Details</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>
                              <div className="modal-body">
                                <div className="mb-3">
                                  <h6>Boat Information</h6>
                                  <p className="mb-1">Name: {departure.boatName || 'Unknown'}</p>
                                  <p className="mb-1">ID: {departure.boatId}</p>
                                </div>
                                
                                <div className="mb-3">
                                  <h6>Fisherman Information</h6>
                                  <p className="mb-1">Name: {departure.fishermanName || 'Unknown'}</p>
                                  <p className="mb-1">NIC: {departure.fishermanNIC}</p>
                                </div>
                                
                                <div className="mb-3">
                                  <h6>Departure Information</h6>
                                  <p className="mb-1">Date & Time: {formatTimestamp(departure.departureTimestamp)}</p>
                                  <p className="mb-1">Weather: {departure.weatherCondition || 'N/A'}</p>
                                  <p className="mb-1">Destination: {departure.destination || 'N/A'}</p>
                                  <p className="mb-1">Purpose: {departure.purpose || 'N/A'}</p>
                                  <p className="mb-1">Notes: {departure.notes || 'N/A'}</p>
                                </div>
                                
                                {departure.status === 'returned' && (
                                  <div className="mb-3">
                                    <h6>Arrival Information</h6>
                                    <p className="mb-1">Date & Time: {formatTimestamp(departure.arrivalTimestamp)}</p>
                                    <p className="mb-1">Boat Condition: {departure.boatCondition || 'N/A'}</p>
                                    <p className="mb-1">Catch Details: {departure.catchDetails || 'N/A'}</p>
                                    <p className="mb-1">Notes: {departure.arrivalNotes || 'N/A'}</p>
                                  </div>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <p className="mb-0 text-muted">No departure records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Main render
  return (
    <div>
      {/* Background container */}
      <div className="container-fluid d-flex flex-column p-0" style={{ 
        minHeight: '100vh', 
        width: '100vw', 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff'
      }}>
        {/* Header */}
        <header className="py-3 bg-dark bg-opacity-75">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h2 className="mb-0 d-flex align-items-center">
                  <FontAwesomeIcon icon={faShip} className="me-3 text-primary" />
                  Harbor Departure Management
                </h2>
              </div>
              <div className="col-md-6 text-md-end">
                <div className="d-flex justify-content-md-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-light me-2"
                    onClick={fetchData}
                  >
                    <FontAwesomeIcon icon={faSyncAlt} className="me-2" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow-1">
          <div className="container py-4">
            {/* Alert notifications */}
            <Alert />
            
            {/* Navigation tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'dashboard' ? 'active bg-primary text-white' : 'text-white'}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'departure' ? 'active bg-primary text-white' : 'text-white'}`}
                  onClick={() => setActiveTab('departure')}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Register Departure
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'arrival' ? 'active bg-primary text-white' : 'text-white'}`}
                  onClick={() => setActiveTab('arrival')}
                >
                  <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                  Register Arrival
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'records' ? 'active bg-primary text-white' : 'text-white'}`}
                  onClick={() => setActiveTab('records')}
                >
                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                  Records
                </button>
              </li>
            </ul>
            
            {/* Loading spinner */}
            {isLoading && <LoadingSpinner />}
            
            {/* Active tab content */}
            {!isLoading && (
              <>
                {activeTab === 'dashboard' && <DashboardSection />}
                {activeTab === 'departure' && <DepartureFormSection />}
                {activeTab === 'arrival' && <ArrivalFormSection />}
                {activeTab === 'records' && <RecordsSection />}
              </>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-3 bg-dark bg-opacity-75 text-center">
          <div className="container">
            <p className="mb-0 text-white-50">Harbor Departure Management System © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DepartureDetails;