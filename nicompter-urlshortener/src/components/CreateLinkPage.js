import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateLinkPage.css';

const CreateLinkPage = () => {
    const [name, setName] = useState('');
    const [ram, setRam] = useState('');
    const [ramUnit, setRamUnit] = useState('MB');
    const [ip, setIp] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isNaN(ram) || ram <= 0) {
            setError('Bitte geben Sie eine gültige RAM-Größe ein.');
            return;
        }

        // Konvertiere RAM in MB, falls die Einheit GB ist
        const ramInMB = ramUnit === 'GB' ? ram * 1024 : ram;

        try {
            const response = await fetch('http://localhost:5001/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) throw new Error('Failed to create ShortURL');

            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="create-node-container">
            <div className="form-container">
                <h1>Node erstellen</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            required
                        />
                    </div>
                    <div className="input-group ram-container">
                        <input
                            type="number"
                            id="ram"
                            value={ram}
                            onChange={(e) => setRam(e.target.value)}
                            placeholder="Maximaler RAM"
                            required
                        />
                        <select
                            id="ramUnit"
                            value={ramUnit}
                            onChange={(e) => setRamUnit(e.target.value)}
                        >
                            <option value="MB">MB</option>
                            <option value="GB">GB</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            id="ip"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="IP Address"
                            required
                        />
                    </div>
                    <button type="submit" className="button-33">Node erstellen</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default CreateLinkPage;
