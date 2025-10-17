import React, { useState } from "react";
import axios from "axios";
import PageShell from "./PageShell";

const JobMatcher = () => {
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const findMatches = async () => {
    if (!profileId.trim()) {
      setError("Please enter a profile ID");
      return;
    }

    setLoading(true);
    setError(null);
    setMatches(null);

    try {
      const response = await axios.get(
        `http://localhost:8000/api/volunteers/${profileId}/matches`
      );
      setMatches(response.data.matches || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Error finding matches");
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-400";
    if (score >= 0.4) return "bg-orange-400";
    return "bg-red-500";
  };

  return (
    <PageShell icon="🤖" title="AI Job Matcher" subtitle="Enter a volunteer profile ID to find the best job matches">
      <div className="max-w-5xl mx-auto">

        {/* Input Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <input
            type="text"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            placeholder="Enter profile ID"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
          />
          <button
            onClick={findMatches}
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md transition-transform transform hover:scale-105 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Finding..." : "Find Matches"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* No Matches Message */}
        {!loading && matches && matches.length === 0 && profileId && !error && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded-lg mb-6 text-center">
            ⚠️ No matches found for this profile.
          </div>
        )}

        {/* Matches Display */}
        {matches && matches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Found {matches.length} Job Match
              {matches.length > 1 ? "es" : ""}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {matches.map((match, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedJob(match.job)}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {match.job.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        <strong>Organization:</strong> {match.job.organization}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Location:</strong> {match.job.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Skills:</strong>{" "}
                        {match.job.skills_required?.join(", ") ||
                          "Not specified"}
                      </p>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${getMatchScoreColor(
                        match.match_score
                      )}`}
                    >
                      {Math.round(match.match_score * 100)}% Match
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm mb-1">
                      Match Breakdown:
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Skills", value: match.skill_match },
                        { label: "Location", value: match.location_match },
                        { label: "Availability", value: match.availability_match },
                        { label: "Interest", value: match.interest_match },
                      ].map((metric, i) => (
                        <div key={i}>
                          <p className="text-xs text-gray-600 mb-1">
                            {metric.label}:{" "}
                            <span className="font-medium">
                              {Math.round(metric.value * 100)}%
                            </span>
                          </p>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`${getMatchScoreColor(
                                metric.value
                              )} h-2`}
                              style={{ width: `${metric.value * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasons */}
                  {match.reasons?.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-gray-700 text-sm mb-2">
                        Why this matches:
                      </h5>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {match.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Description */}
                  {match.job.description && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-gray-700 text-sm mb-1">
                        Description:
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {match.job.description.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Click to view full details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Skill Suggestions - Bottom Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md mt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                🎯 Skills to Improve
              </h3>
              
              {(() => {
                const lowScoreMatches = matches.filter(match => match.match_score < 0.7);
                const allJobSkills = matches.flatMap(match => match.job.skills_required || []);
                const skillCounts = {};
                allJobSkills.forEach(skill => {
                  skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                });
                const topSkills = Object.entries(skillCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([skill]) => skill);
                
                const avgScore = matches.reduce((sum, match) => sum + match.match_score, 0) / matches.length;
                
                return (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">
                        📊 Your Match Analysis
                      </h4>
                      <p className="text-blue-700 mb-2">
                        Average Score: <span className="font-bold text-xl">{Math.round(avgScore * 100)}%</span>
                      </p>
                      <p className="text-sm text-blue-600">
                        {avgScore >= 0.7 ? 'Great compatibility!' : 'Room for improvement'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">
                        🚀 Most In-Demand Skills
                      </h4>
                      <div className="space-y-2">
                        {topSkills.slice(0, 5).map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded p-2">
                            <span className="text-sm font-medium text-gray-700">{skill}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {skillCounts[skill]} jobs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      {lowScoreMatches.length > 0 && (
                        <div className="bg-orange-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-orange-700 mb-3">
                            ⚡ Priority Skills
                          </h4>
                          <p className="text-sm text-orange-600 mb-3">
                            Focus on these to improve {lowScoreMatches.length} lower-scoring matches:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[...new Set(lowScoreMatches.flatMap(match => match.job.skills_required || []))]
                              .slice(0, 6)
                              .map((skill, idx) => (
                              <span key={idx} className="text-sm bg-orange-200 text-orange-800 px-3 py-1 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-3">
                          📝 Quick Tips
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Take online courses for priority skills</li>
                          <li>• Get certifications in high-demand areas</li>
                          <li>• Practice skills through volunteer work</li>
                          <li>• Update your CV with new skills</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-90vh overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedJob.title}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Organization</h3>
                    <p className="text-gray-600">{selectedJob.organization || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
                    <p className="text-gray-600">{selectedJob.location || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedJob.description || 'No description available'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills_required?.map((skill, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    )) || <span className="text-gray-500">No specific skills required</span>}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Time Commitment</h3>
                    <p className="text-gray-600">{selectedJob.time_commitment || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Duration</h3>
                    <p className="text-gray-600">
                      {selectedJob.start_date && selectedJob.end_date 
                        ? `${new Date(selectedJob.start_date).toLocaleDateString()} - ${new Date(selectedJob.end_date).toLocaleDateString()}`
                        : 'Flexible timing'}
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Contact Email</h3>
                    <p className="text-gray-600">{selectedJob.contact_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Contact Phone</h3>
                    <p className="text-gray-600">{selectedJob.contact_phone || 'Not provided'}</p>
                  </div>
                </div>
                
                {selectedJob.website && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Website</h3>
                    <a href={selectedJob.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedJob.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default JobMatcher;
