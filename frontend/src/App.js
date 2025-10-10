import React, { useState } from 'react';
import CVUpload from './components/CVUpload';
import JobMatcher from './components/JobMatcher';
import JobRetriever from './components/JobRetriever';
import VolunteerList from './components/VolunteerList';

function App() {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabs = [
    { id: 'jobs', label: 'Job Management' },
    { id: 'upload', label: 'Upload CV' },
    { id: 'matcher', label: 'AI Job Matcher' },
    { id: 'verify', label: 'Verify Database' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 text-center shadow-md">
        <h1 className="text-4xl font-extrabold tracking-wide mb-2 drop-shadow-sm">
          SkillMatrix
        </h1>
        <p className="text-lg opacity-90">
          Multi-Agent AI System for Volunteer-Job Matching
        </p>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-center space-x-4 py-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-2 font-medium transition-all duration-300 rounded-md
                ${
                  activeTab === tab.id
                    ? 'text-white bg-blue-600 shadow-md scale-105'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-400 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
          {activeTab === 'jobs' && <JobRetriever />}
          {activeTab === 'upload' && <CVUpload />}
          {activeTab === 'matcher' && <JobMatcher />}
          {activeTab === 'verify' && <VolunteerList />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 text-center py-6 mt-auto shadow-inner">
        <p className="text-sm mb-1">
          © {new Date().getFullYear()} SkillMatrix
        </p>
        <p className="text-xs text-gray-400">
          Features: Skill Profiler • Event Matcher • Availability Tracker
        </p>
      </footer>
    </div>
  );
}

export default App;
