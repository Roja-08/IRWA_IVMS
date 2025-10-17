import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserPlus, LogIn, Mail, Lock, User, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setIsSignup(!isSignup);
      setError('');
      setIsSwitching(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup ? { username, password, email } : { username, password };
      
      const response = await axios.post(`http://localhost:8000${endpoint}`, payload);

      if (response.data.success) {
        if (isSignup) {
          setError('');
          handleSwitch();
          setTimeout(() => {
            alert('Account created successfully! Please login.');
          }, 500);
        } else {
          onLogin(response.data.user);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `${isSignup ? 'Signup' : 'Login'} failed. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const formVariants = {
    initial: { 
      opacity: 0, 
      x: isSignup ? 100 : -100,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      x: isSignup ? -100 : 100,
      scale: 0.9,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.5)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Background Decorations */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400/10 rounded-full blur-2xl"></div>

        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden w-96 relative">
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30"
              >
                {isSignup ? (
                  <UserPlus className="h-8 w-8 text-white" />
                ) : (
                  <LogIn className="h-8 w-8 text-white" />
                )}
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.h2
                  key={isSignup ? 'signup' : 'login'}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </motion.h2>
              </AnimatePresence>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={isSignup ? 'signup-desc' : 'login-desc'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-white/80 text-sm"
                >
                  {isSignup ? 'Join us today and start your journey' : 'Sign in to access your account'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {!isSwitching && (
                <motion.form
                  key={isSignup ? 'signup-form' : 'login-form'}
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* Username Field */}
                  <motion.div
                    whileFocus="focus"
                    variants={inputVariants}
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-300"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Email Field (Signup only) */}
                  <AnimatePresence>
                    {isSignup && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        whileFocus="focus"
                        variants={inputVariants}
                      >
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                          <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-300"
                            required={isSignup}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Field */}
                  <motion.div
                    whileFocus="focus"
                    variants={inputVariants}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-300"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-500/20 text-red-100 rounded-lg text-center text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-300 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        {isSignup ? 'Creating...' : 'Logging in...'}
                      </>
                    ) : (
                      <>
                        <span>{isSignup ? 'Sign Up' : 'Login'}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Switch Form */}
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleSwitch}
                disabled={isSwitching}
                className="text-indigo-200 hover:text-white transition-all duration-300 font-medium group flex items-center justify-center gap-2 mx-auto"
              >
                <span>
                  {isSignup
                    ? 'Already have an account?'
                    : "Don't have an account?"}
                </span>
                <motion.span
                  className="text-white font-semibold group-hover:underline"
                  whileHover={{ x: 2 }}
                >
                  {isSignup ? 'Login' : 'Sign Up'}
                </motion.span>
              </button>
            </motion.div>

            {/* Demo Accounts */}
            {!isSignup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-sm text-indigo-100 text-center bg-white/10 rounded-lg p-3"
              >
                <p className="font-semibold mb-2">Demo Accounts:</p>
                <div className="space-y-1 text-xs">
                  <p>admin / admin123</p>
                  <p>viviyan / vivy123</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute -z-10 inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              initial={{
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;