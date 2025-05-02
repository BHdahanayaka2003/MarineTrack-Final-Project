import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './loginpage.css';
import logo from './logo.png';
import { auth } from './Backend/Firebase'; // Import auth from Firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase auth method

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Check for empty fields before making API call
      if (!email || !password) {
        setError('Email and password are required.');
        setIsLoading(false);
        return;
      }

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Login successful!', user);

      // Check if the user is the admin
      if (email === 'admin@gmail.com') {
        // Navigate to admin dashboard if the email is admin@gmail.com
        navigate('/admindashboard', { state: { userEmail: user.email } });
      } else {
        // Otherwise, navigate to the regular user dashboard
        navigate('/dashboard', { state: { userEmail: user.email } });
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err.code);
      console.error('Login error:', err);  // Log error details to the console
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Try again later.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset functionality will be implemented here');
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <img src={logo} alt="NautiReg Logo" className="logo" />
      </div>
      <div className="right-section">
        <div className="login-box">
          <h2 className="login-title">Sign In to Your Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="forgot-password" onClick={handleForgotPassword}>
                Forgot Password ?
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
