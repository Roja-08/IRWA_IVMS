import React, { useState } from "react";
import axios from "axios";

const JobMatcher = () => {
  const [profileId, setProfileId] = useState("");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          🤖 AI Job Matcher
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter a volunteer profile ID to find the best job matches
        </p>

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

            <div className="grid md:grid-cols-2 gap-6">
              {matches.map((match, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatcher;
