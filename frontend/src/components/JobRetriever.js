import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const JobRetriever = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsCount, setJobsCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

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
                  onClick={() => setSelectedJob(job)}
                  className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.title || "Untitled Position"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Organization:</strong> {job.organization || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Location:</strong> {job.location || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {job.description ? job.description.substring(0, 100) + "..." : "No description"}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 font-medium">Click to view details →</span>
                    <span className="text-xs text-gray-500">
                      {job.skills_required?.length || 0} skills required
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedJob.title || "Untitled Position"}
                      </h2>
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                        <div className="space-y-2 text-sm">
                          <p><strong>Organization:</strong> {selectedJob.organization || "Not specified"}</p>
                          <p><strong>Location:</strong> {selectedJob.location || "Not specified"}</p>
                          {selectedJob.time_commitment && (
                            <p><strong>Time Commitment:</strong> {selectedJob.time_commitment}</p>
                          )}
                          {selectedJob.start_date && (
                            <p><strong>Start Date:</strong> {new Date(selectedJob.start_date).toLocaleDateString()}</p>
                          )}
                          {selectedJob.end_date && (
                            <p><strong>End Date:</strong> {new Date(selectedJob.end_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                        <div className="space-y-2 text-sm">
                          {selectedJob.contact_email && (
                            <p><strong>Email:</strong> {selectedJob.contact_email}</p>
                          )}
                          {selectedJob.contact_phone && (
                            <p><strong>Phone:</strong> {selectedJob.contact_phone}</p>
                          )}
                          {selectedJob.website && (
                            <p><strong>Website:</strong> <a href={selectedJob.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedJob.website}</a></p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedJob.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                      </div>
                    )}
                    
                    {selectedJob.skills_required?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills_required.map((skill, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-4 mt-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-500">
                        <p><strong>Source:</strong> {selectedJob.source}</p>
                        <p><strong>External ID:</strong> {selectedJob.external_id || 'N/A'}</p>
                        <p><strong>Created:</strong> {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : "Unknown"}</p>
                        <p><strong>Updated:</strong> {selectedJob.updated_at ? new Date(selectedJob.updated_at).toLocaleDateString() : "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobRetriever;
