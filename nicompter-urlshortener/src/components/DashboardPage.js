import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrashAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './DashboardPage.css';

const DashboardPage = () => {
    const [nodes, setNodes] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/nodes/nodes', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch nodes');

                const data = await response.json();
                setNodes(data);
            } catch (error) {
                setError('Error fetching nodes');
            }
        };

        const extractUsernameFromToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Error no token');
            }
            try {
                const response = await fetch(`http://localhost:5001/api/auth/username/${JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id}`);

                if (!response.ok) throw new Error('User not found');

                const data = await response.json();
                setUsername(data.username);
            } catch (error) {
                setError('User not found');
            }
        };

        fetchNodes();
        extractUsernameFromToken();
    }, []);

    const handleCreateNode = () => {
        navigate('/create');
    };

    const handleSettings = (nodeId) => {
        navigate(`/node/${nodeId}`);
    };

    const handleDelete = (nodeId, nodeName) => {
        const confirmDelete = window.confirm(`Möchten Sie den Node "${nodeName}" wirklich löschen?`);
        if (confirmDelete) {
            deleteNode(nodeId);
        }
    };

    const deleteNode = async (nodeId) => {
        try {
            await fetch(`http://localhost:5001/api/nodes/delete/${nodeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setNodes((prevNodes) => prevNodes.filter((node) => node._id !== nodeId));
        } catch (error) {
            setError('Error deleting node');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="header-container">
                <h1>
                    Hey, {username}
                </h1>
                <button className="logout-button" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                </button>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="servers-container-wrapper">
                <div className="servers-header">
                    <h2>Aktuelle Nodes</h2>
                    <button className="button-85" onClick={handleCreateNode}>Node erstellen</button>
                </div>
                <div className="servers-container">
                    {nodes.length > 0 ? (
                        nodes.map(node => (
                            <div
                                key={node._id}
                                className="server-item"
                                onClick={() => handleSettings(node._id)}
                            >
                                <span className="server-name">{node.name}</span>
                                <div className="icons-container">
                                    <FontAwesomeIcon
                                        icon={faCog}
                                        className="icon-settings"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSettings(node._id);
                                        }}
                                    />
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className="icon-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(node._id, node.name);
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Keine Nodes vorhanden.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
