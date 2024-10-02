import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4444';

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(API_URL + '/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {


                throw new Error((await response.text()).toString());
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
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
