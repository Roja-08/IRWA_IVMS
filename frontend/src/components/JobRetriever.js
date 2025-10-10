import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

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
        limit: 50,
      });
      setResult(response.data);
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
      const response = await axios.get(`${API_BASE_URL}/api/jobs?limit=1000`);
      setJobs(response.data.jobs);
      console.log("Stored jobs:", response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to fetch stored jobs");
      console.error("Error fetching stored jobs:", err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-10">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Intelligent Volunteer Matching System
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Retrieve and manage job data seamlessly
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={retrieveJobs}
            disabled={loading}
            className={`px-6 py-3 rounded-xl text-white font-semibold shadow-md transition-transform transform hover:scale-105 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Retrieving..." : "Retrieve Jobs"}
          </button>

          <button
            onClick={fetchStoredJobs}
            className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            Show All Jobs
          </button>

          <button
            onClick={getJobsCount}
            className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-semibold shadow-md hover:bg-cyan-700 transition-transform transform hover:scale-105"
          >
            Get Job Count
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-300 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="p-5 mb-6 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Retrieval Result
            </h3>
            <ul className="text-gray-700 space-y-1">
              <li><strong>Success:</strong> {result.success ? "✅ Yes" : "❌ No"}</li>
              <li><strong>Message:</strong> {result.message}</li>
              <li><strong>Jobs Retrieved:</strong> {result.jobs_retrieved}</li>
              <li><strong>Jobs Stored:</strong> {result.jobs_stored}</li>
            </ul>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <strong className="text-red-600">Errors:</strong>
                <ul className="list-disc ml-6 text-red-500">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {jobsCount > 0 && (
          <div className="p-5 mb-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">
              Database Status
            </h3>
            <p className="text-gray-700">
              <strong>Total Jobs in Database:</strong> {jobsCount}
            </p>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              All Jobs ({jobs.length})
            </h3>
            <div className="max-h-[500px] overflow-y-auto grid sm:grid-cols-2 gap-4">
              {jobs.map((job, index) => (
                <div
                  key={job._id || index}
                  className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {job.title || "Untitled Position"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Organization:</strong> {job.organization || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Location:</strong> {job.location || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Description:</strong>{" "}
                    {job.description
                      ? job.description.substring(0, 120) + "..."
                      : "No description"}
                  </p>
                  {job.skills_required?.length > 0 && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Skills:</strong>{" "}
                      <span className="text-gray-800">
                        {job.skills_required.join(", ")}
                      </span>
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    <p><strong>Source:</strong> {job.source}</p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobRetriever;
