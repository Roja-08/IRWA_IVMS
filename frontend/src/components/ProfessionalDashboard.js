import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  Stack,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AccessTime as AccessTimeIcon,
  CorporateFare as CorporateFareIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const ProfessionalDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    skills: [],
    organizations: []
  });
  const [stats, setStats] = useState({
    total: 0,
    locations: 0,
    organizations: 0,
    skills: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const theme = useTheme();

  // Enhanced fetch jobs with animations
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/jobs?limit=100`);
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
      setTotalJobs(response.data.total);
      setLastUpdated(new Date());
      
      // Calculate stats
      const locations = [...new Set(response.data.jobs.map(job => job.location).filter(Boolean))];
      const organizations = [...new Set(response.data.jobs.map(job => job.organization).filter(Boolean))];
      const allSkills = response.data.jobs.flatMap(job => job.skills_required || []);
      const uniqueSkills = [...new Set(allSkills)];
      
      setStats({
        total: response.data.total,
        locations: locations.length,
        organizations: organizations.length,
        skills: uniqueSkills.length
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced retrieve new jobs with loading state
  const retrieveNewJobs = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/api/jobs/retrieve`, {
        limit: 50
      });
      
      if (response.data.success) {
        await fetchJobs();
      } else {
        setError(response.data.message || 'Failed to retrieve jobs');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to retrieve jobs');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter jobs based on search criteria
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(job =>
        job.skills_required?.some(skill =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, skillFilter]);

  // Load jobs on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchJobs();
    };
    loadData();
  }, []);

  // Animation variants
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedJob(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getUniqueLocations = () => {
    return [...new Set(jobs.map(job => job.location).filter(Boolean))].sort();
  };

  const getUniqueSkills = () => {
    const allSkills = jobs.flatMap(job => job.skills_required || []);
    return [...new Set(allSkills)].sort();
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      backgroundColor: 'background.default', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Enhanced Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha('#fff', 0.1)}`
        }}
      >
        <Toolbar>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              background: alpha('#fff', 0.1),
              borderRadius: 3,
              p: 1,
              mr: 2
            }}>
              <WorkIcon sx={{ color: 'white' }} />
            </Box>
          </motion.div>
          
          <Typography variant="h5" component="div" sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #fff, #e0f2fe)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            Volunteer Opportunities Hub
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
              {totalJobs} Opportunities
            </Typography>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={retrieveNewJobs}
                disabled={loading || isRefreshing}
                sx={{
                  background: alpha('#fff', 0.1),
                  '&:hover': {
                    background: alpha('#fff', 0.2)
                  }
                }}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </motion.div>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Enhanced Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                icon: <PeopleIcon sx={{ fontSize: 40 }} />,
                title: 'Total Opportunities',
                value: stats.total,
                color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                delay: 0
              },
              {
                icon: <LocationIcon sx={{ fontSize: 40 }} />,
                title: 'Locations',
                value: stats.locations,
                color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                delay: 0.1
              },
              {
                icon: <CorporateFareIcon sx={{ fontSize: 40 }} />,
                title: 'Organizations',
                value: stats.organizations,
                color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                delay: 0.2
              },
              {
                icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
                title: 'Skills Available',
                value: stats.skills,
                color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                delay: 0.3
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
                <motion.div
                  variants={statsVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: stat.delay }}
                >
                  <Card sx={{ 
                    background: stat.color,
                    color: 'white',
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transform: 'translateX(-100%)',
                      transition: 'transform 0.6s'
                    },
                    '&:hover::before': {
                      transform: 'translateX(100%)'
                    }
                  }}>
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {stat.title}
                          </Typography>
                        </Box>
                        <Box sx={{
                          background: alpha('#fff', 0.2),
                          borderRadius: 3,
                          p: 1.5
                        }}>
                          {stat.icon}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#000', 0.1)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search opportunities by title, organization, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 3 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: 'white'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={locationFilter}
                    label="Location"
                    onChange={(e) => setLocationFilter(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="">All Locations</MenuItem>
                    {getUniqueLocations().map((location) => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Skill</InputLabel>
                  <Select
                    value={skillFilter}
                    label="Skill"
                    onChange={(e) => setSkillFilter(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="">All Skills</MenuItem>
                    {getUniqueSkills().map((skill) => (
                      <MenuItem key={skill} value={skill}>
                        {skill}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Tooltip title="Grid View">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <IconButton
                        color={viewMode === 'grid' ? 'primary' : 'default'}
                        onClick={() => setViewMode('grid')}
                        sx={{
                          background: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                        }}
                      >
                        <ViewModuleIcon />
                      </IconButton>
                    </motion.div>
                  </Tooltip>
                  <Tooltip title="List View">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <IconButton
                        color={viewMode === 'list' ? 'primary' : 'default'}
                        onClick={() => setViewMode('list')}
                        sx={{
                          background: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                        }}
                      >
                        <ViewListIcon />
                      </IconButton>
                    </motion.div>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Enhanced Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(244,67,54,0.2)'
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" my={8}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <CircularProgress size={60} thickness={4} />
            </motion.div>
          </Box>
        )}

        {/* Enhanced Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {filteredJobs.length} Opportunities Found
            </Typography>
            {lastUpdated && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Enhanced Jobs Grid/List */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                {filteredJobs.map((job, index) => (
                  <Grid item xs={12} sm={6} md={4} key={job._id}>
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          cursor: 'pointer',
                          borderRadius: 4,
                          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          border: `1px solid ${alpha('#000', 0.05)}`,
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                          }
                        }}
                        onClick={() => handleJobClick(job)}
                      >
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          {/* Header */}
                          <Box display="flex" alignItems="flex-start" mb={3}>
                            <Avatar sx={{ 
                              bgcolor: 'primary.main', 
                              mr: 2,
                              width: 50,
                              height: 50
                            }}>
                              <BusinessIcon />
                            </Avatar>
                            <Box flexGrow={1}>
                              <Typography variant="h6" component="h2" gutterBottom sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '56px',
                                fontWeight: '600'
                              }}>
                                {job.title}
                              </Typography>
                              <Typography color="primary" gutterBottom sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: '500'
                              }}>
                                {job.organization}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Description */}
                          <Typography variant="body2" color="text.secondary" paragraph sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '80px',
                            lineHeight: 1.6
                          }}>
                            {truncateText(job.description, 300)}
                          </Typography>

                          {/* Details */}
                          <Stack spacing={2} mb={3}>
                            {job.location && (
                              <Box display="flex" alignItems="center">
                                <LocationIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {job.location}
                                </Typography>
                              </Box>
                            )}
                            {job.time_commitment && (
                              <Box display="flex" alignItems="center">
                                <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {job.time_commitment}
                                </Typography>
                              </Box>
                            )}
                          </Stack>

                          {/* Skills */}
                          {job.skills_required && job.skills_required.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                REQUIRED SKILLS:
                              </Typography>
                              <Box>
                                {job.skills_required.slice(0, 3).map((skill, index) => (
                                  <Chip
                                    key={index}
                                    label={skill}
                                    size="small"
                                    sx={{ 
                                      mr: 1, 
                                      mb: 1,
                                      background: alpha(theme.palette.primary.main, 0.1),
                                      color: 'primary.main',
                                      fontWeight: '500'
                                    }}
                                  />
                                ))}
                                {job.skills_required.length > 3 && (
                                  <Chip
                                    label={`+${job.skills_required.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions sx={{ p: 3, pt: 0 }}>
                          <Button 
                            size="small" 
                            startIcon={<BookmarkIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<ShareIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Share
                          </Button>
                          <Box flexGrow={1} />
                          <Button 
                            size="small" 
                            color="primary"
                            variant="contained"
                            sx={{ borderRadius: 2 }}
                          >
                            View Details
                          </Button>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          ) : (
            /* Enhanced List View */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: 'white',
                        '&:hover': { 
                          background: alpha(theme.palette.primary.main, 0.02),
                          transform: 'translateX(8px)'
                        }
                      }}
                      onClick={() => handleJobClick(job)}
                    >
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>
                            {job.title}
                          </Typography>
                          <Typography color="primary" gutterBottom sx={{ fontWeight: '500', mb: 2 }}>
                            {job.organization}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.6, mb: 2 }}>
                            {truncateText(job.description, 200)}
                          </Typography>
                          <Stack direction="row" spacing={3} flexWrap="wrap">
                            {job.location && (
                              <Box display="flex" alignItems="center">
                                <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {job.location}
                                </Typography>
                              </Box>
                            )}
                            {job.time_commitment && (
                              <Box display="flex" alignItems="center">
                                <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {job.time_commitment}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box display="flex" flexDirection="column" alignItems="flex-end">
                            {job.skills_required && job.skills_required.length > 0 && (
                              <Box mb={3} textAlign="right">
                                {job.skills_required.slice(0, 3).map((skill, skillIndex) => (
                                  <Chip
                                    key={skillIndex}
                                    label={skill}
                                    size="small"
                                    sx={{ 
                                      mr: 0.5, 
                                      mb: 0.5,
                                      background: alpha(theme.palette.primary.main, 0.1),
                                      color: 'primary.main',
                                      fontWeight: '500'
                                    }}
                                  />
                                ))}
                                {job.skills_required.length > 3 && (
                                  <Chip
                                    label={`+${job.skills_required.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            )}
                            <Button 
                              variant="contained" 
                              size="small"
                              sx={{ borderRadius: 2 }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                    {index < filteredJobs.length - 1 && (
                      <Divider sx={{ mx: 4 }} />
                    )}
                  </motion.div>
                ))}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced No Results */}
        {filteredJobs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Paper sx={{ 
              p: 8, 
              textAlign: 'center', 
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
              <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No opportunities found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search terms or filters to find more opportunities
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}
      </Container>

      {/* Enhanced Job Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)'
          }
        }}
      >
        <AnimatePresence>
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <DialogTitle sx={{ pb: 2 }}>
                <Box display="flex" alignItems="center">
                  <Box sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    p: 1.5,
                    mr: 3
                  }}>
                    <BusinessIcon sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {selectedJob.title}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: '500' }}>
                      {selectedJob.organization}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, fontSize: '1.1rem' }}>
                  {selectedJob.description}
                </Typography>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {selectedJob.location && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
                        <LocationIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Location
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedJob.location}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {selectedJob.time_commitment && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
                        <ScheduleIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Time Commitment
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedJob.time_commitment}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {selectedJob.website && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
                        <LanguageIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Website
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            <a href={selectedJob.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                              Visit Organization
                            </a>
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {selectedJob.contact_email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
                        <EmailIcon color="primary" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Contact Email
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {selectedJob.contact_email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>
                      Required Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedJob.skills_required.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 4, p: 2, background: alpha('#000', 0.02), borderRadius: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Posted:</strong> {formatDate(selectedJob.created_at)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Source:</strong> {selectedJob.source}
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button 
                  onClick={handleCloseDialog}
                  sx={{ borderRadius: 2 }}
                >
                  Close
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<BookmarkIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Save Opportunity
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<EmailIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Apply Now
                </Button>
              </DialogActions>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </Box>
  );
};

export default ProfessionalDashboard;