// HomePage.jsx
import React from 'react';
import './loginPage.css';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';

const FirstPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => 
    {
    navigate('/login'); 
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <img className="logo" src={logo} alt="Logo" />
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
      </div>
      <div className="right-section"></div>
    </div>
  );
};

export default FirstPage;
