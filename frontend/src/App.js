import React, { useState } from 'react';
import CVUpload from './components/CVUpload';
import JobMatcher from './components/JobMatcher';
import JobRetriever from './components/JobRetriever';
import VolunteerList from './components/VolunteerList';

function App() {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabStyle = {
    padding: '10px 20px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f8f9fa',
    color: '#333'
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center'
      }}>
        <h1>Intelligent Volunteer Matching System</h1>
        <p>Multi-Agent AI System for Volunteer-Job Matching</p>
      </header>

      <nav style={{
        backgroundColor: 'white',
        padding: '15px',
        textAlign: 'center',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button
          style={activeTab === 'jobs' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('jobs')}
        >
          Job Management
        </button>
        <button
          style={activeTab === 'upload' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('upload')}
        >
          Upload CV
        </button>
        <button
          style={activeTab === 'matcher' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('matcher')}
        >
          AI Job Matcher
        </button>
        <button
          style={activeTab === 'verify' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('verify')}
        >
          Verify Database
        </button>
      </nav>

      <main style={{ padding: '20px' }}>
        {activeTab === 'jobs' && <JobRetriever />}
        {activeTab === 'upload' && <CVUpload />}
        {activeTab === 'matcher' && <JobMatcher />}
        {activeTab === 'verify' && <VolunteerList />}
      </main>

      <footer style={{
        backgroundColor: '#343a40',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px'
      }}>
        <p>© 2024 Intelligent Volunteer Matching System - Multi-Agent Architecture</p>
        <p>Features: Skill Profiler • Event Matcher • Availability Tracker</p>
      </footer>
    </div>
  );
}

export default App;
