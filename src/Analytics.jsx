import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import backgroundImage from './background.jpeg'; // Make sure this path is correct
import logoImage from './logo.png'; // Make sure this path is correct
import profileIcon from './profile.png'; // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faShip, faUser, faChartLine,
  faBell, faCalendarAlt, faMapMarkerAlt,
  faFish, faAnchor, faExclamationTriangle,
  faCog, faDownload, faChartBar, faChartPie,
  faChartArea, faFilter, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

// Import Recharts components
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area
} from 'recharts';
import { saveAs } from 'file-saver'; // For CSV export
import { saveSvgAsPng } from 'save-svg-as-png'; // For chart PNG export

// Firebase configuration (ensure this is secure in a real app, e.g., via environment variables)
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

const Analytics = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalOwners: 0,
    totalBoats: 0,
    approvedBoats: 0,
    pendingBoats: 0,
    rejectedBoats: 0,
    monthlyRegistrations: Array(12).fill(0).map((_, index) => ({
      month: new Date(2023, index, 1).toLocaleString('default', { month: 'short' }),
      count: 0
    })),
    boatsByPowerCategory: { small: 0, medium: 0, large: 0 },
    ownersByBoatCount: { single: 0, multiple: 0 },
    registrationStatusDistribution: { approved: 0, pending: 0, rejected: 0 },
    boatAgeDistribution: { new: 0, medium: 0, old: 0, vintage: 0 },
    detailedMonthlyTrends: Array(12).fill(0).map((_, index) => ({
      month: new Date(2023, index, 1).toLocaleString('default', { month: 'short' }),
      approved: 0,
      pending: 0,
      rejected: 0,
    })),
  });
  const [timeFilter, setTimeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Refs for chart export
  const monthlyRegChartRef = useRef(null);
  const statusPieChartRef = useRef(null);
  const trendsChartRef = useRef(null);
  const forecastChartRef = useRef(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const querySnapshot = await getDocs(collection(db, "boat"));

        if (querySnapshot.empty) {
          console.warn("No boat data found in Firestore.");
          const currentYear = new Date().getFullYear();
          const defaultMonthly = Array(12).fill(0).map((_, index) => ({
            month: new Date(currentYear, index, 1).toLocaleString('default', { month: 'short' }),
            count: 0
          }));
          const defaultDetailedMonthly = Array(12).fill(0).map((_, index) => ({
            month: new Date(currentYear, index, 1).toLocaleString('default', { month: 'short' }),
            approved: 0, pending: 0, rejected: 0
          }));
          setAnalyticsData(prev => ({
            ...prev, 
            totalOwners: 0, totalBoats: 0, approvedBoats: 0, pendingBoats: 0, rejectedBoats: 0,
            monthlyRegistrations: defaultMonthly,
            boatsByPowerCategory: { small: 0, medium: 0, large: 0 },
            ownersByBoatCount: { single: 0, multiple: 0 },
            registrationStatusDistribution: { approved: 0, pending: 0, rejected: 0 },
            boatAgeDistribution: { new: 0, medium: 0, old: 0, vintage: 0 },
            detailedMonthlyTrends: defaultDetailedMonthly,
          }));
          setIsLoading(false);
          return;
        }

        const boatsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const emailMap = {};
        let approvedCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        const powerCategories = { small: 0, medium: 0, large: 0 };
        const boatAges = { new: 0, medium: 0, old: 0, vintage: 0 };
        
        const currentYear = new Date().getFullYear();
        const monthlyDataCounts = Array(12).fill(0);
        const detailedMonthlyData = Array(12).fill(null).map(() => ({ approved: 0, pending: 0, rejected: 0 }));


        boatsData.forEach(boat => {
          const registrationTimestamp = boat.registrationDate?.toDate ? boat.registrationDate.toDate() : new Date(); 
          const registrationMonth = registrationTimestamp.getMonth(); 
          const registrationYear = registrationTimestamp.getFullYear();

          if (registrationYear === currentYear) { 
            monthlyDataCounts[registrationMonth]++;
            if (boat.status === 'Approved') detailedMonthlyData[registrationMonth].approved++;
            else if (boat.status === 'Pending') detailedMonthlyData[registrationMonth].pending++;
            else if (boat.status === 'Rejected') detailedMonthlyData[registrationMonth].rejected++;
          }

          if (boat.status === 'Approved') approvedCount++;
          else if (boat.status === 'Pending') pendingCount++;
          else if (boat.status === 'Rejected') rejectedCount++;

          const email = boat.email || `owner-${boat.id.substring(0, 5)}`;
          if (!emailMap[email]) {
            emailMap[email] = [];
          }
          emailMap[email].push(boat);

          const power = parseInt(boat.power, 10) || 0;
          if (power < 50) powerCategories.small++;
          else if (power < 150) powerCategories.medium++;
          else powerCategories.large++;

          const year = parseInt(boat.year, 10) || currentYear;
          const age = currentYear - year;
          if (age <= 2) boatAges.new++;
          else if (age <= 10) boatAges.medium++;
          else if (age <= 20) boatAges.old++;
          else boatAges.vintage++;
        });

        let singleBoatOwners = 0;
        let multipleBoatOwners = 0;

        Object.values(emailMap).forEach(boats => {
          if (boats.length === 1) singleBoatOwners++;
          else multipleBoatOwners++;
        });
        
        const formattedMonthlyRegistrations = monthlyDataCounts.map((count, index) => ({
          month: new Date(currentYear, index, 1).toLocaleString('default', { month: 'short' }),
          count
        }));

        const formattedDetailedMonthlyTrends = detailedMonthlyData.map((data, index) => ({
            month: new Date(currentYear, index, 1).toLocaleString('default', { month: 'short' }),
            ...data
        }));

        setAnalyticsData({
          totalOwners: Object.keys(emailMap).length,
          totalBoats: boatsData.length,
          approvedBoats: approvedCount,
          pendingBoats: pendingCount,
          rejectedBoats: rejectedCount,
          monthlyRegistrations: formattedMonthlyRegistrations,
          boatsByPowerCategory: powerCategories,
          ownersByBoatCount: { single: singleBoatOwners, multiple: multipleBoatOwners },
          registrationStatusDistribution: {
            approved: approvedCount,
            pending: pendingCount,
            rejected: rejectedCount
          },
          boatAgeDistribution: boatAges,
          detailedMonthlyTrends: formattedDetailedMonthlyTrends
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching analytics data: ", err);
        setError("Failed to load analytics data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeFilter]);

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const handleExportChartPNG = (chartRef, filename) => {
    if (chartRef.current) {
      const svgElement = chartRef.current.querySelector('svg');
      if (svgElement) {
        saveSvgAsPng(svgElement, `${filename}.png`, {
          backgroundColor: '#1a1a2e', 
          scale: 1.5, 
        }).catch(e => console.error("Error exporting chart as PNG:", e));
      } else {
        console.error("SVG element not found for chart export.");
      }
    }
  };
  
  const handleExportDataCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\r\n";
    csvContent += `Total Owners,${analyticsData.totalOwners}\r\n`;
    csvContent += `Total Boats,${analyticsData.totalBoats}\r\n`;
    csvContent += `Approved Boats,${analyticsData.approvedBoats}\r\n`;
    csvContent += `Pending Boats,${analyticsData.pendingBoats}\r\n`;
    csvContent += `Rejected Boats,${analyticsData.rejectedBoats}\r\n`;
    csvContent += "\r\nMonthly Registrations\r\nMonth,Count\r\n";
    analyticsData.monthlyRegistrations.forEach(item => {
      csvContent += `${item.month},${item.count}\r\n`;
    });
    // Add more data as needed

    const encodedUri = encodeURI(csvContent);
    saveAs(encodedUri, "boat_analytics_summary.csv");
  };


  const RECHART_PIE_COLORS = ['#28a745', '#ffc107', '#dc3545']; // Green, Yellow, Red

  const renderOverviewTab = () => (
    <>
      {/* Overview Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5 className="card-title text-primary">Total Owners</h5>
                <FontAwesomeIcon icon={faUser} className="text-primary" size="lg" />
              </div>
              <h2 className="card-text mt-2">{analyticsData.totalOwners}</h2>
              <div className="progress mt-2" style={{ height: "6px", backgroundColor: 'rgba(var(--bs-primary-rgb), 0.3)' }}>
                <div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>
        </div>
         <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', border: '1px solid rgba(40, 167, 69, 0.25)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5 className="card-title text-success">Total Boats</h5>
                <FontAwesomeIcon icon={faShip} className="text-success" size="lg" />
              </div>
              <h2 className="card-text mt-2">{analyticsData.totalBoats}</h2>
              <div className="progress mt-2" style={{ height: "6px", backgroundColor: 'rgba(var(--bs-success-rgb), 0.3)' }}>
                <div className="progress-bar bg-success" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.25)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5 className="card-title text-warning">Pending</h5>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" size="lg" />
              </div>
              <h2 className="card-text mt-2">{analyticsData.pendingBoats}</h2>
              <div className="progress mt-2" style={{ height: "6px", backgroundColor: 'rgba(var(--bs-warning-rgb), 0.3)' }}>
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${calculatePercentage(analyticsData.pendingBoats, analyticsData.totalBoats)}%` }}
                ></div>
              </div>
              <p className="small text-light opacity-75 mt-2">
                {calculatePercentage(analyticsData.pendingBoats, analyticsData.totalBoats)}% of total boats
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100" style={{ backgroundColor: 'rgba(13, 202, 240, 0.1)', border: '1px solid rgba(13, 202, 240, 0.25)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <h5 className="card-title text-info">Avg. Boats/Owner</h5>
                <FontAwesomeIcon icon={faAnchor} className="text-info" size="lg" />
              </div>
              <h2 className="card-text mt-2">
                {analyticsData.totalOwners ? (analyticsData.totalBoats / analyticsData.totalOwners).toFixed(1) : 0}
              </h2>
              <div className="progress mt-2" style={{ height: "6px", backgroundColor: 'rgba(var(--bs-info-rgb), 0.3)' }}>
                <div
                  className="progress-bar bg-info"
                  style={{ width: `${analyticsData.totalOwners > 0 ? Math.min(100, (analyticsData.totalBoats / analyticsData.totalOwners) * 20) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Charts with Recharts */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartArea} className="me-2 text-primary" />
                Monthly Boat Registrations
              </h5>
              <button className="btn btn-sm btn-outline-light" onClick={() => handleExportChartPNG(monthlyRegChartRef, 'monthly_registrations_chart')}>
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  Export Chart
              </button>
            </div>
            <div className="card-body" ref={monthlyRegChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.monthlyRegistrations} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4e9af1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4e9af1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(30,30,50,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.25rem' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#4e9af1' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }} />
                  <Area type="monotone" dataKey="count" stroke="#4e9af1" fillOpacity={1} fill="url(#colorCount)" name="Registrations" />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4, fill: '#82ca9d', strokeWidth:1, stroke: 'rgba(0,0,0,0.3)' }} activeDot={{ r: 6 }}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartPie} className="me-2 text-info" />
                Registration Status
              </h5>
               <button className="btn btn-sm btn-outline-light" onClick={() => handleExportChartPNG(statusPieChartRef, 'registration_status_chart')}>
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  Export
              </button>
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-center" ref={statusPieChartRef}>
                {analyticsData.totalBoats > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                    <Pie
                        data={[
                        { name: 'Approved', value: analyticsData.registrationStatusDistribution.approved },
                        { name: 'Pending', value: analyticsData.registrationStatusDistribution.pending },
                        { name: 'Rejected', value: analyticsData.registrationStatusDistribution.rejected },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={50} // Donut chart
                        fill="#8884d8"
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + (outerRadius + 15) * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + (outerRadius + 15) * Math.sin(-midAngle * (Math.PI / 180));
                            return (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                                {`${name} (${(percent * 100).toFixed(0)}%)`}
                                </text>
                            );
                        }}
                    >
                        {
                        [
                            { name: 'Approved', value: analyticsData.registrationStatusDistribution.approved },
                            { name: 'Pending', value: analyticsData.registrationStatusDistribution.pending },
                            { name: 'Rejected', value: analyticsData.registrationStatusDistribution.rejected },
                        ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={RECHART_PIE_COLORS[index % RECHART_PIE_COLORS.length]} />
                        ))
                        }
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30,30,50,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.25rem' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value, name) => [`${value} (${calculatePercentage(value, analyticsData.totalBoats)}%)`, name]}
                    />
                     <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)', paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
                 ) : <p className="text-muted">No data for chart</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Cards */}
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-warning" />
                Boat Power Categories
              </h5>
            </div>
            <div className="card-body">
              {['small', 'medium', 'large'].map((category, index) => {
                const categoryMap = { small: 'Small (<50 HP)', medium: 'Medium (50-150 HP)', large: 'Large (>150 HP)'};
                const value = analyticsData.boatsByPowerCategory[category];
                return (
                  <div key={category} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-light opacity-75">{categoryMap[category]}</span>
                      <span className={`badge bg-${['primary', 'success', 'warning'][index]} rounded-pill`}>{value}</span>
                    </div>
                    <div className="progress" style={{ height: "10px", backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className={`progress-bar bg-${['primary', 'success', 'warning'][index]}`}
                        style={{ width: `${calculatePercentage(value, analyticsData.totalBoats)}%` }}
                        aria-valuenow={calculatePercentage(value, analyticsData.totalBoats)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faUser} className="me-2 text-success" />
                Owner Statistics
              </h5>
            </div>
            <div className="card-body">
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart 
                        layout="vertical" 
                        data={[
                            { name: 'Single Boat', count: analyticsData.ownersByBoatCount.single, fill: '#4e9af1' },
                            { name: 'Multiple Boats', count: analyticsData.ownersByBoatCount.multiple, fill: '#28a745' }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(30,30,50,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.25rem' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" barSize={25}>
                            {
                                [
                                    { name: 'Single Boat', count: analyticsData.ownersByBoatCount.single, fill: '#4e9af1' },
                                    { name: 'Multiple Boats', count: analyticsData.ownersByBoatCount.multiple, fill: '#28a745' }
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-danger" />
                Boat Age Distribution
              </h5>
            </div>
            <div className="card-body">
              {Object.entries(analyticsData.boatAgeDistribution).map(([ageCategory, count], index) => {
                const ageLabels = { new: 'New (0-2 yrs)', medium: 'Medium (3-10 yrs)', old: 'Old (11-20 yrs)', vintage: 'Vintage (20+ yrs)'};
                return (
                  <div key={ageCategory} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-light opacity-75">{ageLabels[ageCategory]}</span>
                      <span className={`badge bg-${['success', 'primary', 'warning', 'danger'][index]} rounded-pill`}>{count}</span>
                    </div>
                    <div className="progress" style={{ height: "10px", backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className={`progress-bar bg-${['success', 'primary', 'warning', 'danger'][index]}`}
                        style={{ width: `${calculatePercentage(count, analyticsData.totalBoats)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderDetailedTab = () => (
    <>
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartLine} className="me-2 text-primary" />
                Registration Trends (Current Year by Status)
              </h5>
              <div className="btn-group">
                {['all', 'year', 'month'].map(filter => (
                    <button 
                        key={filter}
                        className={`btn btn-sm ${timeFilter === filter ? 'btn-primary' : 'btn-outline-light'}`}
                        onClick={() => setTimeFilter(filter)}
                        style={{textTransform: 'capitalize'}}
                    >
                    {filter === 'all' ? 'All Time' : `This ${filter}`}
                    </button>
                ))}
                <button className="btn btn-sm btn-outline-light ms-2" onClick={() => handleExportChartPNG(trendsChartRef, 'registration_trends_chart')}>
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  Export Chart
                </button>
              </div>
            </div>
            <div className="card-body" ref={trendsChartRef}>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.detailedMonthlyTrends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(30,30,50,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.25rem' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }} />
                  <Area type="monotone" dataKey="approved" stackId="1" stroke="#28a745" fill="#28a745" fillOpacity={0.5} name="Approved"/>
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#ffc107" fill="#ffc107" fillOpacity={0.5} name="Pending"/>
                  <Area type="monotone" dataKey="rejected" stackId="1" stroke="#dc3545" fill="#dc3545" fillOpacity={0.5} name="Rejected"/>
                   <Line type="monotone" dataKey="approved" stroke="#28a745" strokeWidth={2} dot={false} />
                   <Line type="monotone" dataKey="pending" stroke="#ffc107" strokeWidth={2} dot={false} />
                   <Line type="monotone" dataKey="rejected" stroke="#dc3545" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-info" />
                Regional Distribution (Mock)
              </h5>
            </div>
            <div className="card-body" style={{ minHeight: '320px' }}>
              <p className="text-center text-light opacity-50 mt-5"> (Mock data visualization for regional distribution) </p>
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faFish} className="me-2 text-success" />
                Boat Types Distribution (Mock)
              </h5>
            </div>
            <div className="card-body" style={{ minHeight: '320px' }}>
              <p className="text-center text-light opacity-50 mt-5"> (Mock data visualization for boat types) </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderPredictionsTab = () => {
    const forecastData = [ 
        { month: "Jun", forecast: 18, lower: 15, upper: 21 }, { month: "Jul", forecast: 22, lower: 18, upper: 26 },
        { month: "Aug", forecast: 25, lower: 20, upper: 30 }, { month: "Sep", forecast: 20, lower: 16, upper: 24 },
        { month: "Oct", forecast: 16, lower: 13, upper: 19 }, { month: "Nov", forecast: 14, lower: 11, upper: 17 }
      ];

    return (
    <>
      <div className="alert alert-info" role="alert" style={{backgroundColor: 'rgba(13,202,240,0.15)', borderColor: 'rgba(13,202,240,0.4)', color: '#6edff6', backdropFilter: 'blur(5px)'}}>
        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
        Predictive analytics are based on historical data patterns and should be used for planning purposes only.
      </div>

      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartLine} className="me-2" style={{color: '#8e44ad'}}/>
                Registration Forecast (Next 6 Months - Mock)
              </h5>
              <button className="btn btn-sm btn-outline-light" onClick={() => handleExportChartPNG(forecastChartRef, 'registration_forecast_chart')}>
                  <FontAwesomeIcon icon={faDownload} className="me-1" /> Export
              </button>
            </div>
            <div className="card-body" ref={forecastChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={forecastData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.7)' }}/>
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} domain={['dataMin - 5', 'dataMax + 5']}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30,30,50,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.25rem' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }} />
                    <Area type="monotone" dataKey="upper" stroke="transparent" fill="#8e44ad" fillOpacity={0.2} name="Upper Bound" stackId="confidence" />
                    <Area type="monotone" dataKey="lower" stroke="transparent" fill="#8e44ad" fillOpacity={0.2} name="Lower Bound" stackId="confidence" 
                        baseValue={dataMin => (dataMin || 0) - 1000 } 
                    />
                    <Line type="monotone" dataKey="forecast" stroke="#8e44ad" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Forecast"/>
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-light opacity-75 small mt-3 text-center">
                The shaded area represents the mock 80% confidence interval for the forecast.
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-5 mb-4">
           <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <h5 className="mb-0 text-light">
                <FontAwesomeIcon icon={faChartPie} className="me-2 text-success"/>
                Expected Category Growth (Mock)
              </h5>
            </div>
            <div className="card-body">
                {[
                    { name: 'Fishing Boats', growth: '+8%', width: '80%', color: 'success'},
                    { name: 'Cruisers', growth: '+12%', width: '70%', color: 'primary'},
                    { name: 'Pontoons', growth: '+5%', width: '60%', color: 'warning'},
                    { name: 'Sailboats', growth: '+2%', width: '50%', color: 'info'},
                    { name: 'Speedboats', growth: '-3%', width: '40%', color: 'danger'},
                    { name: 'Jet Skis', growth: '+1%', width: '30%', color: 'secondary'},
                ].map(item => (
                    <div className="mb-3" key={item.name}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-light opacity-75">{item.name}</span>
                        <span className={`badge bg-${item.color} bg-opacity-75 rounded-pill`}>{item.growth}</span>
                        </div>
                        <div className="progress" style={{ height: "10px", backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div
                            className={`progress-bar bg-${item.color}`}
                            style={{ width: item.width }}
                        ></div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
    )
  };


  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ 
          backgroundImage: `url(${backgroundImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed',
          width: '100vw', // ADDED
          height: '100vh', // CHANGED
          overflow: 'hidden', // ADDED
          color: "white",
          backdropFilter: 'blur(3px)' 
        }}>
        <div className="spinner-border text-primary" role="status" style={{width: '3.5rem', height: '3.5rem'}}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-3 fs-4">Loading Advanced Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
          width: '100vw', // CHANGED
          height: '100vh', // CHANGED
          overflow: 'hidden', // ADDED
          boxSizing: 'border-box', 
          backgroundImage: `url(${backgroundImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
        <div className="alert alert-danger m-4" role="alert" style={{backgroundColor: 'rgba(220, 53, 69, 0.15)', borderColor: 'rgba(220, 53, 69, 0.4)', color: '#f8d7da', maxWidth: '600px', backdropFilter: 'blur(5px)'}}>
          <h4 className="alert-heading">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Error Loading Data
          </h4>
          <p>{error}</p>
          <hr style={{borderColor: 'rgba(248,215,218,0.3)'}}/>
          <p className="mb-0">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div style={{
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      boxSizing: 'border-box',
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white',
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <header className="container-fluid d-flex justify-content-between align-items-center p-3 mb-3" style={{ 
          backgroundColor: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(10px)', 
          borderRadius: '0.375rem', 
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0 // Prevent header from shrinking
        }}>
        <div className="d-flex align-items-center">
          <img src={logoImage} alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
          <h1 className="h4 mb-0 d-none d-md-block text-light">Boat Registration Analytics</h1>
        </div>
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faBell} className="me-3 text-light opacity-75" size="lg" style={{cursor: 'pointer'}} />
          <img src={profileIcon} alt="Profile" style={{ height: '35px', width: '35px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }} />
        </div>
      </header>

      <div className="container-fluid" style={{ 
          flexGrow: 1, // Allow content to take available space
          overflowY: 'auto', // Make content scrollable
          paddingBottom: '1rem' // Space before footer
        }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2">
          <h2 className="h3 mb-3 mb-md-0 text-light">Dashboard Insights</h2>
          <div className="btn-group">
            <button className="btn btn-outline-light">
              <FontAwesomeIcon icon={faFilter} className="me-2" />
              Filters
            </button>
            <button className="btn btn-primary" onClick={handleExportDataCSV}>
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Export Full Report (CSV)
            </button>
          </div>
        </div>

        <ul className="nav nav-tabs nav-fill mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          {['overview', 'detailed', 'predictions'].map(tabName => (
            <li className="nav-item" key={tabName}>
              <button
                className={`nav-link ${activeTab === tabName ? 'active text-primary border-primary' : 'text-light'}`}
                style={{
                  backgroundColor: activeTab === tabName ? 'rgba(13, 110, 253, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tabName ? '3px solid #0d6efd' : '3px solid transparent',
                  padding: '0.75rem 1rem',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease'
                }}
                onClick={() => setActiveTab(tabName)}
              >
                <FontAwesomeIcon 
                    icon={tabName === 'overview' ? faChartBar : tabName === 'detailed' ? faChartLine : faChartPie} 
                    className="me-2" 
                /> {tabName.replace(/([A-Z])/g, ' $1')}
              </button>
            </li>
          ))}
        </ul>

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'detailed' && renderDetailedTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
      </div>

      <footer className="text-center p-3 text-light opacity-75" style={{ 
          backgroundColor: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(5px)', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0 // Prevent footer from shrinking
        }}>
        © {new Date().getFullYear()} Advanced Boat Registration Analytics. All rights reserved.
      </footer>
    </div>
  );
};

export default Analytics;