import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import FamilyTree from './pages/FamilyTree';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    setAuthed(!!localStorage.getItem('token'));
  }, []);

  const handleAuth = () => setAuthed(true);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/register" element={<Register onAuth={handleAuth} />} />
          <Route path="/login" element={<Login onAuth={handleAuth} />} />
          <Route path="/" element={<ProtectedRoute><FamilyTree /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;