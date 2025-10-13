import React, { useState } from 'react';
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

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

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
                            style={{
                                width: '100%',
                                padding: '10px 12px',
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
                    </div>
                ))}

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
                        <p
                            style={{
                                margin: '5px 0 0 0',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                color: '#065f46'
                            }}
                        >
                            {result.profile_id}
                        </p>
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
