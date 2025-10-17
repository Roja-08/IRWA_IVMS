import React, { useState, useEffect } from "react";
import axios from "axios";

const JobMatcher = () => {
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [skillRecs, setSkillRecs] = useState(null);
  const [skillRecsLoading, setSkillRecsLoading] = useState(false);
  const [skillRecsError, setSkillRecsError] = useState(null);
  const [searchAnimation, setSearchAnimation] = useState(false);

  useEffect(() => {
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

  const findMatches = async () => {
    if (!profileId.trim()) {
      setError("Please enter a profile ID");
      return;
    }

    setLoading(true);
    setError(null);
    setMatches(null);
    setSearchAnimation(true);

    try {
      const response = await axios.get(
        `http://localhost:8000/api/volunteers/${profileId}/matches`
      );
      setMatches(response.data.matches || []);
      fetchSkillRecommendations(profileId);
    } catch (err) {
      setError(err.response?.data?.detail || "Error finding matches");
    } finally {
      setLoading(false);
      setTimeout(() => setSearchAnimation(false), 1000);
    }
  };

  const fetchSkillRecommendations = async (pid) => {
    if (!pid) return;
    setSkillRecsLoading(true);
    setSkillRecsError(null);
    setSkillRecs(null);
    try {
      const res = await axios.get(
        `http://localhost:8000/api/recommendations/skills`,
        { params: { profile_id: pid, limit: 8 } }
      );
      setSkillRecs(res.data);
    } catch (err) {
      setSkillRecsError(err.response?.data?.detail || 'Failed to load skill recommendations');
    } finally {
      setSkillRecsLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return "from-green-500 to-emerald-600";
    if (score >= 0.6) return "from-amber-400 to-orange-500";
    if (score >= 0.4) return "from-orange-400 to-red-500";
    return "from-red-400 to-red-600";
  };

  const getMatchScoreText = (score) => {
    if (score >= 0.8) return "Excellent Match";
    if (score >= 0.6) return "Good Match";
    if (score >= 0.4) return "Fair Match";
    return "Low Match";
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
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl mb-8 animate-float">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 bg-clip-text text-transparent mb-4">
              Intelligent Job Matching
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover your perfect volunteer opportunities with our AI-powered matching system
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 mb-12 animate-fadeInUp">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    placeholder="Enter your unique profile ID..."
                    className="w-full border border-gray-200 rounded-2xl px-6 py-4 text-gray-700 bg-white/70 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && findMatches()}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={findMatches}
                  disabled={loading}
                  className={`px-8 py-4 rounded-2xl font-semibold text-white shadow-xl transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[160px] ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : `bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 ${searchAnimation ? 'animate-pulse-glow' : ''}`
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Find Matches</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 animate-fadeInUp">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-red-800">Unable to Process</div>
                      <div className="text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Matches Message */}
              {!loading && matches && matches.length === 0 && profileId && !error && (
                <div className="mt-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-6 text-center animate-fadeInUp">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">No Matches Found</h3>
                  <p className="text-amber-700">
                    We couldn't find any matching opportunities for this profile ID. 
                    Please check the ID or try again later.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Matches Display */}
          {matches && matches.length > 0 && (
            <div className="space-y-12 animate-fadeInUp">
              {/* Results Header */}
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Discover Your Opportunities
                </h2>
                <p className="text-xl text-gray-600">
                  Found <span className="font-semibold text-blue-600">{matches.length}</span> tailored match{matches.length > 1 ? 'es' : ''} for your profile
                </p>
              </div>

              {/* Matches Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 auto-rows-fr">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedJob(match.job)}
                    className="group bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:scale-105 h-full flex flex-col relative overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background Gradient Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getMatchScoreColor(match.match_score)} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 pr-4">
                          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                            {match.job.title}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">{match.job.organization}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{match.job.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getMatchScoreColor(match.match_score)} text-white font-bold text-lg shadow-lg min-w-[120px] text-center`}>
                          <div className="text-2xl mb-1">{Math.round(match.match_score * 100)}%</div>
                          <div className="text-xs opacity-90">{getMatchScoreText(match.match_score)}</div>
                        </div>
                      </div>

                      {/* Skills Preview */}
                      {match.job.skills_required && match.job.skills_required.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Key Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.job.skills_required.slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                                {skill}
                              </span>
                            ))}
                            {match.job.skills_required.length > 4 && (
                              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium">
                                +{match.job.skills_required.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Match Breakdown */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Compatibility Analysis
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Skills", value: match.skill_match, icon: "🎯" },
                            { label: "Location", value: match.location_match, icon: "📍" },
                            { label: "Availability", value: match.availability_match, icon: "⏰" },
                            { label: "Interest", value: match.interest_match, icon: "❤️" },
                          ].map((metric, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{metric.icon} {metric.label}</span>
                                <span className="text-sm font-bold text-gray-900">
                                  {Math.round(metric.value * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-2 bg-gradient-to-r ${getMatchScoreColor(metric.value)} transition-all duration-1000 ease-out`}
                                  style={{ width: `${metric.value * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Description Preview */}
                      {match.job.description && (
                        <div className="mb-6">
                          <p className="text-gray-600 leading-relaxed line-clamp-3">
                            {match.job.description}
                          </p>
                        </div>
                      )}

                      {/* Reasons */}
                      {match.reasons?.length > 0 && (
                        <div className="mb-6">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Why This Matches
                          </h5>
                          <ul className="space-y-2">
                            {match.reasons.slice(0, 3).map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* CTA */}
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Click to view full details</span>
                          <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:gap-2 transition-all duration-300">
                            <span>Explore Opportunity</span>
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

              {/* Analytics & Recommendations Section */}
              <div className="space-y-8">
                {/* Skill Recommendations from Agent */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">Skill Development Roadmap</h3>
                      <p className="text-gray-600">Personalized recommendations to enhance your profile</p>
                    </div>
                    <button
                      onClick={() => fetchSkillRecommendations(profileId)}
                      disabled={skillRecsLoading || !profileId}
                      className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-300 ${
                        skillRecsLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {skillRecsLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Refresh Analysis</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {skillRecsError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-red-700">{skillRecsError}</div>
                      </div>
                    </div>
                  )}

                  {!skillRecsLoading && skillRecs && skillRecs.top_gaps && skillRecs.top_gaps.length > 0 ? (
                    <div className="animate-slideInRight">
                      <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-900 text-lg">Analysis Complete</h4>
                            <p className="text-blue-700">Based on {skillRecs.total_jobs_analyzed} opportunity analyses</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {skillRecs.top_gaps.map((gap, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900 text-sm">{gap.skill}</span>
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                  {gap.demand} jobs
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full">
                                <div 
                                  className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                                  style={{ width: `${(gap.demand / Math.max(...skillRecs.top_gaps.map(g => g.demand))) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    !skillRecsLoading && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">Skill recommendations will appear here after analysis</p>
                      </div>
                    )
                  )}
                </div>

                {/* Performance Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Match Statistics */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl">
                    <h4 className="font-bold text-lg mb-4">📊 Match Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100">Average Score</span>
                        <span className="text-2xl font-bold">
                          {Math.round((matches.reduce((sum, match) => sum + match.match_score, 0) / matches.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100">Excellent Matches</span>
                        <span className="text-xl font-semibold">
                          {matches.filter(m => m.match_score >= 0.8).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100">Improvement Areas</span>
                        <span className="text-xl font-semibold">
                          {matches.filter(m => m.match_score < 0.6).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-6 shadow-xl col-span-2">
                    <h4 className="font-bold text-gray-900 text-lg mb-4">🚀 Next Steps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="font-semibold text-green-800">Skill Development</span>
                        </div>
                        <p className="text-green-700 text-sm">Take online courses for high-demand skills</p>
                      </div>
                      
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-purple-800">Update Profile</span>
                        </div>
                        <p className="text-purple-700 text-sm">Refresh your CV with new certifications</p>
                      </div>
                      
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-orange-800">Network Building</span>
                        </div>
                        <p className="text-orange-700 text-sm">Connect with organizations in your field</p>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-blue-800">Apply Now</span>
                        </div>
                        <p className="text-blue-700 text-sm">Start applying to your top matches</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-3xl p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">{selectedJob.title}</h2>
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
                    Organization
                  </h3>
                  <p className="text-gray-900 text-lg font-medium">{selectedJob.organization || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h3>
                  <p className="text-gray-900 text-lg font-medium">{selectedJob.location || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-xl">Opportunity Description</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{selectedJob.description || 'No description available'}</p>
              </div>
              
              {/* Required Skills */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-xl">Required Skills & Qualifications</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedJob.skills_required?.map((skill, idx) => (
                    <span key={idx} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                      {skill}
                    </span>
                  )) || <span className="text-gray-500">No specific skills required</span>}
                </div>
              </div>
              
              {/* Additional Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-blue-700 mb-3">Time Commitment</h3>
                  <p className="text-blue-900 text-lg">{selectedJob.time_commitment || 'Flexible'}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-700 mb-3">Duration</h3>
                  <p className="text-green-900 text-lg">
                    {selectedJob.start_date && selectedJob.end_date 
                      ? `${new Date(selectedJob.start_date).toLocaleDateString()} - ${new Date(selectedJob.end_date).toLocaleDateString()}`
                      : 'Flexible timing'}
                  </p>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                <h3 className="font-semibold text-indigo-700 mb-4 text-xl">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-indigo-600 mb-2">Email</h4>
                    <p className="text-indigo-900">{selectedJob.contact_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-600 mb-2">Phone</h4>
                    <p className="text-indigo-900">{selectedJob.contact_phone || 'Not provided'}</p>
                  </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatcher;