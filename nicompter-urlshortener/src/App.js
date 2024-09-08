import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import LoginRoute from './components/LoginRoute';
import CreateLinkPage from './components/CreateLinkPage';
import LinkStatsPage from './components/LinkStatsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRoute><LoginPage /></LoginRoute>} />
        <Route path="/" element={<LoginRoute><LoginPage /></LoginRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/stats/:shortLink" element={<PrivateRoute><LinkStatsPage /></PrivateRoute>} />
        <Route path='/create' element={<PrivateRoute><CreateLinkPage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
