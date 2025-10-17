import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const CVUpload = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [locating, setLocating] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [, setTempCoords] = useState(null);
    const [tempAddress, setTempAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [availabilityType, setAvailabilityType] = useState('weekly');
    const [weeklyAvailability, setWeeklyAvailability] = useState([
        { day: 'Monday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', available: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Sunday', available: false, startTime: '09:00', endTime: '17:00' }
    ]);
    const [monthlyAvailability, setMonthlyAvailability] = useState({
        hoursPerWeek: 10,
        preferredDays: 'weekends',
        timePreference: 'flexible'
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const placeOrMoveMarker = (L, lat, lng) => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else if (mapInstanceRef.current) {
            markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 13);
        }
    };

    const reverseGeocode = async (lat, lon) => {
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
                { headers: { Accept: 'application/json' } }
            );
            const data = await resp.json();
            const address = data.address || {};
            const locality = address.city || address.town || address.village || address.hamlet;
            const state = address.state;
            const country = address.country;
            const display = [locality, state, country].filter(Boolean).join(', ') || data.display_name || `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
            setTempAddress(display);
            return display;
        } catch {
            const fallback = `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
            setTempAddress(fallback);
            return fallback;
        }
    };

    const forwardGeocode = async (query) => {
        try {
            const q = (query || '').trim();
            if (!q) return;
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
                { headers: { Accept: 'application/json' } }
            );
            const results = await resp.json();
            if (Array.isArray(results) && results.length > 0) {
                // eslint-disable-next-line no-undef
                const L = window.L;
                const r = results[0];
                const lat = parseFloat(r.lat);
                const lon = parseFloat(r.lon);
                setTempCoords({ lat, lon });
                placeOrMoveMarker(L, lat, lon);
                setTempAddress(r.display_name);
            }
        } catch {
            // ignore
        }
    };

    const handleUseMyLocation = async () => {
        try {
            setError(null);
            setLocating(true);

            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser');
                return;
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });

            const { latitude, longitude } = position.coords;

            if (showLocationPicker) {
                // eslint-disable-next-line no-undef
                const L = window.L;
                setTempCoords({ lat: latitude, lon: longitude });
                placeOrMoveMarker(L, latitude, longitude);
                await reverseGeocode(latitude, longitude);
            } else {
                const display = await reverseGeocode(latitude, longitude);
                setFormData({ ...formData, location: display });
            }
        } catch (err) {
            const message = err?.message || 'Unable to fetch your location';
            setError(message);
        } finally {
            setLocating(false);
        }
    };

    useEffect(() => {
        if (!showLocationPicker) return;

        const ensureLeafletLoaded = async () => {
            const leafletCssId = 'leaflet-css-cdn';
            const leafletJsId = 'leaflet-js-cdn';

            if (!document.getElementById(leafletCssId)) {
                const link = document.createElement('link');
                link.id = leafletCssId;
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (!document.getElementById(leafletJsId)) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.id = leafletJsId;
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.async = true;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }
        };

        const initMap = async () => {
            try {
                await ensureLeafletLoaded();
                // eslint-disable-next-line no-undef
                const L = window.L;
                if (!mapRef.current) return;

                if (!mapInstanceRef.current) {
                    mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }).addTo(mapInstanceRef.current);

                    mapInstanceRef.current.on('click', async (e) => {
                        const { lat, lng } = e.latlng;
                        setTempCoords({ lat, lon: lng });
                        placeOrMoveMarker(L, lat, lng);
                        await reverseGeocode(lat, lng);
                    });
                }

                if (formData.location) {
                    await forwardGeocode(formData.location);
                }
            } catch (err) {
                setError('Failed to load map library');
            }
        };

        initMap();
    }, [showLocationPicker, formData.location, forwardGeocode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a CV file');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('name', formData.name);
            uploadData.append('email', formData.email);
            uploadData.append('phone', formData.phone);
            uploadData.append('location', formData.location);
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('Upload user:', user);
            if (!user.username) {
                setError('Please login to upload CV');
                return;
            }
            uploadData.append('uploaded_by', user.username);
            console.log('Uploading with user:', user.username);
            
            // Add availability data
            let availabilityData;
            if (availabilityType === 'weekly') {
                availabilityData = {
                    type: 'weekly',
                    schedule: weeklyAvailability
                        .filter(day => day.available)
                        .map((day, index) => ({
                            day_of_week: weeklyAvailability.indexOf(day),
                            start_time: day.startTime,
                            end_time: day.endTime,
                            status: 'available'
                        }))
                };
            } else {
                availabilityData = {
                    type: 'monthly',
                    hoursPerWeek: monthlyAvailability.hoursPerWeek,
                    preferredDays: monthlyAvailability.preferredDays,
                    timePreference: monthlyAvailability.timePreference
                };
            }
            uploadData.append('availability', JSON.stringify(availabilityData));

            const response = await axios.post(
                'http://localhost:8000/api/volunteers/upload-cv',
                uploadData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error uploading CV');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-10px); }
                        60% { transform: translateY(-5px); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}
            </style>
            <div
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    padding: '20px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
            >
            <div
                style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                            borderRadius: '20px',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                        }}
                    >
                        📄
                    </div>
                    <h1
                        style={{
                    color: '#1e293b',
                            marginBottom: '8px',
                            fontSize: '32px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        Upload Your CV
                    </h1>
                    <p
                        style={{
                            color: '#64748b',
                            fontSize: '16px',
                            margin: '0',
                            fontWeight: '400'
                        }}
                    >
                        Create your professional profile and discover amazing volunteer opportunities
                    </p>
                </div>

            <form onSubmit={handleSubmit}>
                {/* Personal Information Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                        color: '#1e293b', 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '14px'
                        }}>👤</span>
                        Personal Information
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {['name', 'email'].map((field, index) => (
                            <div key={index}>
                        <label
                            style={{
                                display: 'block',
                                        color: '#374151',
                                fontWeight: '600',
                                        marginBottom: '8px',
                                        fontSize: '14px'
                            }}
                        >
                                    {field.charAt(0).toUpperCase() + field.slice(1)} *
                        </label>
                            <input
                                    type={field === 'email' ? 'email' : 'text'}
                                name={field}
                                value={formData[field]}
                                onChange={handleInputChange}
                                    required
                                    placeholder={field === 'email' ? 'your.email@example.com' : 'Your full name'}
                                style={{
                                    width: '100%',
                                        padding: '14px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                    fontSize: '15px',
                                    outline: 'none',
                                        transition: 'all 0.3s ease',
                                        background: '#fafafa',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.background = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = '#fafafa';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    color: '#374151',
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    fontSize: '14px'
                                }}
                            >
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                pattern="[0-9+\\-\\s()]{10,15}"
                                title="Please enter a valid phone number (10-15 digits)"
                                placeholder="+1234567890 or 123-456-7890"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    background: '#fafafa',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.background = '#fafafa';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    color: '#374151',
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    fontSize: '14px'
                                }}
                            >
                                Location
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="City, State, Country"
                                    style={{
                                        width: '100%',
                                        padding: '14px 80px 14px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'all 0.3s ease',
                                        background: '#fafafa',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.background = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = '#fafafa';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <div style={{ 
                                    position: 'absolute', 
                                    right: '8px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    display: 'flex', 
                                    gap: '6px' 
                                }}>
                                    <button
                                        type="button"
                                        aria-label="Detect my location"
                                        title="Detect my location"
                                        onClick={handleUseMyLocation}
                                        disabled={locating}
                                        style={{ 
                                            background: locating ? '#f3f4f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            color: locating ? '#9ca3af' : '#ffffff',
                                            borderRadius: '8px',
                                            padding: '8px 10px',
                                            cursor: locating ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.2s ease',
                                            boxShadow: locating ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.3)'
                                        }}
                                    >
                                        📶
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Pick location on map"
                                        title="Pick location on map"
                                        onClick={() => { setSearchQuery(formData.location || ''); setShowLocationPicker(true); }}
                                        style={{ 
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        🗺️
                                    </button>
                                </div>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Availability Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                        color: '#1e293b', 
                        fontSize: '18px', 
                            fontWeight: '600',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '14px'
                        }}>⏰</span>
                        Availability *
                    </h3>
                    
                    {/* Availability Type Selection */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        marginBottom: '20px',
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: availabilityType === 'weekly' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: availabilityType === 'weekly' ? '#ffffff' : '#374151',
                            transition: 'all 0.2s ease',
                            fontWeight: '500'
                        }}>
                            <input
                                type="radio"
                                value="weekly"
                                checked={availabilityType === 'weekly'}
                                onChange={(e) => setAvailabilityType(e.target.value)}
                                style={{ margin: '0' }}
                            />
                            📅 Weekly Schedule
                        </label>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: availabilityType === 'monthly' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: availabilityType === 'monthly' ? '#ffffff' : '#374151',
                            transition: 'all 0.2s ease',
                            fontWeight: '500'
                        }}>
                            <input
                                type="radio"
                                value="monthly"
                                checked={availabilityType === 'monthly'}
                                onChange={(e) => setAvailabilityType(e.target.value)}
                                style={{ margin: '0' }}
                            />
                            📊 Monthly Commitment
                        </label>
                    </div>
                    
                    <div style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        border: '2px solid #e2e8f0',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}>
                        {availabilityType === 'weekly' ? (
                            // Weekly Schedule
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {weeklyAvailability.map((day, index) => (
                                    <div key={index} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        padding: '12px',
                                        background: day.available ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#ffffff',
                                        borderRadius: '10px',
                                        border: day.available ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                        transition: 'all 0.2s ease'
                                    }}>
                                    <input
                                        type="checkbox"
                                        checked={day.available}
                                        onChange={(e) => {
                                            const newAvailability = [...weeklyAvailability];
                                            newAvailability[index].available = e.target.checked;
                                            setWeeklyAvailability(newAvailability);
                                        }}
                                            style={{ 
                                                width: '18px', 
                                                height: '18px',
                                                accentColor: '#3b82f6'
                                            }}
                                        />
                                        <span style={{ 
                                            minWidth: '90px', 
                                            fontSize: '14px', 
                                            fontWeight: '600',
                                            color: day.available ? '#1e40af' : '#374151'
                                        }}>
                                            {day.day}
                                        </span>
                                    {day.available && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <input
                                                type="time"
                                                value={day.startTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].startTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                    style={{ 
                                                        padding: '6px 8px', 
                                                        border: '1px solid #d1d5db', 
                                                        borderRadius: '6px', 
                                                        fontSize: '13px',
                                                        background: '#ffffff'
                                                    }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>to</span>
                                            <input
                                                type="time"
                                                value={day.endTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].endTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                    style={{ 
                                                        padding: '6px 8px', 
                                                        border: '1px solid #d1d5db', 
                                                        borderRadius: '6px', 
                                                        fontSize: '13px',
                                                        background: '#ffffff'
                                                    }}
                                                />
                                            </div>
                                    )}
                                </div>
                                ))}
                            </div>
                        ) : (
                            // Monthly Commitment
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: '#374151'
                                    }}>
                                        Hours per week:
                                    </label>
                                    <select
                                        value={monthlyAvailability.hoursPerWeek}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, hoursPerWeek: parseInt(e.target.value)})}
                                        style={{ 
                                            padding: '12px 16px', 
                                            border: '2px solid #e5e7eb', 
                                            borderRadius: '10px', 
                                            width: '100%',
                                            background: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <option value={5}>5 hours/week</option>
                                        <option value={10}>10 hours/week</option>
                                        <option value={15}>15 hours/week</option>
                                        <option value={20}>20 hours/week</option>
                                        <option value={25}>25+ hours/week</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: '#374151'
                                    }}>
                                        Preferred days:
                                    </label>
                                    <select
                                        value={monthlyAvailability.preferredDays}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, preferredDays: e.target.value})}
                                        style={{ 
                                            padding: '12px 16px', 
                                            border: '2px solid #e5e7eb', 
                                            borderRadius: '10px', 
                                            width: '100%',
                                            background: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <option value="weekdays">Weekdays</option>
                                        <option value="weekends">Weekends</option>
                                        <option value="flexible">Flexible</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '8px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: '#374151'
                                    }}>
                                        Time preference:
                                    </label>
                                    <select
                                        value={monthlyAvailability.timePreference}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, timePreference: e.target.value})}
                                        style={{ 
                                            padding: '12px 16px', 
                                            border: '2px solid #e5e7eb', 
                                            borderRadius: '10px', 
                                            width: '100%',
                                            background: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <option value="morning">Morning (9AM-12PM)</option>
                                        <option value="afternoon">Afternoon (12PM-5PM)</option>
                                        <option value="evening">Evening (5PM-8PM)</option>
                                        <option value="flexible">Flexible</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CV Upload Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ 
                        color: '#1e293b', 
                        fontSize: '18px', 
                            fontWeight: '600',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '14px'
                        }}>📁</span>
                        CV File Upload *
                    </h3>
                    
                    <div style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '16px',
                        padding: '30px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                    }}
                    onDragLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                    }}
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    >
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px'
                        }}>
                            📄
                        </div>
                        <h4 style={{
                            color: '#1e40af',
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            {file ? file.name : 'Choose your CV file'}
                        </h4>
                        <p style={{
                            color: '#64748b',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            Drag and drop your CV here, or click to browse
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            {['PDF', 'DOCX', 'TXT'].map(format => (
                                <span key={format} style={{
                                    background: '#3b82f6',
                                    color: '#ffffff',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    {format}
                                </span>
                            ))}
                        </div>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt"
                        required
                        style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            width: '100%',
                                height: '100%',
                                opacity: 0,
                            cursor: 'pointer'
                        }}
                    />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        background: loading 
                            ? 'linear-gradient(135deg, #93c5fd 0%, #7c3aed 100%)' 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '16px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: loading 
                            ? '0 4px 12px rgba(147, 197, 253, 0.3)' 
                            : '0 8px 25px rgba(102, 126, 234, 0.4)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                        }
                    }}
                >
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #ffffff',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            Processing Your CV...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            🚀 Upload CV & Create Profile
                        </div>
                    )}
                </button>
            </form>

            {showLocationPicker && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowLocationPicker(false)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            width: 'min(92vw, 720px)',
                            maxHeight: '85vh',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search location (city, address)"
                                style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                            />
                            <button
                                type="button"
                                onClick={() => forwardGeocode(searchQuery)}
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={locating}
                                style={{ background: locating ? '#93c5fd' : '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px', cursor: locating ? 'not-allowed' : 'pointer' }}
                            >
                                {locating ? 'Detecting…' : 'Use my location'}
                            </button>
                        </div>
                        <div style={{ height: '420px' }}>
                            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ color: '#475569', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tempAddress ? `Selected: ${tempAddress}` : 'Click on the map to select a location'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowLocationPicker(false)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>Cancel</button>
                                <button type="button" onClick={() => { if (tempAddress) { setFormData({ ...formData, location: tempAddress }); } setShowLocationPicker(false); }} disabled={!tempAddress} style={{ background: !tempAddress ? '#93c5fd' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: !tempAddress ? 'not-allowed' : 'pointer' }}>Set</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div
                    style={{
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: '#991b1b',
                        padding: '20px',
                        borderRadius: '16px',
                        marginTop: '30px',
                        border: '2px solid #f87171',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                    }}
                >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Upload Failed</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>{error}</p>
                </div>
            )}

            {result && (
                <div
                    style={{
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        color: '#065f46',
                        padding: '30px',
                        borderRadius: '20px',
                        marginTop: '30px',
                        border: '2px solid #10b981',
                        boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Success Animation Background */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-50%',
                        width: '200%',
                        height: '200%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{ 
                                fontSize: '48px', 
                                marginBottom: '12px',
                                animation: 'bounce 1s ease-in-out'
                            }}>
                                ✅
                            </div>
                    <h3
                        style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#064e3b'
                                }}
                            >
                                CV Processed Successfully!
                    </h3>
                            <p style={{ 
                                margin: '0', 
                                color: '#047857', 
                                fontSize: '16px',
                                fontWeight: '500'
                            }}>
                                Your profile has been created and is ready for job matching
                            </p>
                        </div>

                    <div
                        style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                                padding: '20px',
                                borderRadius: '16px',
                                marginBottom: '20px',
                            textAlign: 'center',
                                border: '2px solid #22c55e',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
                        }}
                    >
                        <h4
                            style={{
                                    margin: '0 0 12px 0',
                                color: '#064e3b',
                                    fontWeight: '600',
                                    fontSize: '16px'
                            }}
                        >
                            Your Unique Profile ID:
                        </h4>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '12px', 
                                marginBottom: '8px',
                                flexWrap: 'wrap'
                            }}>
                                <div
                                style={{
                                        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                                        color: '#ffffff',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        fontSize: '18px',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                        letterSpacing: '1px',
                                        boxShadow: '0 2px 8px rgba(6, 95, 70, 0.3)'
                                }}
                            >
                                {result.profile_id}
                                </div>
                            <button
                                type="button"
                                    onClick={async (e) => { 
                                        try { 
                                            await navigator.clipboard.writeText(String(result.profile_id || '')); 
                                            // Show temporary feedback
                                            const btn = e.target;
                                            const originalText = btn.textContent;
                                            btn.textContent = 'Copied!';
                                            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                            setTimeout(() => {
                                                btn.textContent = originalText;
                                                btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                                            }, 2000);
                                        } catch {} 
                                    }}
                                    style={{ 
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                    }}
                                title="Copy ID"
                                aria-label="Copy profile ID"
                            >
                                    📋 Copy
                            </button>
                        </div>
                            <small style={{ 
                                color: '#16a34a',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}>
                                💡 Save this ID to find job matches later!
                        </small>
                    </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ 
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                color: '#047857'
                            }}>
                                <strong>Status:</strong> {result.message}
                            </p>
                        </div>

                    {result.extracted_skills &&
                        result.extracted_skills.length > 0 && (
                            <div>
                                    <h4 style={{ 
                                        margin: '0 0 16px 0',
                                        color: '#064e3b',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        textAlign: 'center'
                                    }}>
                                        🎯 AI-Detected Skills
                                    </h4>
                                    <div
                                    style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                            justifyContent: 'center'
                                    }}
                                >
                                    {result.extracted_skills.map(
                                        (skill, index) => (
                                                <span
                                                key={index}
                                                style={{
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        color: '#ffffff',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                                        transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {skill}
                                                </span>
                                        )
                                    )}
                                    </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </div>
        </>
    );
};

export default CVUpload;
