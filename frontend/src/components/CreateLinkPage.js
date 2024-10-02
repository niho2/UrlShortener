import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateLinkPage.css';

const CreateLinkPage = () => {
    const [shortLink, setShortLink] = useState('');
    const [destinationLink, setDestinationLink] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4444';

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(process.env); // Prüfe den gesamten Inhalt der Umgebungsvariablen
        try {
            const response = await fetch(API_URL + '/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ shortLink, destinationLink })
            });

            if (!response.ok) throw new Error('Failed to create ShortURL: ' + await response.text());

            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="create-link-container">
            <div className="form-container">
                <h1>Create link</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            id="shortLink"
                            value={shortLink}
                            onChange={(e) => setShortLink(e.target.value)}
                            placeholder="Short Link"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            id="destinationLink"
                            value={destinationLink}
                            onChange={(e) => setDestinationLink(e.target.value)}
                            placeholder="Destination Link"
                            required
                        />
                    </div>
                    <button type="submit" className="button-33">Create link</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default CreateLinkPage;
