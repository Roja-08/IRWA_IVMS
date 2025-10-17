import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const VolunteerList = () => {
    const [volunteers, setVolunteers] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVolunteers, setFilteredVolunteers] = useState([]);

    useEffect(() => {
        if (volunteers && searchTerm) {
            const filtered = volunteers.filter(volunteer =>
                volunteer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                volunteer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                volunteer.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                volunteer.skills?.some(skill => 
                    skill.name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
            setFilteredVolunteers(filtered);
        } else {
            setFilteredVolunteers(volunteers || []);
        }
    }, [volunteers, searchTerm]);

    const fetchVolunteers = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const params = new URLSearchParams();
            if (user.role) params.append('user_role', user.role);
            if (user.username) params.append('username', user.username);
            
            const response = await axios.get(`http://localhost:8000/api/volunteers/all?${params}`);
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
            </div>

            <div className="relative z-10 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl mb-8 animate-float">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent mb-4">
                            Volunteer Profiles
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' 
                                ? 'Manage and review all volunteer CV submissions' 
                                : 'View and manage your CV submissions'}
                        </p>
                    </motion.div>

                    {/* Main Content Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
                        {/* Action Bar */}
                        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8">
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search volunteers by name, email, location, or skills..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                                    />
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                    onClick={fetchVolunteers}
                    disabled={loading}
                                className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                                    loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>
                                            {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' 
                                                ? 'View All CVs' 
                                                : 'View My CVs'}
                                        </span>
                                    </div>
                                )}
                            </motion.button>
            </div>

                        {/* Error Message */}
            {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 mb-6"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-red-700">{error}</div>
                </div>
                            </motion.div>
                        )}

                        {/* Volunteers Grid */}
                        {filteredVolunteers && filteredVolunteers.length > 0 && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                className="space-y-6"
                            >
                                {/* Results Header */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {filteredVolunteers.length} Profile{filteredVolunteers.length !== 1 ? 's' : ''} Found
                                        {searchTerm && ` for "${searchTerm}"`}
                                    </h2>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-fr">
                                    {filteredVolunteers.map((volunteer, index) => (
                                        <motion.div
                                            key={volunteer._id}
                                            variants={cardVariants}
                                            custom={index}
                                            onClick={() => setSelectedVolunteer(volunteer)}
                                            className="group bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-105 h-full flex flex-col relative overflow-hidden"
                                        >
                                            {/* Background Gradient Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1 pr-4">
                                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                                            {volunteer.name}
                                                        </h3>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{volunteer.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span>{volunteer.location || 'Not specified'}</span>
                                                            </div>
                                        </div>
                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-col gap-2 min-w-[100px]">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(volunteer.volunteer_id || volunteer._id);
                                                            }}
                                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors duration-300 flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Copy ID
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteVolunteer(volunteer.volunteer_id || volunteer._id);
                                            }}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors duration-300 flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-blue-600">{volunteer.skills?.length || 0}</div>
                                                        <div className="text-xs text-gray-500">Skills</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-green-600">
                                                            {volunteer.cv_filename ? '✅' : '❌'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">CV File</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-900 font-medium truncate" title={volunteer.volunteer_id || volunteer._id}>
                                                            {volunteer.volunteer_id ? volunteer.volunteer_id.substring(0, 8) + '...' : volunteer._id.substring(0, 8) + '...'}
                                        </div>
                                                        <div className="text-xs text-gray-500">Profile ID</div>
                                    </div>
                                </div>

                                                {/* Skills Preview */}
                                {volunteer.skills && volunteer.skills.length > 0 && (
                                                    <div className="mb-4">
                                                        <h5 className="font-semibold text-gray-700 mb-2 text-sm">Top Skills</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {volunteer.skills.slice(0, 4).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                                    className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-xs font-medium"
                                                                >
                                                                    {skill.name}
                                                </span>
                                            ))}
                                                            {volunteer.skills.length > 4 && (
                                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                                                    +{volunteer.skills.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                                {/* Footer */}
                                                <div className="mt-auto pt-4 border-t border-gray-100">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="text-gray-500">
                                                            Created: {new Date(volunteer.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                                                            <span>View Details</span>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                            </div>
                                        </motion.div>
                        ))}
                    </div>
                            </motion.div>
            )}

                        {/* Empty State */}
            {!loading && volunteers && volunteers.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12"
                            >
                                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No CVs Found</h3>
                                <p className="text-gray-600 mb-4">
                        {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' 
                                        ? 'No volunteer profiles found in the system.' 
                            : 'You haven\'t uploaded any CVs yet.'}
                    </p>
                                <button
                                    onClick={fetchVolunteers}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300"
                                >
                                    Refresh
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Volunteer Details Modal */}
            <AnimatePresence>
            {selectedVolunteer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl p-6 flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-gray-900">
                                {selectedVolunteer.name}
                            </h2>
                            <button
                                onClick={() => setSelectedVolunteer(null)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-300 p-2 hover:bg-gray-100 rounded-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                            </button>
                        </div>
                        
                            <div className="p-8 space-y-8">
                                {/* Contact & Profile Info */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Contact Information</h3>
                                        <div className="space-y-3">
                                            <p className="text-gray-900"><strong>Email:</strong> {selectedVolunteer.email}</p>
                                            <p className="text-gray-900"><strong>Phone:</strong> {selectedVolunteer.phone || 'Not provided'}</p>
                                            <p className="text-gray-900"><strong>Location:</strong> {selectedVolunteer.location || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Profile Information</h3>
                                        <div className="space-y-3">
                                            <p className="text-gray-900"><strong>Profile ID:</strong> {selectedVolunteer.volunteer_id || selectedVolunteer._id}</p>
                                            <p className="text-gray-900"><strong>CV File:</strong> {selectedVolunteer.cv_filename || 'Not uploaded'}</p>
                                            <p className="text-gray-900"><strong>Created:</strong> {new Date(selectedVolunteer.created_at).toLocaleString()}</p>
                                            {selectedVolunteer.uploaded_by && (
                                                <p className="text-gray-900"><strong>Uploaded by:</strong> {selectedVolunteer.uploaded_by}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Experience Summary */}
                                {selectedVolunteer.experience_summary && (
                                    <div className="bg-blue-50 rounded-2xl p-6">
                                        <h3 className="font-semibold text-blue-700 mb-4 text-lg">Experience Summary</h3>
                                        <p className="text-blue-900 leading-relaxed">{selectedVolunteer.experience_summary}</p>
                                </div>
                            )}
                            
                                {/* Skills */}
                            {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Skills & Expertise</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedVolunteer.skills.map((skill, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold text-gray-900">{skill.name}</span>
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            {skill.level}
                                            </span>
                                                    </div>
                                                    {skill.years_experience && (
                                                        <p className="text-sm text-gray-600">
                                                            {skill.years_experience} years experience
                                                        </p>
                                                    )}
                                                </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                                {/* Interests */}
                            {selectedVolunteer.interests && selectedVolunteer.interests.length > 0 && (
                                    <div className="bg-green-50 rounded-2xl p-6">
                                        <h3 className="font-semibold text-green-700 mb-4 text-lg">Areas of Interest</h3>
                                        <div className="flex flex-wrap gap-2">
                                        {selectedVolunteer.interests.map((interest, idx) => (
                                            <span
                                                key={idx}
                                                    className="bg-green-100 text-green-800 border border-green-200 px-3 py-2 rounded-xl text-sm font-medium"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                                {/* Availability */}
                            {selectedVolunteer.availability && selectedVolunteer.availability.length > 0 && (
                                    <div className="bg-purple-50 rounded-2xl p-6">
                                        <h3 className="font-semibold text-purple-700 mb-4 text-lg">Availability Schedule</h3>
                                        <div className="grid gap-3">
                                        {selectedVolunteer.availability.map((slot, idx) => {
                                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                            return (
                                                    <div key={idx} className={`p-4 rounded-xl border ${
                                                        slot.status === 'available' 
                                                            ? 'bg-green-100 border-green-200 text-green-800' 
                                                            : 'bg-yellow-100 border-yellow-200 text-yellow-800'
                                                    }`}>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-semibold">{days[slot.day_of_week]}</span>
                                                            <span className="text-sm capitalize">{slot.status}</span>
                                                        </div>
                                                        <div className="text-sm mt-1">
                                                            {slot.start_time} - {slot.end_time}
                                                        </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default VolunteerList;