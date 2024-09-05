// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// Hilfsfunktion zur Überprüfung, ob das Token abgelaufen ist
const isTokenExpired = (token) => {
    if (!token) return true;

    const payload = JSON.parse(atob(token.split('.')[1])); // Token-Daten dekodieren
    const now = Math.floor(Date.now() / 1000); // Aktuelle Zeit in Sekunden seit dem Epoch
    return payload.exp < now;
};
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // Token überprüfen und zur Login-Seite umleiten, falls es abgelaufen oder ungültig ist
    if (!isTokenExpired(token)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;
