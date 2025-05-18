// FirstPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './firstpage.css';
import logo from './logo.png';
import backgroundImage from './background.jpeg';

const FirstPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add a small delay for the animation effect
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className={`login-container ${isLoaded ? 'loaded' : ''}`}>
      <img 
        src={backgroundImage} 
        alt="Background" 
        className="background-image" 
        loading="eager"
        onLoad={() => setIsLoaded(true)}
      />
      
      <div className="left-section">
        <div className="brand-container">
          <div className="logo-wrapper">
            <img className="main-logo" src={logo} alt="Company Logo" />
          </div>
          <p className="tagline">Your journey begins here</p>
        </div>
        
        <div className="buttons-container">
          <button className="login-button" onClick={handleLogin}>
            <span className="icon">→</span>
            <span>Login</span>
          </button>
          
          
        </div>
      </div>
      
      <div className="right-section">
        <div className="welcome-message">
          <h2>Welcome Aboard</h2>
          <p>Discover a world of possibilities with our maritime services</p>
        </div>
      </div>
    </div>
  );
};

export default FirstPage;