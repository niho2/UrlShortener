import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:4444/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Fehler bei der Anmeldung');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="container">
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Benutzername"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passwort"
                            required
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="button-33">Einloggen</button>
                    <div className="signup-link">
                        Noch keinen Account? <a href="/signup" className="link">Registrieren</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
