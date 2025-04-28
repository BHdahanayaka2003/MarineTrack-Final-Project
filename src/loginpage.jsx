// LoginPage.jsx
import React, { useState } from 'react';
import './loginpage.css';  // Fixed CSS import
import { useNavigate } from 'react-router-dom';  // Added navigate import
import logo from './logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();  // Added navigate hook

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email:', email, 'Password:', password);
    // After successful login, navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <img src={logo} alt="NautiReg Logo" className="logo" />
      </div>
      <div className="right-section">
        <div className="login-box">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
            <p className="forgot-password">Forgot Password?</p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;