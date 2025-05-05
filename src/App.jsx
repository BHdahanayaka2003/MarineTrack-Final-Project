import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FirstPage from './firstpage';
import LoginPage from './loginpage';
import Dashboard from './Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import BoatRegister from './BoatRegister';
import BoatOwnerDetails from './BoatOwnerDetails';
import HandleFisherman from './HandleFisherman';
import BoatRegistrationPage from './BoatRegistationPage';
import OwnerDetails from './OwnerDetails';
import FishermanDetails from './FishermanDetails';
import OwnerRegister from './OwnerRegister';
import HandleFishermanID from './HandleFishermanID';
import RejectBoat from './RejectBoat';
import OfficerRegister from './officerRegister'
import AdminDashboard from './adminDashboard';
function App() {
  return (

    <Routes>
      <Route path="/" element={<FirstPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admindashboard" element={<AdminDashboard />} />
      <Route path="/BoatRegister" element={<BoatRegister />} />
      <Route path="/BoatRegistrationPage" element={<BoatRegistrationPage />} />
      <Route path="/BoatOwnerDetails" element={<BoatOwnerDetails />} />
      <Route path="/OwnerDetails" element={<OwnerDetails />} />
      <Route path="/HandleFisherman" element={<HandleFisherman />} />
      <Route path="/FishermanDetails" element={<FishermanDetails />} />
      <Route path="/OwnerRegister" element={<OwnerRegister />} />
      <Route path="/HandleFishermanID" element={<HandleFishermanID/>} />
      <Route path="/RejectBoat" element={<RejectBoat />} />
      <Route path="/officerregister" element={<OfficerRegister />} />
    </Routes>
  );
}


export default App;