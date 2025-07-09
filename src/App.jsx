import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Share from './pages/Share';
// import Share from './pages/Share'; // For future use

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share/:id" element={<Share />} />
      </Routes>
    </Router>
  );
}

export default App;
