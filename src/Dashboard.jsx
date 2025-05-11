import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Dropdown } from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import profileImage from "./profile.png";
import logoImage from "./logo.png";
import backgroundImage from "./background.jpeg";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState("Administrator");
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [error, setError] = useState(null);

  // API key - in production, use environment variables
  const API_KEY = "0e3c8d7f0e4f4dd9bb4160626241211"; // WeatherAPI.com key from your example
  const CITY = "Galle,LK";

  // Check auth state when component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Use email from location state if available, otherwise from auth
        const email = location.state?.userEmail || user.email;
        setUserEmail(email);
      } else {
        // If no user is logged in, redirect to login
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.state]);

  // Fetch weather data from WeatherAPI.com
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        setError(null);
        
        // Fetch current weather data using WeatherAPI.com
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${CITY}&days=1&aqi=yes&alerts=yes`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API returned status: ${response.status}`);
        }
        
        const weatherData = await response.json();
        console.log("Weather data:", weatherData); // For debugging
        setWeather(weatherData);
        
        // Check for weather alerts
        if (weatherData.alerts && weatherData.alerts.alert && weatherData.alerts.alert.length > 0) {
          setWeatherAlert({
            type: "warning",
            message: weatherData.alerts.alert[0].headline
          });
        } else {
          // Check weather conditions to create custom alerts
          const windSpeed = weatherData.current.wind_kph;
          if (windSpeed > 30) {
            setWeatherAlert({
              type: "warning",
              message: "High winds detected. Small craft advisory in effect."
            });
          } else if (weatherData.current.condition.text.toLowerCase().includes("thunder")) {
            setWeatherAlert({
              type: "danger",
              message: "Thunderstorms detected. Dangerous conditions for marine activity."
            });
          }
        }
        
        setWeatherLoading(false);
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setError("Failed to load weather data. Please check your API key or try again later.");
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Refresh weather data every 30 minutes
    const weatherInterval = setInterval(() => {
      fetchWeather();
    }, 30 * 60 * 1000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(weatherInterval);
    };
  }, [CITY, API_KEY]);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        navigate('/'); // Redirect to login page after logout
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };

  const getWeatherIcon = (code) => {
    // Map WeatherAPI.com condition codes to Bootstrap icons
    // This is a simple mapping, you can expand based on the codes from WeatherAPI
    const conditionText = code ? code.toLowerCase() : "";
    
    if (conditionText.includes("sunny") || conditionText.includes("clear")) {
      return "bi-sun-fill text-warning";
    } else if (conditionText.includes("partly cloudy")) {
      return "bi-cloud-sun-fill text-warning";
    } else if (conditionText.includes("cloudy") || conditionText.includes("overcast")) {
      return "bi-cloud-fill text-secondary";
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
      return "bi-cloud-rain-fill text-info";
    } else if (conditionText.includes("thunder")) {
      return "bi-cloud-lightning-fill text-warning";
    } else if (conditionText.includes("snow") || conditionText.includes("sleet")) {
      return "bi-cloud-snow-fill text-light";
    } else if (conditionText.includes("fog") || conditionText.includes("mist")) {
      return "bi-cloud-haze-fill text-light";
    } else {
      return "bi-cloud-fill text-secondary";
    }
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTideInfo = () => {
    // In a real application, this would come from a tide prediction API
    // This is still mock data for demonstration - consider using a real tide API
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) {
      return { status: "Rising", time: "High tide at 12:45 PM" };
    } else if (hour >= 12 && hour < 18) {
      return { status: "Falling", time: "Low tide at 6:30 PM" };
    } else if (hour >= 18 || hour < 0) {
      return { status: "Rising", time: "High tide at 12:15 AM" };
    } else {
      return { status: "Falling", time: "Low tide at 6:20 AM" };
    }
  };

  const getSafetyStatus = () => {
    if (!weather) return { status: "Unknown", color: "secondary" };
    
    // Use real weather data to determine safety status
    const windSpeed = weather.current.wind_kph;
    const weatherMain = weather.current.condition.text.toLowerCase();
    
    if (windSpeed > 30 || weatherMain.includes("thunder") || weatherMain.includes("storm")) {
      return { status: "Hazardous", color: "danger" };
    } else if (windSpeed > 15 || weatherMain.includes("rain") || weatherMain.includes("fog")) {
      return { status: "Moderate", color: "warning" };
    } else {
      return { status: "Favorable", color: "success" };
    }
  };
  
  const buttons = [
    { 
      label: "Boat Register", 
      color: "warning", 
      path: "/BoatRegister",
      icon: "bi-ship",
      description: "Register new boats in the system"
    },
    { 
      label: "Display Boat Owners", 
      color: "danger", 
      path: "/BoatOwnerDetails",
      icon: "bi-people-fill",
      description: "View and manage boat owner information"
    },
    { 
      label: "Handle Fisherman ID", 
      color: "success", 
      path: "/HandleFishermanID",
      icon: "bi-person-badge",
      description: "Process fisherman identification cards"
    },
    { 
      label: "Remove Register Details", 
      color: "info", 
      path: "/remove-details",
      icon: "bi-trash",
      description: "Delete registration records from database"
    },
    { 
      label: "Departure Details", 
      color: "primary", 
      path: "/BoatOwnerDetails",
      icon: "bi-person-plus",
      description: "Add new boat owners to the system"
    },
    { 
      label: "Rejected Boat Details", 
      color: "danger", 
      path: "/RejectBoat",
      icon: "bi-x-circle",
      description: "View boats that failed registration"
    },
    { 
      label: "Display Fisherman Details", 
      color: "secondary", 
      path: "/FishermanDetails",
      icon: "bi-info-circle",
      description: "Access detailed fisherman records"
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const safetyStatus = getSafetyStatus();
  const tideInfo = getTideInfo();

  return (
    <div
      className="min-vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        paddingTop: "2rem",
        paddingBottom: "2rem"
      }}
    >
      <div className="container">
        <div 
          className="bg-light bg-opacity-85 p-4 p-md-5 rounded-4 shadow-lg" 
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <img 
                src={logoImage} 
                alt="Logo" 
                width="60" 
                height="60" 
                className="me-3"
              />
              <div className="d-none d-md-block">
                <h6 className="mb-0 text-primary">Fisheries Management</h6>
                <small className="text-muted">Galle, Sri Lanka</small>
              </div>
            </div>
            <h1 className="text-center flex-grow-1 fw-bold text-uppercase d-none d-md-block">
              Dashboard
            </h1>
            <h1 className="text-center fw-bold text-uppercase d-block d-md-none">
              Dashboard
            </h1>
            <div className="d-flex align-items-center">
              <div className="text-end me-3 d-none d-md-block">
                <h6 className="mb-0">{userEmail}</h6>
                <small className="text-muted">Online</small>
              </div>
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="link" 
                  id="user-dropdown"
                  className="d-flex align-items-center">
                    <img 
                       src={profileImage} 
                       alt="User" 
                       width="50" 
                       height="50" 
                       className="rounded-circle border border-3 border-primary" 
                    />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                <Dropdown.Item onClick={() => navigate("/officerProfileEdit")}>
                 Edit Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {/* Weather Alert Banner */}
          {weatherAlert && (
            <div className={`alert alert-${weatherAlert.type} d-flex align-items-center mb-4`} role="alert">
              <i className="bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
              <div><strong>Weather Alert:</strong> {weatherAlert.message}</div>
            </div>
          )}

          {/* Weather Dashboard */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-primary shadow">
                <div className="card-header bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi-geo-alt-fill me-2"></i>
                      Galle Marine Weather
                    </h5>
                    <div>
                      <small>{currentTime.toLocaleDateString()} | {formatTime(currentTime)}</small>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {weatherLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading weather data...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-3">
                      <p className="text-danger mb-0">{error}</p>
                    </div>
                  ) : weather ? (
                    <div className="row">
                      <div className="col-md-4 mb-3 mb-md-0">
                        <div className="text-center">
                          <div className="display-3 mb-0">
                            <i className={getWeatherIcon(weather.current.condition.text)}></i>
                          </div>
                          <h2 className="display-4 fw-bold mb-0">{weather.current.temp_c.toFixed(1)}°C</h2>
                          <p className="text-capitalize">{weather.current.condition.text}</p>
                          <div className="d-flex justify-content-center mt-2">
                            <span className="badge bg-primary me-2">Feels like: {weather.current.feelslike_c.toFixed(1)}°C</span>
                            <span className="badge bg-info">Humidity: {weather.current.humidity}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4 mb-3 mb-md-0">
                        <div className="h-100 border-start border-end px-3 d-flex flex-column justify-content-center">
                          <h5 className="mb-3">Wind & Sea Conditions</h5>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>
                              <i className="bi-wind me-2"></i>
                              Wind Speed:
                            </span>
                            <span className="fw-bold">{weather.current.wind_kph} km/h</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>
                              <i className="bi-compass me-2"></i>
                              Direction:
                            </span>
                            <span className="fw-bold">{weather.current.wind_dir} ({weather.current.wind_degree}°)</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>
                              <i className="bi-water me-2"></i>
                              Tide:
                            </span>
                            <span className="fw-bold">{tideInfo.status}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <i className="bi-clock me-2"></i>
                              Tide Time:
                            </span>
                            <span className="fw-bold">{tideInfo.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <div className="text-center h-100 d-flex flex-column justify-content-center">
                          <h5 className="mb-3">Marine Safety Status</h5>
                          <div className={`display-6 text-${safetyStatus.color} mb-2`}>
                            <i className={`bi-shield-${safetyStatus.status === 'Favorable' ? 'check' : 'exclamation'} me-2`}></i>
                            {safetyStatus.status}
                          </div>
                          {/* Buttons removed as requested */}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-danger mb-0">Failed to load weather data. Please try again later.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Buttons */}
          <div className="row g-4">
            {buttons.map((btn, index) => (
              <div className="col-12 col-md-6 col-lg-4" key={index}>
                <div 
                  className={`card h-100 border-${btn.color} shadow-sm hover-shadow`} 
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className={`card-header bg-${btn.color} bg-opacity-25 text-${btn.color}`}>
                    <div className="d-flex align-items-center">
                      <i className={`${btn.icon} fs-4 me-2`}></i>
                      <h5 className="mb-0">{btn.label}</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3 small">{btn.description}</p>
                    <button
                      className={`btn btn-${btn.color} w-100 py-2 fw-semibold rounded-pill`}
                      onClick={() => navigate(btn.path)}
                    >
                      <i className={`${btn.icon} me-2`}></i>
                      Access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-top text-center">
            <p className="text-muted mb-0 small">
              Fisheries Management System • v2.1.0 • © 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;