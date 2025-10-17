import React, { useState } from 'react';
import axios from 'axios';
import PageShell from './PageShell';

const VolunteerList = () => {
    const [volunteers, setVolunteers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);

    const fetchVolunteers = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Fetch user:', user);
            const params = new URLSearchParams();
            if (user.role) params.append('user_role', user.role);
            if (user.username) params.append('username', user.username);
            
            console.log('API URL:', `http://localhost:8000/api/volunteers/all?${params}`);
            const response = await axios.get(`http://localhost:8000/api/volunteers/all?${params}`);
            console.log('API Response:', response.data);
            setVolunteers(response.data.profiles || []);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error fetching volunteers');
        } finally {
            setLoading(false);
        }
    };

    const deleteVolunteer = async (volunteerId) => {
        if (!window.confirm('Are you sure you want to delete this volunteer profile?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8000/api/volunteers/${volunteerId}`);
            setVolunteers(volunteers.filter(v => v.volunteer_id !== volunteerId));
            alert('Volunteer deleted successfully!');
        } catch (err) {
            alert(err.response?.data?.detail || 'Error deleting volunteer');
        }
    };

    return (
        <PageShell icon="📋" title="CV Uploads" subtitle={JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' ? 'View all CV uploads from users' : 'View your CV uploads'}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            

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
                    {loading ? '⏳ Loading...' : (JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' ? '🔍 View All CVs' : '🔍 View My CVs')}
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

            {volunteers && volunteers.length > 0 && (
                <div>
                    <h3
                        style={{
                            color: '#0f172a',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}
                    >
                        {volunteers.length} CV{volunteers.length !== 1 ? 's' : ''} Found
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
                                onClick={() => setSelectedVolunteer(volunteer)}
                                style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    backgroundColor: '#f8fafc',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = '#3b82f6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
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
                                        {volunteer.uploaded_by && (
                                            <p style={{ margin: '5px 0', color: '#475569' }}>
                                                <strong>Uploaded by:</strong> {volunteer.uploaded_by}
                                            </p>
                                        )}
                                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
                                            Click to view full details →
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(volunteer.volunteer_id || volunteer._id);
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
                                                transition: 'all 0.2s ease',
                                                marginBottom: '8px'
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
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteVolunteer(volunteer.volunteer_id || volunteer._id);
                                            }}
                                            style={{
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                padding: '6px 10px',
                                                borderRadius: '20px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                boxShadow: '0 2px 6px rgba(239,68,68,0.25)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#dc2626';
                                                e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#ef4444';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                            title="Delete volunteer profile"
                                        >
                                            🗑️ Delete
                                        </div>
                                        <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                                            {volunteer.volunteer_id || volunteer._id.substring(0, 8) + '...'}
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

            {!loading && volunteers && volunteers.length === 0 && (
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
                    <h4 style={{ margin: '0 0 5px 0' }}>⚠️ No CVs Found</h4>
                    <p style={{ margin: 0 }}>
                        {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' 
                            ? 'No CV uploads found in the system.' 
                            : 'You haven\'t uploaded any CVs yet.'}
                    </p>
                </div>
            )}

            {/* Volunteer Details Modal */}
            {selectedVolunteer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
                                {selectedVolunteer.name}
                            </h2>
                            <button
                                onClick={() => setSelectedVolunteer(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    padding: '4px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Contact Information</h3>
                                    <div style={{ space: '8px' }}>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>Email:</strong> {selectedVolunteer.email}</p>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>Phone:</strong> {selectedVolunteer.phone || 'Not provided'}</p>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>Location:</strong> {selectedVolunteer.location || 'Not specified'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Profile Information</h3>
                                    <div>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>Profile ID:</strong> {selectedVolunteer.volunteer_id || selectedVolunteer._id}</p>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>CV File:</strong> {selectedVolunteer.cv_filename || 'Not uploaded'}</p>
                                        <p style={{ margin: '8px 0', color: '#475569' }}><strong>Created:</strong> {new Date(selectedVolunteer.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedVolunteer.experience_summary && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Experience Summary</h3>
                                    <p style={{ color: '#475569', lineHeight: '1.6' }}>{selectedVolunteer.experience_summary}</p>
                                </div>
                            )}
                            
                            {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Skills ({selectedVolunteer.skills.length})</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedVolunteer.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    backgroundColor: '#e0f2fe',
                                                    padding: '8px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
                                                    color: '#0369a1',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {skill.name} ({skill.level})
                                                {skill.years_experience && ` - ${skill.years_experience} years`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {selectedVolunteer.interests && selectedVolunteer.interests.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Interests</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedVolunteer.interests.map((interest, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    backgroundColor: '#f0fdf4',
                                                    padding: '6px 12px',
                                                    borderRadius: '16px',
                                                    fontSize: '14px',
                                                    color: '#166534',
                                                    border: '1px solid #bbf7d0'
                                                }}
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {selectedVolunteer.availability && selectedVolunteer.availability.length > 0 && (
                                <div>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>Availability</h3>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {selectedVolunteer.availability.map((slot, idx) => {
                                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                            return (
                                                <div key={idx} style={{
                                                    padding: '12px',
                                                    backgroundColor: slot.status === 'available' ? '#f0fdf4' : '#fef3c7',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${slot.status === 'available' ? '#bbf7d0' : '#fde68a'}`
                                                }}>
                                                    <span style={{ fontWeight: '500' }}>{days[slot.day_of_week]}:</span> {slot.start_time} - {slot.end_time} ({slot.status})
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </PageShell>
    );
};

export default VolunteerList;
