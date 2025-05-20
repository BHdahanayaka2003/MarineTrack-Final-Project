import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import './loginpage.css';
import logo from './logo.png';

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles"; 
import { motion } from "framer-motion";

// Import the new component
import OrbitingText from './OrbitingText'; // Make sure path is correct

// Firebase configuration (ensure this is secure, ideally from environment variables in a real app)
const firebaseConfig = {
    apiKey: "AIzaSyCRjW_lsIwKlL99xi0hU2_x2xWVSTBSkTg", // Replace with your actual Firebase config
    authDomain: "finalproject-4453c.firebaseapp.com",
    projectId: "finalproject-4453c",
    storageBucket: "finalproject-4453c.appspot.com",
    messagingSenderId: "866850090007",
    appId: "1:866850090007:web:111a4fcef7be69de0a8052",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const particlesInit = useCallback(async engine => {
     await loadFull(engine); 
  }, []);

  const particlesLoaded = useCallback(async container => {
    // console.log(container);
  }, []);

  const particleOptions = {
    fpsLimit: 60,
    interactivity: {
      events: { onClick: { enable: true, mode: "push" }, onHover: { enable: true, mode: "grab" }, resize: true },
      modes: { push: { quantity: 4 }, repulse: { distance: 150, duration: 0.4 }, grab: { distance: 150, links: { opacity: 0.5 } } }
    },
    particles: {
      color: { value: "#ffffff" },
      links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.3, width: 1 },
      collisions: { enable: false },
      move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: true, speed: 1.5, straight: false },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.4 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } }
    },
    detectRetina: true,
    background: { color: 'transparent' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (email === 'admin@gmail.com' && password === 'admin123') {
        navigate('/admindashboard', { state: { userEmail: user.email } });
      } else {
        navigate('/dashboard', { state: { userEmail: user.email } });
      }
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch(errorCode) {
      case 'auth/invalid-email': return 'Invalid email address format.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/too-many-requests': return 'Too many failed login attempts. Try again later.';
      default: return 'An error occurred during login. Please try again.';
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset functionality will be implemented here');
  };

  const inputVariants = {
    focus: { y: -2, scale: 1.02, boxShadow: "0px 5px 10px rgba(0,0,0,0.2)", transition: { type: "spring", stiffness: 300 } },
    blur: { y: 0, scale: 1, boxShadow: "0px 0px 0px rgba(0,0,0,0)" }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 8px 15px rgba(37, 99, 235, 0.4)", transition: { duration: 0.2, yoyo: Infinity } },
    tap: { scale: 0.95 }
  };

  // --- Configuration for Orbiting Texts ---
  // Based on image, "NautiReg: Seamless Registration" is further out and longer.
  // "Your Voyage, Simplified" is closer in.
  const radiusTextOuter = 285; // For "NautiReg: Seamless Registration"
  const radiusTextInner = 255; // For "Your Voyage, Simplified"

  return (
    <div className="login-container">
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particleOptions}
        className="particles-background"
      />

      <div className="left-section">
        <div className="logo-animation-container"> {/* This container needs position: relative */}
          <motion.img 
            src={logo} 
            alt="NautiReg Logo" 
            className="brand-logo" 
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            dragElastic={0.2}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          
          {/* Orbiting Text 1: "NautiReg: Seamless Registration" */}
          <OrbitingText
            text="NautiReg: Seamless Registration"
            radius={radiusTextOuter}
            animationDuration={22} // Slightly slower for outer/longer text
            direction="cw" // Clockwise
            id="orbit-text-nautireg"
            startRotation={-90} // Start with text centered at the top (0 deg is right)
            fixedArcAngle={170} // Span 170 degrees of the circle (adjust for text length)
            characterKerning={1.05} // Slightly increase spacing
            fontSize="1.1rem"
          />

          {/* Orbiting Text 2: "Your Voyage, Simplified" */}
          <OrbitingText
            text="Your Voyage, Simplified"
            radius={radiusTextInner}
            animationDuration={18} // Slightly faster for inner/shorter text
            direction="ccw" // Counter-clockwise
            id="orbit-text-voyage"
            startRotation={90} // Start with text centered at the bottom
            fixedArcAngle={140} // Span 140 degrees (shorter text, less arc needed)
            characterKerning={1.0}
            fontSize="1.0rem" // Slightly smaller font for inner text if desired
          />
        </div>
      </div>
      <div className="right-section">
        <motion.div 
          className="login-box"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness:120, delay: 0.4 }}
        >
          <h2 className="login-title">Sign In to Your Account</h2>
          <form onSubmit={handleSubmit}>
            <motion.div className="input-group" whileHover={{y:-2}}>
              <label htmlFor="email">Email Address</label>
              <motion.input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required variants={inputVariants} whileFocus="focus" animate="blur" />
            </motion.div>
            <motion.div className="input-group" whileHover={{y:-2}}>
              <label htmlFor="password">Password</label>
              <motion.input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required variants={inputVariants} whileFocus="focus" animate="blur" />
            </motion.div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <motion.button type="submit" className="login-button" disabled={isLoading} variants={buttonVariants} whileHover="hover" whileTap="tap">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </motion.button>
              <p className="forgot-password" onClick={handleForgotPassword}>
                Forgot Password ?
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;