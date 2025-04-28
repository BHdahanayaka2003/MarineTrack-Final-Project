import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FirstPage from './firstpage';
import LoginPage from './loginpage';
import Dashboard from './Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import BoatRegister from './BoatRegister';
import BoatOwnerDetails from './BoatOwnerDetails';
import HandleFisherman from './HandleFisherman';
function App() {
  return (
    <Routes>
      <Route path="/" element={<FirstPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/BoatRegister" element={<BoatRegister />} />
      <Route path="/BoatOwnerDetails" element={<BoatOwnerDetails />} />
      <Route path="/HandleFisherman" element={<HandleFisherman />} />
    </Routes>
  );
}


export default App;