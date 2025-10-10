import React, { useState } from 'react';
import axios from 'axios';

const VolunteerList = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchVolunteers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('http://localhost:8000/api/volunteers/all');
            setVolunteers(response.data.profiles || []);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error fetching volunteers');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: '1000px',
                margin: '40px auto',
                padding: '30px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            <h2
                style={{
                    textAlign: 'center',
                    color: '#1e293b',
                    fontSize: '28px',
                    marginBottom: '10px'
                }}
            >
                👥 Volunteer Details
            </h2>
            <p
                style={{
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '15px',
                    marginBottom: '25px'
                }}
            >
                Check if volunteer profiles exist in the database
            </p>

            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={fetchVolunteers}
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? '#9ae6b4' : '#10b981',
                        color: 'white',
                        padding: '12px 25px',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.3s ease, transform 0.2s ease',
                        boxShadow: '0 5px 15px rgba(16,185,129,0.3)',
                        marginBottom: '30px'
                    }}
                    onMouseEnter={(e) =>
                        !loading && (e.target.style.backgroundColor = '#059669')
                    }
                    onMouseLeave={(e) =>
                        !loading && (e.target.style.backgroundColor = '#10b981')
                    }
                >
                    {loading ? '⏳ Loading...' : '🔍 View Volunteers'}
                </button>
            </div>

            {error && (
                <div
                    style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #fecaca',
                        textAlign: 'center'
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {volunteers.length > 0 && (
                <div>
                    <h3
                        style={{
                            color: '#0f172a',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}
                    >
                        {volunteers.length} Volunteers Found
                    </h3>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px'
                        }}
                    >
                        {volunteers.map((volunteer) => (
                            <div
                                key={volunteer._id}
                                style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    backgroundColor: '#f8fafc',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                    transition: 'transform 0.2s ease',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform = 'translateY(-3px)')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform = 'translateY(0)')
                                }
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <h4
                                            style={{
                                                margin: '0 0 10px 0',
                                                color: '#0f172a',
                                                fontSize: '18px'
                                            }}
                                        >
                                            {volunteer.name}
                                        </h4>
                                        <p style={{ margin: '5px 0', color: '#475569' }}>
                                            <strong>Email:</strong> {volunteer.email}
                                        </p>
                                        <p style={{ margin: '5px 0', color: '#475569' }}>
                                            <strong>Location:</strong>{' '}
                                            {volunteer.location || 'Not specified'}
                                        </p>
                                        <p style={{ margin: '5px 0', color: '#475569' }}>
                                            <strong>CV File:</strong>{' '}
                                            {volunteer.cv_filename || 'Not uploaded'}
                                        </p>
                                        <p style={{ margin: '5px 0', color: '#475569' }}>
                                            <strong>Skills Count:</strong>{' '}
                                            {volunteer.skills?.length || 0}
                                        </p>
                                        <p style={{ margin: '5px 0', color: '#475569' }}>
                                            <strong>Created:</strong>{' '}
                                            {new Date(volunteer.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                        <div
                                            onClick={() => {
                                                navigator.clipboard.writeText(volunteer._id);
                                                alert('Profile ID copied to clipboard!');
                                            }}
                                            style={{
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                padding: '6px 10px',
                                                borderRadius: '20px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                boxShadow: '0 2px 6px rgba(59,130,246,0.25)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#2563eb';
                                                e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#3b82f6';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                            title="Click to copy full Profile ID"
                                        >
                                            📋 Copy ID
                                        </div>
                                        <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                                            {volunteer._id.substring(0, 8)}...
                                        </small>
                                    </div>
                                </div>

                                {volunteer.skills && volunteer.skills.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: '15px',
                                            borderTop: '1px solid #e2e8f0',
                                            paddingTop: '10px'
                                        }}
                                    >
                                        <h5
                                            style={{
                                                margin: '0 0 8px 0',
                                                color: '#0f172a'
                                            }}
                                        >
                                            Skills:
                                        </h5>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '6px'
                                            }}
                                        >
                                            {volunteer.skills.slice(0, 10).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        backgroundColor: '#e0f2fe',
                                                        padding: '6px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '13px',
                                                        color: '#0369a1',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {skill.name} ({skill.level})
                                                </span>
                                            ))}
                                            {volunteer.skills.length > 10 && (
                                                <span
                                                    style={{
                                                        color: '#64748b',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    +{volunteer.skills.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && volunteers.length === 0 && (
                <div
                    style={{
                        backgroundColor: '#fef9c3',
                        color: '#854d0e',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '1px solid #fde68a',
                        textAlign: 'center',
                        marginTop: '20px'
                    }}
                >
                    <h4 style={{ margin: '0 0 5px 0' }}>⚠️ No Volunteers Found</h4>
                    <p style={{ margin: 0 }}>
                        Upload some CVs first to view data here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default VolunteerList;
