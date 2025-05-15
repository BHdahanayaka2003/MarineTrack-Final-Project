import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import backgroundImage from './background.jpeg'; // Make sure this path is correct
import logoImage from './logo.png'; // Make sure this path is correct
import profileIcon from './profile.png'; // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


// Fireb</div>ase configuration (ensure this is secure in a real app, e.g., via environment variables)
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



const DepartureDetails = () => {

    return (
        <div>
            <div
                className="container-fluid d-flex justify-content-center align-items-center m-0 p-0"
                style={{
                    minHeight: '100vh',
                    width: '100vw',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    color: '#fff',
                }}
            ></div>

            
        </div>
    )
  
};

export default DepartureDetails;