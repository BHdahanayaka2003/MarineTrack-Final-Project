// FirstPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './firstpage.css';
import logo from './logo.png';
import backgroundImage from './background.jpeg';

// Assuming you might use a UI library, but implementing with native elements
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
        <div className="logo-container">
          <img className="logo" src={logo} alt="Company Logo" />
          <p className="tagline">Your journey begins here</p>
        </div>
        
        <div className="buttons-container">
          <button className="login-button" onClick={handleLogin}>
            <span className="icon">→</span>
            <span>Login</span>
          </button>
          
          {/* <button className="signup-button" onClick={handleSignup}>
            <span>Create Account</span>
          </button> */}
        </div>
      </div>
      
      <div className="right-section">
        {/* This section can be used for additional content */}
      </div>
    </div>
  );
};

export default FirstPage;