import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Dropdown } from "react-bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import profileImage from "./profile.png";
import logoImage from "./logo.png";
import backgroundImage from "./background.jpeg";

// CSS for animations
const weatherAnimationStyles = `
  /* Base styles for animations */
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes fadeInOut {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }

  /* Weather-specific animations */
  .sun-rays {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%);
    animation: pulse 4s infinite ease-in-out;
  }

  .cloud {
    position: absolute;
    background: white;
    border-radius: 50%;
    opacity: 0.8;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }

  .cloud-1 {
    width: 70px;
    height: 30px;
    top: 20px;
    left: 10px;
    animation: float 7s infinite ease-in-out;
  }

  .cloud-2 {
    width: 50px;
    height: 20px;
    top: 10px;
    right: 20px;
    animation: float 5s infinite ease-in-out;
  }

  .raindrop {
    position: absolute;
    width: 3px;
    height: 15px;
    background: linear-gradient(to bottom, rgba(156,204,241,0), rgba(156,204,241,0.8));
    border-radius: 0 0 5px 5px;
    animation: rain 1s infinite linear;
  }

  @keyframes rain {
    0% { transform: translateY(-15px); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(100px); opacity: 0; }
  }

  @keyframes lightning {
    0% { opacity: 0; }
    25% { opacity: 1; }
    30% { opacity: 0; }
    35% { opacity: 1; }
    40% { opacity: 0; }
    45% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 0; }
  }

  .lightning {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.7);
    animation: lightning 5s infinite;
  }

  .snowflake {
    position: absolute;
    color: white;
    font-size: 12px;
    animation: snow 5s infinite linear;
  }

  @keyframes snow {
    0% {
      transform: translateY(-10px) translateX(0) rotate(0deg);
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
    100% {
      transform: translateY(100px) translateX(20px) rotate(360deg);
      opacity: 0;
    }
  }

  .fog-layer {
    position: absolute;
    width: 200%;
    height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
    animation: fog 10s infinite linear;
  }

  @keyframes fog {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
  }

  .wind-indicator {
    position: relative;
    display: inline-block;
    transition: transform 1s ease;
  }

  @keyframes wave {
    0% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0); }
  }

  .tide-rising {
    animation: wave 2s infinite ease-in-out;
    color: #0d6efd;
  }

  .tide-falling {
    animation: wave 3s infinite ease-in-out;
    color: #6c757d;
  }

  /* Dashboard card animations */
  .card-hover {
    transition: all 0.3s ease-in-out;
  }
  
  .card-hover:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
  }

  .loading-indicator {
    animation: spin 2s infinite linear;
  }

  /* Weather card animations */
  .weather-card {
    position: relative;
    overflow: hidden;
    transition: all 0.5s ease;
  }

  .weather-card:hover {
    transform: scale(1.02);
  }

  /* Safety status animations */
  .pulse-animation {
    animation: pulse 2s infinite;
  }

  .safety-favorable {
    animation: glow-green 2s infinite alternate;
  }

  .safety-moderate {
    animation: glow-yellow 2s infinite alternate;
  }

  .safety-hazardous {
    animation: glow-red 1s infinite alternate;
  }

  @keyframes glow-green {
    from { text-shadow: 0 0 5px rgba(25, 135, 84, 0.5); }
    to { text-shadow: 0 0 20px rgba(25, 135, 84, 0.9); }
  }

  @keyframes glow-yellow {
    from { text-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
    to { text-shadow: 0 0 20px rgba(255, 193, 7, 0.9); }
  }

  @keyframes glow-red {
    from { text-shadow: 0 0 5px rgba(220, 53, 69, 0.5); }
    to { text-shadow: 0 0 20px rgba(220, 53, 69, 0.9); }
  }

  /* Button animations */
  .btn-animated {
    position: relative;
    overflow: hidden;
    z-index: 1;
    transition: all 0.3s ease;
  }

  .btn-animated:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: all 0.5s ease;
    z-index: -1;
  }

  .btn-animated:hover:before {
    left: 100%;
  }

  /* Background animation */
  .animated-background {
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
  }

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Logo animation */
  .logo-animated {
    animation: float 6s infinite ease-in-out;
  }

  /* Wave animation for marine theme */
  .wave-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="%230d6efd"/><path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="%230d6efd"/><path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="%230d6efd"/></svg>');
    background-size: cover;
    animation: wave-move 10s linear infinite;
  }

  @keyframes wave-move {
    0% { background-position-x: 0; }
    100% { background-position-x: 1000px; }
  }
`;

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
  const [animationVisible, setAnimationVisible] = useState(false);
  const [hoverStates, setHoverStates] = useState({});

  // References for animated elements
  const weatherCardRef = useRef(null);
  const windDirectionRef = useRef(null);

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
        
        // Show animation after weather loads
        setTimeout(() => {
          setAnimationVisible(true);
        }, 500);
        
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

  // Update wind direction indicator
  useEffect(() => {
    if (weather && windDirectionRef.current) {
      windDirectionRef.current.style.transform = `rotate(${weather.current.wind_degree}deg)`;
    }
  }, [weather]);

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
      path: "/departureDetails",
      icon: "bi-compass",
      description: "Track and log boat departures and planned routes"
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

  // Weather animation components based on current weather
  const renderWeatherAnimation = () => {
    if (!weather || !animationVisible) return null;
    
    const weatherText = weather.current.condition.text.toLowerCase();
    
    if (weatherText.includes("sunny") || weatherText.includes("clear")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          <div className="sun-rays"></div>
        </div>
      );
    } else if (weatherText.includes("partly cloudy")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          <div className="sun-rays" style={{ opacity: 0.5 }}></div>
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
        </div>
      );
    } else if (weatherText.includes("cloudy") || weatherText.includes("overcast")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="cloud" 
              style={{
                width: `${40 + Math.random() * 40}px`,
                height: `${15 + Math.random() * 20}px`,
                top: `${10 + Math.random() * 40}px`,
                left: `${(i * 20) + Math.random() * 15}%`,
                animation: `float ${5 + Math.random() * 5}s infinite ease-in-out`
              }}
            ></div>
          ))}
        </div>
      );
    } else if (weatherText.includes("rain") || weatherText.includes("drizzle")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          <div className="cloud" style={{ width: "80%", height: "30px", top: "10px", left: "10%", borderRadius: "30px" }}></div>
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="raindrop" 
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.7}s`
              }}
            ></div>
          ))}
        </div>
      );
    } else if (weatherText.includes("thunder")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          <div className="cloud" style={{ width: "80%", height: "30px", top: "10px", left: "10%", borderRadius: "30px" }}></div>
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i} 
              className="raindrop" 
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`
              }}
            ></div>
          ))}
          <div className="lightning"></div>
        </div>
      );
    } else if (weatherText.includes("snow") || weatherText.includes("sleet")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1 }}>
          <div className="cloud" style={{ width: "80%", height: "30px", top: "10px", left: "10%", borderRadius: "30px" }}></div>
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i} 
              className="snowflake" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              ❄
            </div>
          ))}
        </div>
      );
    } else if (weatherText.includes("fog") || weatherText.includes("mist")) {
      return (
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="fog-layer" 
              style={{
                top: `${20 + i * 25}%`,
                height: "20%",
                opacity: 0.3,
                animationDelay: `${i * 2}s`,
                animationDuration: `${15 + i * 5}s`
              }}
            ></div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  // For handling button hover states
  const handleMouseEnter = (index) => {
    setHoverStates(prev => ({ ...prev, [index]: true }));
  };

  const handleMouseLeave = (index) => {
    setHoverStates(prev => ({ ...prev, [index]: false }));
  };

  // Get tide icon and class
  const getTideIconAndClass = () => {
    const tide = getTideInfo();
    if (tide.status === "Rising") {
      return { icon: "bi-arrow-up", className: "tide-rising" };
    } else {
      return { icon: "bi-arrow-down", className: "tide-falling" };
    }
  };

  // Get safety status animation class
  const getSafetyStatusClass = () => {
    const status = getSafetyStatus();
    
    if (status.status === "Favorable") {
      return "safety-favorable";
    } else if (status.status === "Moderate") {
      return "safety-moderate";
    } else if (status.status === "Hazardous") {
      return "safety-hazardous";
    }
    
    return "";
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary loading-indicator" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const safetyStatus = getSafetyStatus();
  const tideInfo = getTideInfo();
  const tideDisplay = getTideIconAndClass();

  return (
    <>
      {/* Include the styles */}
      <style>{weatherAnimationStyles}</style>
      
      <div
        className="min-vh-100 vw-100 d-flex justify-content-center align-items-center position-relative animated-background"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          paddingTop: "2rem",
          paddingBottom: "2rem"
        }}
      >
        {/* Wave animation at the bottom */}
        <div className="wave-bottom"></div>
        
        <div className="container">
          <div 
            className="bg-light bg-opacity-85 p-4 p-md-5 rounded-4 shadow-lg"
            style={{ 
              backdropFilter: "blur(10px)",
              transition: "all 0.5s ease",
              transform: animationVisible ? "translateY(0)" : "translateY(20px)",
              opacity: animationVisible ? 1 : 0
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div className="d-flex align-items-center">
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  width="60" 
                  height="60" 
                  className="me-3 logo-animated"
                />
                <div className="d-none d-md-block">
                  <h6 className="mb-0 text-primary">Fisheries Management</h6>
                  <small className="text-muted">Galle, Sri Lanka</small>
                </div>
              </div>
              <h1 className="text-center flex-grow-1 fw-bold text-uppercase d-none d-md-block">
                Dashboard
              </h1>
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center">
                  <img
                    src={profileImage}
                    alt="Profile"
                    width="40"
                    height="40"
                    className="rounded-circle me-2"
                  />
                  <div className="d-flex flex-column">
                    <span className="fw-bold">{userEmail}</span>
                    <small className="text-muted">Admin</small>
                  </div>
                </div>
                <Dropdown>
                  <Dropdown.Toggle variant="link" id="dropdown-basic" className="text-dark ms-2">
                    <i className="bi bi-three-dots-vertical"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item href="#/profile">
                      <i className="bi bi-person me-2"></i>Profile
                    </Dropdown.Item>
                    <Dropdown.Item href="#/settings">
                      <i className="bi bi-gear me-2"></i>Settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            {/* Date and Time */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm mb-3">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="fw-bold">{formatTime(currentTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Alert Banner */}
            {weatherAlert && (
              <div className={`alert alert-${weatherAlert.type} fade show mb-4`} role="alert">
                <div className="d-flex align-items-center">
                  <i className={`bi bi-exclamation-triangle-fill me-2 ${weatherAlert.type === 'danger' ? 'pulse-animation' : ''}`}></i>
                  <div>
                    <strong>Weather Alert:</strong> {weatherAlert.message}
                  </div>
                </div>
              </div>
            )}

            {/* Weather and Safety Status */}
            <div className="row mb-4">
              {/* Weather Card */}
              <div className="col-md-8 mb-3 mb-md-0">
                <div ref={weatherCardRef} className="card shadow-sm h-100 weather-card">
                  {renderWeatherAnimation()}
                  <div className="card-body position-relative">
                    <h5 className="card-title d-flex justify-content-between">
                      <span>Current Weather</span>
                      {weatherLoading ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <span>{weather?.location?.name}, {weather?.location?.country}</span>
                      )}
                    </h5>
                    
                    {error ? (
                      <div className="alert alert-danger mb-0">{error}</div>
                    ) : weatherLoading ? (
                      <div className="d-flex justify-content-center my-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading weather data...</span>
                        </div>
                      </div>
                    ) : weather ? (
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <i className={`bi ${getWeatherIcon(weather.current.condition.text)} fs-1 me-3`}></i>
                            <div>
                              <h2 className="mb-0">{weather.current.temp_c}°C</h2>
                              <span>{weather.current.condition.text}</span>
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">Feels like:</span> {weather.current.feelslike_c}°C
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">Humidity:</span> {weather.current.humidity}%
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">Visibility:</span> {weather.current.vis_km} km
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <span className="text-muted">Wind:</span> {weather.current.wind_kph} kph 
                            <span className="wind-indicator ms-2" ref={windDirectionRef}>
                              <i className="bi bi-arrow-up"></i>
                            </span> 
                            <span className="ms-1">{getWindDirection(weather.current.wind_degree)}</span>
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">Pressure:</span> {weather.current.pressure_mb} mb
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">Precipitation:</span> {weather.current.precip_mm} mm
                          </div>
                          <div className="mb-2">
                            <span className="text-muted">UV Index:</span> {weather.current.uv}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              
              {/* Safety and Tide Status */}
              <div className="col-md-4">
                <div className="card shadow-sm h-100 card-hover">
                  <div className="card-body">
                    <h5 className="card-title">Marine Conditions</h5>
                    
                    {/* Safety Status */}
                    <div className="mb-4">
                      <h6 className="text-muted">Safety Status</h6>
                      <div className="d-flex align-items-center">
                        <div className={`fs-4 me-2 fw-bold text-${safetyStatus.color} ${getSafetyStatusClass()}`}>
                          {safetyStatus.status}
                        </div>
                        <span className={`badge bg-${safetyStatus.color} ms-auto`}>
                          {safetyStatus.status === "Favorable" ? "Safe" : 
                           safetyStatus.status === "Moderate" ? "Caution" : "Warning"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tide Information */}
                    <div>
                      <h6 className="text-muted">Tide Information</h6>
                      <div className="d-flex align-items-center">
                        <div className={`fs-5 me-2 ${tideDisplay.className}`}>
                          <i className={`bi ${tideDisplay.icon} me-2`}></i>
                          {tideInfo.status}
                        </div>
                      </div>
                      <div className="small">{tideInfo.time}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Buttons */}
            <div className="row mb-3">
              <div className="col-12">
                <h5 className="mb-3 fw-bold">Quick Actions</h5>
              </div>
              {buttons.map((button, index) => (
                <div key={index} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className={`card shadow-sm card-hover border-${button.color} h-100`}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={() => handleMouseLeave(index)}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle p-3 me-3 bg-${button.color} bg-opacity-25`}>
                          <i className={`bi ${button.icon} fs-4 text-${button.color}`}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{button.label}</h6>
                          <p className="text-muted small mb-0">{button.description}</p>
                        </div>
                      </div>
                      <div 
                        className="mt-3 text-end"
                        style={{
                          opacity: hoverStates[index] ? 1 : 0,
                          transform: hoverStates[index] ? 'translateY(0)' : 'translateY(10px)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <button 
                          className={`btn btn-${button.color} btn-sm btn-animated`}
                          onClick={() => navigate(button.path)}
                        >
                          Access <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="row">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title mb-3">System Status</h5>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle p-2 bg-success bg-opacity-25 me-3">
                            <i className="bi bi-check-circle-fill text-success"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">Online</h6>
                            <small className="text-muted">All systems operational</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle p-2 bg-primary bg-opacity-25 me-3">
                            <i className="bi bi-database-fill text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">Database</h6>
                            <small className="text-muted">Connected</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle p-2 bg-warning bg-opacity-25 me-3">
                            <i className="bi bi-activity text-warning"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">API</h6>
                            <small className="text-muted">Active</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle p-2 bg-info bg-opacity-25 me-3">
                            <i className="bi bi-clock-fill text-info"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">Last Update</h6>
                            <small className="text-muted">{formatTime(currentTime)}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-top text-center text-muted">
              <small>Fisheries Management System &copy; {currentTime.getFullYear()} | Galle, Sri Lanka</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;