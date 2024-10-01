import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrashAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './DashboardPage.css';

const DashboardPage = () => {
    const [links, setlinks] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('asc'); // Ascending by default
    const [sortedLinks, setSortedLinks] = useState([...links]); // Copy of links to sort

    const sortByClicks = () => {
        const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        const sorted = [...sortedLinks].sort((a, b) => {
            return newSortOrder === 'asc' ? a.clicks - b.clicks : b.clicks - a.clicks;
        });
        setSortedLinks(sorted);
        setSortOrder(newSortOrder);
    };

    useEffect(() => {
        const fetchlinks = async () => {
            try {
                const response = await fetch('http://localhost:4444/api/links', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch links');

                const data = await response.json();
                setlinks(data);
            } catch (error) {
                setError('Error fetching links');
            }
        };

        const fetchUsername = async () => {
            try {
                const response = await fetch('http://localhost:4444/api/username', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch username');

                const data = await response.json();
                setUsername(data);
            } catch (error) {
                console.log(error)
                setError('Error fetching username');
            }
        };

        fetchlinks();
        fetchUsername();
    }, []);

    // Aktualisiere sortedLinks, wenn sich links ändert
    useEffect(() => {
        setSortedLinks([...links]);
    }, [links]);

    const handleCreateLink = () => {
        navigate('/create');
    };

    const handleDelete = (linkId, linkName) => {
        const confirmDelete = window.confirm(`Do you really want to delete the short link "/${linkName}"?`);
        if (confirmDelete) {
            deleteLink(linkId);
        }
    };

    const deleteLink = async (linkId) => {
        try {
            await fetch(`http://localhost:4444/api/delete/${linkId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            });
            setlinks((prevlinks) => prevlinks.filter((link) => link._id !== linkId));
        } catch (error) {
            setError('Error deleting link');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleStats = (shortLink) => {
        navigate(`/stats/${shortLink}`);
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
            <div className="links-container-wrapper">
                <div className="links-header">
                    <h2>Current Links</h2>
                    <button className="button-85" onClick={handleCreateLink}>Create Link</button>
                </div>
                <div className="links-container">
            {sortedLinks.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Short Link</th>
                            <th>Destination Link</th>
                            <th onClick={sortByClicks} style={{ cursor: 'pointer' }}>
                                Clicks {sortOrder === 'asc' ? '↑' : '↓'}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {sortedLinks.map(link => (
                                    <tr key={link._id}>
                                        <td>{"/" + link.shortLink}</td>
                                        <td>{link.destinationLink}</td>
                                        <td>{link.clicks}</td>
                                        <td>
                                            <FontAwesomeIcon
                                                icon={faCog}
                                                className="icon-settings"
                                                onClick={() => handleStats(link.shortLink)} // Navigiert zur Statistikseite
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrashAlt}
                                                className="icon-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(link._id, link.shortLink);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            ) : (
                <p>No links available.</p>
            )}
        </div>
            </div>
        </div>
    );
};

export default DashboardPage;
