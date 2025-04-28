
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FirstPage from './firstpage';
import LoginPage from './loginpage';
import Dashboard from './Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import BoatRegister from './BoatRegister';
function App() {
  return (
    
    //   <div>
    //   <BoatRegister />
    // </div>
    
    <Routes>
<<<<<<< Updated upstream
      <Route path="/" element={<FirstPage />} />
=======
      {/* <Route path="/" element={<HomePage />} />
>>>>>>> Stashed changes
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} /> */}
      <Route path="/" element={<Dashboard />} />
      <Route path='/BoatRegister' element={<BoatRegister />} />
    </Routes>
  );
}

export default App;
