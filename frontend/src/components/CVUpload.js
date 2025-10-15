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
    const [tempCoords, setTempCoords] = useState(null);
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
    }, [showLocationPicker]);

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
        <div
            style={{
                maxWidth: '650px',
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
                    marginBottom: '25px',
                    fontSize: '26px'
                }}
            >
                📄 Upload Your CV
            </h2>

            <form onSubmit={handleSubmit}>
                {['name', 'email', 'phone', 'location'].map((field, index) => (
                    <div key={index} style={{ marginBottom: '18px' }}>
                        <label
                            style={{
                                display: 'block',
                                color: '#475569',
                                fontWeight: '600',
                                marginBottom: '6px'
                            }}
                        >
                            {field.charAt(0).toUpperCase() + field.slice(1)}{' '}
                            {field === 'name' || field === 'email' ? '*' : ''}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={
                                    field === 'email'
                                        ? 'email'
                                        : field === 'phone'
                                        ? 'tel'
                                        : 'text'
                                }
                                name={field}
                                value={formData[field]}
                                onChange={handleInputChange}
                                required={field === 'name' || field === 'email'}
                                pattern={field === 'phone' ? '[0-9+\-\s()]\{10,15\}' : undefined}
                                title={field === 'phone' ? 'Please enter a valid phone number (10-15 digits)' : undefined}
                                placeholder={field === 'phone' ? '+1234567890 or 123-456-7890' : undefined}
                                style={{
                                    width: '100%',
                                    padding: field === 'location' ? '10px 64px 10px 12px' : '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = '#3b82f6')
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = '#d1d5db')
                                }
                            />
                            {field === 'location' && (
                                <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                                    <button
                                        type="button"
                                        aria-label="Detect my location"
                                        title="Detect my location"
                                        onClick={handleUseMyLocation}
                                        disabled={locating}
                                        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '6px', padding: '4px 6px', cursor: locating ? 'not-allowed' : 'pointer' }}
                                    >
                                        📶
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Pick location on map"
                                        title="Pick location on map"
                                        onClick={() => { setSearchQuery(formData.location || ''); setShowLocationPicker(true); }}
                                        style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}
                                    >
                                        🗺️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'block',
                            color: '#475569',
                            fontWeight: '600',
                            marginBottom: '10px'
                        }}
                    >
                        Availability *
                    </label>
                    
                    {/* Availability Type Selection */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ marginRight: '15px' }}>
                            <input
                                type="radio"
                                value="weekly"
                                checked={availabilityType === 'weekly'}
                                onChange={(e) => setAvailabilityType(e.target.value)}
                                style={{ marginRight: '5px' }}
                            />
                            Weekly Schedule
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="monthly"
                                checked={availabilityType === 'monthly'}
                                onChange={(e) => setAvailabilityType(e.target.value)}
                                style={{ marginRight: '5px' }}
                            />
                            Monthly Commitment
                        </label>
                    </div>
                    
                    <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {availabilityType === 'weekly' ? (
                            // Weekly Schedule
                            weeklyAvailability.map((day, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={day.available}
                                        onChange={(e) => {
                                            const newAvailability = [...weeklyAvailability];
                                            newAvailability[index].available = e.target.checked;
                                            setWeeklyAvailability(newAvailability);
                                        }}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ minWidth: '80px', fontSize: '14px', fontWeight: '500' }}>{day.day}</span>
                                    {day.available && (
                                        <>
                                            <input
                                                type="time"
                                                value={day.startTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].startTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                                            />
                                            <span style={{ fontSize: '12px' }}>to</span>
                                            <input
                                                type="time"
                                                value={day.endTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].endTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                style={{ padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                                            />
                                        </>
                                    )}
                                </div>
                            ))
                        ) : (
                            // Monthly Commitment
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Hours per week:</label>
                                    <select
                                        value={monthlyAvailability.hoursPerWeek}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, hoursPerWeek: parseInt(e.target.value)})}
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                                    >
                                        <option value={5}>5 hours/week</option>
                                        <option value={10}>10 hours/week</option>
                                        <option value={15}>15 hours/week</option>
                                        <option value={20}>20 hours/week</option>
                                        <option value={25}>25+ hours/week</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Preferred days:</label>
                                    <select
                                        value={monthlyAvailability.preferredDays}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, preferredDays: e.target.value})}
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                                    >
                                        <option value="weekdays">Weekdays</option>
                                        <option value="weekends">Weekends</option>
                                        <option value="flexible">Flexible</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Time preference:</label>
                                    <select
                                        value={monthlyAvailability.timePreference}
                                        onChange={(e) => setMonthlyAvailability({...monthlyAvailability, timePreference: e.target.value})}
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
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

                <div style={{ marginBottom: '20px' }}>
                    <label
                        style={{
                            display: 'block',
                            color: '#475569',
                            fontWeight: '600',
                            marginBottom: '6px'
                        }}
                    >
                        CV File (PDF, DOCX, TXT) *
                    </label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px dashed #93c5fd',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                        color: 'white',
                        padding: '12px 0',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.3s ease',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
                    }}
                    onMouseEnter={(e) =>
                        !loading && (e.target.style.backgroundColor = '#2563eb')
                    }
                    onMouseLeave={(e) =>
                        !loading && (e.target.style.backgroundColor = '#3b82f6')
                    }
                >
                    {loading ? 'Processing...' : '🚀 Upload CV'}
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
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '20px',
                        border: '1px solid #fecaca',
                        textAlign: 'center'
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {result && (
                <div
                    style={{
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        padding: '20px',
                        borderRadius: '12px',
                        marginTop: '25px',
                        border: '1px solid #a7f3d0',
                        boxShadow: 'inset 0 0 10px rgba(16,185,129,0.1)'
                    }}
                >
                    <h3
                        style={{
                            marginTop: 0,
                            marginBottom: '10px',
                            textAlign: 'center'
                        }}
                    >
                        ✅ CV Processed Successfully!
                    </h3>

                    <div
                        style={{
                            backgroundColor: '#d1fae5',
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '15px',
                            textAlign: 'center',
                            border: '1px solid #6ee7b7'
                        }}
                    >
                        <h4
                            style={{
                                margin: 0,
                                color: '#064e3b',
                                fontWeight: '600'
                            }}
                        >
                            Your Unique Profile ID:
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    color: '#065f46'
                                }}
                            >
                                {result.profile_id}
                            </p>
                            <button
                                type="button"
                                onClick={async () => { try { await navigator.clipboard.writeText(String(result.profile_id || '')); } catch {} }}
                                style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                title="Copy ID"
                                aria-label="Copy profile ID"
                            >
                                Copy
                            </button>
                        </div>
                        <small style={{ color: '#16a34a' }}>
                            Save this ID to find job matches later!
                        </small>
                    </div>

                    <p>
                        <strong>Message:</strong> {result.message}
                    </p>

                    {result.extracted_skills &&
                        result.extracted_skills.length > 0 && (
                            <div>
                                <h4>Extracted Skills:</h4>
                                <ul
                                    style={{
                                        columns: 2,
                                        listStyle: 'none',
                                        paddingLeft: 0,
                                        color: '#064e3b'
                                    }}
                                >
                                    {result.extracted_skills.map(
                                        (skill, index) => (
                                            <li
                                                key={index}
                                                style={{
                                                    background: '#d1fae5',
                                                    padding: '6px 10px',
                                                    margin: '4px',
                                                    borderRadius: '6px',
                                                    display: 'inline-block'
                                                }}
                                            >
                                                {skill}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default CVUpload;
