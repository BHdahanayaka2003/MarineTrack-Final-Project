import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config'; // Your Firebase config file
import './loginPage.css';
import logo from './logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // You can optionally get additional user data from Firestore here
      // const userDoc = await getDoc(doc(db, "users", user.uid));
      // const userData = userDoc.data();

      // Store user in localStorage (optional)
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err.code));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert Firebase error codes to user-friendly messages
  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'Account disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      default:
        return 'Login failed. Please try again.';
    }
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <img className="logo" src={logo} alt="Company Logo" />
        
        <form onSubmit={handleLogin} className="login-form">
          <h2>Login to Your Account</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
          
          <div className="links-container">
            <span onClick={() => navigate('/register')}>Create account</span>
            <span onClick={() => navigate('/forgot-password')}>Forgot password?</span>
          </div>
        </form>
      </div>
      
      <div className="right-section">
        {/* Background image or promotional content */}
      </div>
    </div>
  );
};

export default LoginPage;