import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const response = await axios.post(`http://localhost:8000${endpoint}`, {
        username,
        password,
      });

      if (response.data.success) {
        if (isSignup) {
          setError('');
          setIsSignup(false);
          alert('Account created successfully! Please login.');
        } else {
          onLogin(response.data.user);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `${isSignup ? 'Signup' : 'Login'} failed`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-2xl shadow-xl w-96"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-500/20 text-red-100 rounded-lg text-center text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                {isSignup ? 'Creating...' : 'Logging in...'}
              </>
            ) : (
              <>{isSignup ? 'Sign Up' : 'Login'}</>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-indigo-200 hover:text-white transition font-medium"
          >
            {isSignup
              ? 'Already have an account? Login'
              : 'Need an account? Sign Up'}
          </button>
        </div>

        {!isSignup && (
          <div className="mt-6 text-sm text-indigo-100 text-center bg-white/10 rounded-lg p-3">
            <p><strong>Demo Admins:</strong></p>
            <p>admin / admin123</p>
            <p>viviyan / vivy123</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
