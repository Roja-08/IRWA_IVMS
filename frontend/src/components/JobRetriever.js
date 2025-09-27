import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const JobRetriever = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsCount, setJobsCount] = useState(0);

  const retrieveJobs = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/jobs/retrieve`, {
        limit: 50
      });
      
      setResult(response.data);
      console.log('Job retrieval result:', response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to retrieve jobs');
      console.error('Error retrieving jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoredJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs?limit=20`);
      setJobs(response.data.jobs);
      console.log('Stored jobs:', response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch stored jobs');
      console.error('Error fetching stored jobs:', err);
    }
  };

  const getJobsCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/count`);
      setJobsCount(response.data.total_jobs);
      console.log('Jobs count:', response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to get jobs count');
      console.error('Error getting jobs count:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Intelligent Volunteer Matching System</h1>
      <h2>Job Retrieval Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={retrieveJobs} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Retrieving...' : 'Retrieve Jobs from API'}
        </button>

        <button 
          onClick={fetchStoredJobs}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Fetch Stored Jobs
        </button>

        <button 
          onClick={getJobsCount}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Get Jobs Count
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Retrieval Result:</h3>
          <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          <p><strong>Jobs Retrieved:</strong> {result.jobs_retrieved}</p>
          <p><strong>Jobs Stored:</strong> {result.jobs_stored}</p>
          {result.errors && result.errors.length > 0 && (
            <div>
              <strong>Errors:</strong>
              <ul>
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {jobsCount > 0 && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Database Status:</h3>
          <p><strong>Total Jobs in Database:</strong> {jobsCount}</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h3>Sample Stored Jobs:</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {jobs.map((job, index) => (
              <div key={job._id || index} style={{
                padding: '15px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <h4>{job.title || 'Untitled Position'}</h4>
                <p><strong>Organization:</strong> {job.organization || 'Not specified'}</p>
                <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
                <p><strong>Description:</strong> {job.description ? job.description.substring(0, 200) + '...' : 'No description'}</p>
                {job.skills_required && job.skills_required.length > 0 && (
                  <p><strong>Skills:</strong> {job.skills_required.join(', ')}</p>
                )}
                <p><strong>Source:</strong> {job.source}</p>
                <p><strong>Created:</strong> {new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRetriever;
