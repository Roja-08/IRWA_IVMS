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
    const [filePreview, setFilePreview] = useState(null);
    const canvasRef = useRef(null);

    // Animated background effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 120 + 80;
                this.color = `hsla(${210 + Math.random() * 30}, 60%, ${50 + Math.random() * 10}%, ${0.03 + Math.random() * 0.02})`;
                this.originalSize = this.size;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < -this.size || this.x > canvas.width + this.size || 
                    this.y < -this.size || this.y > canvas.height + this.size) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size
                );
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const particles = Array.from({ length: 12 }, () => new Particle());

        const animate = () => {
            ctx.fillStyle = 'rgb(248, 250, 252)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        
        if (selectedFile) {
            setFilePreview({
                name: selectedFile.name,
                size: (selectedFile.size / 1024 / 1024).toFixed(2),
                type: selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'
            });
        } else {
            setFilePreview(null);
        }
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
                const L = window.L;
                setTempCoords({ lat: latitude, lon: longitude });
                placeOrMoveMarker(L, latitude, longitude);
                await reverseGeocode(latitude, longitude);
            } else {
                const display = await reverseGeocode(latitude, longitude);
                setFormData({ ...formData, location: display });
            }
        } catch (err) {
            setError(err?.message || 'Unable to fetch your location');
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
    }, [showLocationPicker, formData.location]);

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
            if (!user.username) {
                setError('Please login to upload CV');
                return;
            }
            uploadData.append('uploaded_by', user.username);
            
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
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Animated smoke background */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            {/* Main content */}
            <div className="relative z-10 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Professional Profile Submission
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Upload your CV to join our network of professionals and discover meaningful opportunities
                        </p>
                    </div>

                    {/* Main form card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Personal Information Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['name', 'email', 'phone', 'location'].map((field, index) => (
                                        <div 
                                            key={field}
                                            className={`transform transition-all duration-300 ${
                                                field === 'name' || field === 'email' ? 'lg:col-span-2' : ''
                                            }`}
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                {field.charAt(0).toUpperCase() + field.slice(1)}
                                                {(field === 'name' || field === 'email') && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                        </label>
                                            <div className="relative">
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
                                                    pattern={field === 'phone' ? '[0-9+\-\\s()]{10,15}' : undefined}
                                title={field === 'phone' ? 'Please enter a valid phone number (10-15 digits)' : undefined}
                                                    placeholder={
                                                        field === 'name' ? 'John Doe' :
                                                        field === 'email' ? 'john.doe@example.com' :
                                                        field === 'phone' ? '+1 (555) 123-4567' :
                                                        'City, State, Country'
                                                    }
                                                    className="w-full px-4 py-3.5 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-400"
                            />
                            {field === 'location' && (
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleUseMyLocation}
                                        disabled={locating}
                                                            className="p-2 bg-gray-100 hover:bg-blue-50 border border-gray-200 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50"
                                                            title="Use current location"
                                                        >
                                                            {locating ? (
                                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            )}
                                    </button>
                                    <button
                                        type="button"
                                                            onClick={() => { setSearchQuery(formData.location || ''); setShowLocationPicker(true); }}
                                                            className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-300 hover:scale-110"
                                        title="Pick location on map"
                                    >
                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                            </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                                </div>

                                {/* Availability Section */}
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Availability Preferences</h3>
                                            <p className="text-sm text-gray-600">Tell us about your preferred working schedule</p>
                                        </div>
                                    </div>

                                    {/* Availability Type Toggle */}
                                    <div className="flex gap-4 mb-6">
                                        {[
                                            { value: 'weekly', label: 'Weekly Schedule', icon: '📅' },
                                            { value: 'monthly', label: 'Monthly Commitment', icon: '⏱️' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setAvailabilityType(option.value)}
                                                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                                                    availabilityType === option.value 
                                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="text-xl">{option.icon}</span>
                                                <span className="font-medium text-gray-800">{option.label}</span>
                                            </button>
                                        ))}
                    </div>
                    
                                    {/* Availability Content */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        {availabilityType === 'weekly' ? (
                                            <div className="space-y-4">
                                                {weeklyAvailability.map((day, index) => (
                                                    <div key={day.day} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors duration-300">
                                                        <label className="flex items-center gap-4 flex-1 cursor-pointer">
                                                            <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={day.available}
                                        onChange={(e) => {
                                            const newAvailability = [...weeklyAvailability];
                                            newAvailability[index].available = e.target.checked;
                                            setWeeklyAvailability(newAvailability);
                                        }}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-300 ${
                                                                    day.available 
                                                                        ? 'bg-blue-500 border-blue-500' 
                                                                        : 'border-gray-300'
                                                                }`}>
                                                                    {day.available && (
                                                                        <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-700 min-w-[100px]">{day.day}</span>
                                                        </label>
                                    {day.available && (
                                                            <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="time"
                                                value={day.startTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].startTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                                            />
                                                                <span className="text-gray-500 text-sm">to</span>
                                            <input
                                                type="time"
                                                value={day.endTime}
                                                onChange={(e) => {
                                                    const newAvailability = [...weeklyAvailability];
                                                    newAvailability[index].endTime = e.target.value;
                                                    setWeeklyAvailability(newAvailability);
                                                }}
                                                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                                            />
                                                            </div>
                                    )}
                                </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    {
                                                        label: 'Hours Per Week',
                                                        value: monthlyAvailability.hoursPerWeek,
                                                        options: [5, 10, 15, 20, 25],
                                                        icon: '⏰'
                                                    },
                                                    {
                                                        label: 'Preferred Days',
                                                        value: monthlyAvailability.preferredDays,
                                                        options: ['weekdays', 'weekends', 'flexible'],
                                                        icon: '📅'
                                                    },
                                                    {
                                                        label: 'Time Preference',
                                                        value: monthlyAvailability.timePreference,
                                                        options: ['morning', 'afternoon', 'evening', 'flexible'],
                                                        icon: '🌅'
                                                    }
                                                ].map((field, index) => (
                                                    <div key={field.label}>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                                            <span className="mr-2">{field.icon}</span>
                                                            {field.label}
                                                        </label>
                                    <select
                                                            value={field.value}
                                                            onChange={(e) => {
                                                                const newAvailability = {...monthlyAvailability};
                                                                newAvailability[field.label.toLowerCase().includes('hours') ? 'hoursPerWeek' : 
                                                                field.label.toLowerCase().includes('days') ? 'preferredDays' : 'timePreference'] = 
                                                                field.label.toLowerCase().includes('hours') ? parseInt(e.target.value) : e.target.value;
                                                                setMonthlyAvailability(newAvailability);
                                                            }}
                                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                                                        >
                                                            {field.options.map(option => (
                                                                <option key={option} value={option}>
                                                                    {typeof option === 'number' ? `${option} hours` : 
                                                                     option.charAt(0).toUpperCase() + option.slice(1)}
                                                                </option>
                                                            ))}
                                    </select>
                                </div>
                                                ))}
                            </div>
                        )}
                    </div>
                </div>

                                {/* File Upload Section */}
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Curriculum Vitae</h3>
                                            <p className="text-sm text-gray-600">Upload your professional CV document</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt"
                        required
                                                className="hidden"
                                            />
                                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/20 group">
                                                <div className="text-3xl mb-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-300">📄</div>
                                                <div className="text-gray-700 font-medium mb-2">
                                                    {filePreview ? filePreview.name : 'Click to upload your CV'}
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    {filePreview ? `${filePreview.size} MB • ${filePreview.type}` : 'Supported formats: PDF, DOCX, TXT (Max 10MB)'}
                                                </div>
                                            </div>
                                        </label>
                                        
                                        {filePreview && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-green-800">Document Ready</div>
                                                        <div className="text-sm text-green-600">{filePreview.name}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFile(null);
                                                            setFilePreview(null);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors duration-300 p-1"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                </div>

                                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-500 transform ${
                                        loading 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl active:scale-95'
                                    } relative overflow-hidden group`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Processing Your Submission...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span>Submit Professional Profile</span>
                                            </>
                                        )}
                                    </div>
                                    {!loading && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    )}
                </button>
            </form>

                            {/* Location Picker Modal */}
            {showLocationPicker && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scaleIn">
                                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div className="flex gap-3">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search for a location..."
                                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    onKeyPress={(e) => e.key === 'Enter' && forwardGeocode(searchQuery)}
                            />
                            <button
                                type="button"
                                onClick={() => forwardGeocode(searchQuery)}
                                                    className="px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-300"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={locating}
                                                    className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:bg-gray-100 transition-colors duration-300 flex items-center gap-2"
                                                >
                                                    {locating ? (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                    My Location
                            </button>
                        </div>
                                        </div>
                                        <div className="h-96">
                                            <div ref={mapRef} className="w-full h-full" />
                                        </div>
                                        <div className="p-6 border-t border-gray-200 bg-white">
                                            <div className="flex items-center justify-between">
                                                <div className="text-gray-700">
                                                    {tempAddress ? (
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-500">Selected Location</div>
                                                            <div className="text-blue-600 font-medium">{tempAddress}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500">Click on the map to select a location</div>
                                                    )}
                        </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowLocationPicker(false)}
                                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300 font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { 
                                                            if (tempAddress) { 
                                                                setFormData({ ...formData, location: tempAddress }); 
                                                            } 
                                                            setShowLocationPicker(false); 
                                                        }} 
                                                        disabled={!tempAddress}
                                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                                                    >
                                                        Confirm Location
                                                    </button>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                            {/* Error Message */}
            {error && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fadeIn">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium">Submission Error</div>
                                            <div>{error}</div>
                                        </div>
                                    </div>
                </div>
            )}

                            {/* Success Result */}
            {result && (
                                <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-8 animate-fadeIn">
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                            Profile Successfully Created
                    </h3>
                                        <p className="text-gray-600 text-lg">
                                            Your professional profile has been processed and added to our network
                                        </p>
                                    </div>

                                    {/* Profile ID Card */}
                                    <div className="bg-white rounded-xl p-6 border border-green-200 mb-6 shadow-sm">
                                        <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                                                Your Professional Profile ID
                                            </div>
                                            <div className="flex items-center justify-center gap-4 mb-4">
                                                <code className="text-2xl font-bold text-gray-900 font-mono bg-gray-50 px-6 py-3 rounded-lg border">
                                {result.profile_id}
                                                </code>
                            <button
                                type="button"
                                                    onClick={async () => { 
                                                        try { 
                                                            await navigator.clipboard.writeText(String(result.profile_id || '')); 
                                                        } catch {} 
                                                    }}
                                                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-300 hover:scale-110 border border-blue-200"
                                                    title="Copy Profile ID"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                            </button>
                        </div>
                                            <div className="text-sm text-gray-500">
                                                Save this ID for future reference and opportunity tracking
                                            </div>
                                        </div>
                    </div>

                                    <div className="space-y-6">
                                        <p className="text-gray-700 text-center text-lg">
                                            {result.message}
                    </p>

                                        {result.extracted_skills && result.extracted_skills.length > 0 && (
                            <div>
                                                <h4 className="font-semibold text-gray-900 mb-4 text-center text-lg">
                                                    Identified Professional Skills
                                                </h4>
                                                <div className="flex flex-wrap gap-3 justify-center">
                                                    {result.extracted_skills.map((skill, index) => (
                                                        <span
                                                key={index}
                                                            className="px-4 py-2 bg-white text-gray-700 rounded-full font-medium border border-green-200 shadow-sm transition-all duration-300 hover:shadow-md"
                                            >
                                                {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default CVUpload;