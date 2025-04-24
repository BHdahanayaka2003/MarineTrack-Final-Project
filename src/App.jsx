// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './homepage';
import LoginPage from './loginpage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
