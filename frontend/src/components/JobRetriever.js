import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const JobRetriever = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsCount, setJobsCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("actions");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Initialize with job count
    getJobsCount();
    
    // Add floating animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
      }
      .animate-float { animation: float 3s ease-in-out infinite; }
      .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
      .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
      .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const retrieveJobs = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/jobs/retrieve`, {
        limit: 50,
      });
      setResult(response.data);
      // Refresh counts after retrieval
      getJobsCount();
      console.log("Job retrieval result:", response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to retrieve jobs");
      console.error("Error retrieving jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoredJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/jobs?limit=1000`);
      setJobs(response.data.jobs);
      analyzeJobStats(response.data.jobs);
      setActiveTab("jobs");
      console.log("Stored jobs:", response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to fetch stored jobs");
      console.error("Error fetching stored jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getJobsCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/count`);
      setJobsCount(response.data.total_jobs);
      console.log("Jobs count:", response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to get jobs count");
      console.error("Error getting jobs count:", err);
    }
  };

  const analyzeJobStats = (jobsData) => {
    const stats = {
      total: jobsData.length,
      withSkills: jobsData.filter(job => job.skills_required && job.skills_required.length > 0).length,
      withLocation: jobsData.filter(job => job.location && job.location.trim()).length,
      withDescription: jobsData.filter(job => job.description && job.description.trim()).length,
      topSkills: {},
      topOrganizations: {}
    };

    // Analyze skills
    jobsData.forEach(job => {
      if (job.skills_required) {
        job.skills_required.forEach(skill => {
          stats.topSkills[skill] = (stats.topSkills[skill] || 0) + 1;
        });
      }
      if (job.organization) {
        stats.topOrganizations[job.organization] = (stats.topOrganizations[job.organization] || 0) + 1;
      }
    });

    // Get top 5 skills and organizations
    stats.topSkills = Object.entries(stats.topSkills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    stats.topOrganizations = Object.entries(stats.topOrganizations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    setStats(stats);
  };

  const clearAllData = () => {
    setJobs([]);
    setResult(null);
    setStats(null);
    setActiveTab("actions");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl mb-8 animate-float">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent mb-4">
              Job Intelligence Dashboard
        </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Advanced job data retrieval and management system with real-time analytics
            </p>
          </div>

          {/* Main Dashboard Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                {[
                  { id: "actions", name: "Actions", icon: "⚡" },
                  { id: "jobs", name: "Job Database", icon: "📊" },
                  { id: "analytics", name: "Analytics", icon: "📈" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.name}
                    {tab.id === "jobs" && jobsCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {jobsCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Actions Tab */}
              {activeTab === "actions" && (
                <div className="animate-fadeInUp">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Management Actions</h2>
                    <p className="text-gray-600 text-lg">Retrieve, manage, and analyze job opportunities</p>
                  </div>

                  {/* Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Retrieve Jobs Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-lg">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Retrieve New Jobs</h3>
                      <p className="text-gray-600 mb-4">Fetch latest opportunities from external sources</p>
          <button
            onClick={retrieveJobs}
            disabled={loading}
                        className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Retrieving...</span>
                          </div>
                        ) : (
                          "Retrieve Jobs"
                        )}
          </button>
                    </div>

                    {/* View Database Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">View Database</h3>
                      <p className="text-gray-600 mb-4">Browse all stored job opportunities</p>
          <button
            onClick={fetchStoredJobs}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Show All Jobs
          </button>
                    </div>

                    {/* System Status Card */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-2xl p-6 border border-cyan-200 shadow-lg">
                      <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">System Status</h3>
                      <p className="text-gray-600 mb-4">Current database statistics and metrics</p>
                      <div className="space-y-2">
          <button
            onClick={getJobsCount}
                          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
                          Refresh Count
          </button>
                        {jobsCount > 0 && (
                          <div className="text-center py-2 bg-white rounded-lg border border-cyan-200">
                            <span className="text-cyan-700 font-bold text-lg">{jobsCount}</span>
                            <span className="text-cyan-600 text-sm ml-2">jobs stored</span>
                          </div>
                        )}
                      </div>
                    </div>
        </div>

                  {/* Results Section */}
                  <div className="space-y-6">
        {error && (
                      <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 animate-fadeInUp">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-red-800 text-lg">Operation Failed</div>
                            <div className="text-red-700">{error}</div>
                          </div>
                        </div>
          </div>
        )}

        {result && (
                      <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-2xl p-6 animate-fadeInUp">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800 text-lg">Retrieval Complete</h3>
                            <p className="text-green-700">{result.message}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-xl p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{result.success ? "✅" : "❌"}</div>
                            <div className="text-sm text-green-700 font-medium">Success</div>
                          </div>
                          <div className="bg-white rounded-xl p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{result.jobs_retrieved}</div>
                            <div className="text-sm text-green-700 font-medium">Retrieved</div>
                          </div>
                          <div className="bg-white rounded-xl p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{result.jobs_stored}</div>
                            <div className="text-sm text-green-700 font-medium">Stored</div>
                          </div>
                          <div className="bg-white rounded-xl p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{jobsCount}</div>
                            <div className="text-sm text-green-700 font-medium">Total</div>
                          </div>
                        </div>

            {result.errors && result.errors.length > 0 && (
                          <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-2">Processing Notes</h4>
                            <ul className="text-yellow-700 space-y-1 text-sm">
                  {result.errors.map((err, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-1">•</span>
                                  <span>{err}</span>
                                </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
                  </div>
                </div>
              )}

              {/* Jobs Database Tab */}
              {activeTab === "jobs" && (
                <div className="animate-fadeInUp">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Database</h2>
                      <p className="text-gray-600">Browse and manage all stored opportunities</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={getJobsCount}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors duration-300"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={clearAllData}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-300"
                      >
                        Clear View
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading job database...</p>
                    </div>
                  ) : jobs.length > 0 ? (
                    <>
                      {/* Stats Overview */}
                      {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-blue-700">Total Jobs</div>
                          </div>
                          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{stats.withSkills}</div>
                            <div className="text-sm text-green-700">With Skills</div>
                          </div>
                          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">{stats.withLocation}</div>
                            <div className="text-sm text-purple-700">With Location</div>
                          </div>
                          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{stats.withDescription}</div>
                            <div className="text-sm text-orange-700">With Description</div>
                          </div>
          </div>
        )}

                      {/* Jobs Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-fr">
              {jobs.map((job, index) => (
                <div
                  key={job._id || index}
                  onClick={() => setSelectedJob(job)}
                            className="group bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-105 h-full flex flex-col relative overflow-hidden"
                          >
                            {/* Background Gradient Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2">
                    {job.title || "Untitled Position"}
                  </h4>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="font-medium">{job.organization || "Not specified"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{job.location || "Not specified"}</span>
                                </div>
                              </div>

                              {job.description && (
                                <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                                  {job.description}
                                </p>
                              )}

                              {job.skills_required?.length > 0 && (
                  <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    {job.skills_required.slice(0, 3).map((skill, idx) => (
                                      <span key={idx} className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                                        {skill}
                                      </span>
                                    ))}
                                    {job.skills_required.length > 3 && (
                                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                        +{job.skills_required.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-auto pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">Click for details</span>
                                  <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                                    <span>View</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Loaded</h3>
                      <p className="text-gray-600 mb-4">Retrieve jobs or load from database to view opportunities</p>
                      <button
                        onClick={fetchStoredJobs}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300"
                      >
                        Load Jobs
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="animate-fadeInUp">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Database Analytics</h2>
                    <p className="text-gray-600">Comprehensive insights and statistics</p>
                  </div>
                  
                  {stats ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Top Skills */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Most In-Demand Skills
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(stats.topSkills).map(([skill, count], index) => (
                            <div key={skill} className="flex items-center justify-between">
                              <span className="text-gray-700 font-medium">{skill}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                                    style={{ width: `${(count / Math.max(...Object.values(stats.topSkills))) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 font-medium w-8 text-right">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Organizations */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Top Organizations
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(stats.topOrganizations).map(([org, count], index) => (
                            <div key={org} className="flex items-center justify-between">
                              <span className="text-gray-700 font-medium truncate flex-1">{org}</span>
                              <span className="text-sm text-gray-500 font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                {count} jobs
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Data Quality */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Data Quality Metrics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">{Math.round((stats.withSkills / stats.total) * 100)}%</div>
                            <div className="text-sm text-gray-600">With Skills</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">{Math.round((stats.withLocation / stats.total) * 100)}%</div>
                            <div className="text-sm text-gray-600">With Location</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">{Math.round((stats.withDescription / stats.total) * 100)}%</div>
                            <div className="text-sm text-gray-600">With Description</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Records</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
                      <p className="text-gray-600 mb-4">Load job data to view analytics and insights</p>
                      <button
                        onClick={fetchStoredJobs}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300"
                      >
                        Load Data
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">{selectedJob.title || "Untitled Position"}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-300 p-2 hover:bg-gray-100 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Key Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Organization & Location
                  </h3>
                  <div className="space-y-3">
                    <p className="text-gray-900 text-lg font-medium">{selectedJob.organization || "Not specified"}</p>
                    <p className="text-gray-700">{selectedJob.location || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Commitment
                  </h3>
                  <div className="space-y-2">
                    {selectedJob.time_commitment && (
                      <p className="text-gray-900 text-lg font-medium">{selectedJob.time_commitment}</p>
                    )}
                    {selectedJob.start_date && selectedJob.end_date ? (
                      <p className="text-gray-700">
                        {new Date(selectedJob.start_date).toLocaleDateString()} - {new Date(selectedJob.end_date).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-gray-500">Flexible timing</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4 text-xl">Opportunity Description</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{selectedJob.description}</p>
                      </div>
                    )}
                    
              {/* Required Skills */}
                    {selectedJob.skills_required?.length > 0 && (
                      <div>
                  <h3 className="font-semibold text-gray-700 mb-4 text-xl">Required Skills & Qualifications</h3>
                  <div className="flex flex-wrap gap-3">
                          {selectedJob.skills_required.map((skill, idx) => (
                      <span key={idx} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
              {/* Contact Information */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                <h3 className="font-semibold text-indigo-700 mb-4 text-xl">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {selectedJob.contact_email && (
                    <div>
                      <h4 className="font-medium text-indigo-600 mb-2">Email</h4>
                      <p className="text-indigo-900">{selectedJob.contact_email}</p>
                      </div>
                  )}
                  {selectedJob.contact_phone && (
                    <div>
                      <h4 className="font-medium text-indigo-600 mb-2">Phone</h4>
                      <p className="text-indigo-900">{selectedJob.contact_phone}</p>
                    </div>
                  )}
                </div>
                
                {selectedJob.website && (
                  <div className="mt-4">
                    <h4 className="font-medium text-indigo-600 mb-2">Website</h4>
                    <a href={selectedJob.website} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:text-indigo-900 underline text-lg">
                      {selectedJob.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">System Information</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <p className="text-gray-900 font-medium">{selectedJob.source}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">External ID:</span>
                    <p className="text-gray-900 font-medium">{selectedJob.external_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedJob.updated_at ? new Date(selectedJob.updated_at).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
    </div>
  );
};

export default JobRetriever;