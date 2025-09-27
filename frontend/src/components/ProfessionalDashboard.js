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
  Stack
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
  Language as LanguageIcon
} from '@mui/icons-material';
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    skills: [],
    organizations: []
  });

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/jobs?limit=100`);
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
      setTotalJobs(response.data.total);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/filters`);
      // This will be used to populate filter dropdowns
      return response.data;
    } catch (err) {
      console.error('Error fetching filter options:', err);
      return { locations: [], skills: [], organizations: [] };
    }
  };

  // Retrieve new jobs from external API
  const retrieveNewJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/api/jobs/retrieve`, {
        limit: 50
      });
      
      if (response.data.success) {
        // Refresh the jobs list after successful retrieval
        await fetchJobs();
      } else {
        setError(response.data.message || 'Failed to retrieve jobs');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to retrieve jobs');
    } finally {
      setLoading(false);
    }
  };

  // Get jobs count
  const getJobsCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/count`);
      setTotalJobs(response.data.total_jobs);
    } catch (err) {
      console.error('Error getting jobs count:', err);
    }
  };

  // Filter jobs based on search criteria
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.organization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(job =>
        job.skills_required.some(skill =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, skillFilter]);

  // Load jobs and filter options on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchJobs();
      await getJobsCount();
      const options = await fetchFilterOptions();
      setFilterOptions(options);
    };
    loadData();
  }, []);

  // Use filter options from API
  const uniqueLocations = filterOptions.locations;
  const uniqueSkills = filterOptions.skills;

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

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <PeopleIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Volunteer Opportunities Dashboard
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: 'white' }}>
              {totalJobs} Opportunities
            </Typography>
            <Button
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={retrieveNewJobs}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e3f2fd' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PeopleIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Opportunities
                    </Typography>
                    <Typography variant="h4">
                      {totalJobs}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#f3e5f5' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <LocationIcon color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Locations
                    </Typography>
                    <Typography variant="h4">
                      {uniqueLocations.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e8f5e8' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <BusinessIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Organizations
                    </Typography>
                    <Typography variant="h4">
                      {[...new Set(jobs.map(job => job.organization).filter(Boolean))].length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Skills Available
                    </Typography>
                    <Typography variant="h4">
                      {uniqueSkills.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
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
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {uniqueLocations.map((location) => (
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
                >
                  <MenuItem value="">All Skills</MenuItem>
                  {uniqueSkills.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Grid View">
                  <IconButton
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                  >
                    <ViewModuleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Results Count */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          {filteredJobs.length} of {totalJobs} opportunities
          {lastUpdated && (
            <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 2 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Typography>

        {/* Jobs Grid/List */}
        {viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleJobClick(job)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="flex-start" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {job.title}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {job.organization}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="textSecondary" paragraph>
                      {truncateText(job.description, 150)}
                    </Typography>

                    {job.location && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {job.location}
                        </Typography>
                      </Box>
                    )}

                    {job.time_commitment && (
                      <Box display="flex" alignItems="center" mb={2}>
                        <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {job.time_commitment}
                        </Typography>
                      </Box>
                    )}

                    {job.skills_required && job.skills_required.length > 0 && (
                      <Box>
                        {job.skills_required.slice(0, 3).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                            color="primary"
                            variant="outlined"
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
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<StarIcon />}>
                      Save
                    </Button>
                    <Button size="small" startIcon={<ShareIcon />}>
                      Share
                    </Button>
                    <Button size="small" color="primary">
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* List View */
          <Paper>
            {filteredJobs.map((job, index) => (
              <Box key={job._id}>
                <Box
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                  onClick={() => handleJobClick(job)}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom>
                        {job.title}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {job.organization}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {truncateText(job.description, 200)}
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {job.location && (
                          <Box display="flex" alignItems="center">
                            <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="textSecondary">
                              {job.location}
                            </Typography>
                          </Box>
                        )}
                        {job.time_commitment && (
                          <Box display="flex" alignItems="center">
                            <ScheduleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="textSecondary">
                              {job.time_commitment}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box display="flex" flexDirection="column" alignItems="flex-end">
                        {job.skills_required && job.skills_required.length > 0 && (
                          <Box mb={2}>
                            {job.skills_required.slice(0, 2).map((skill, skillIndex) => (
                              <Chip
                                key={skillIndex}
                                label={skill}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                            {job.skills_required.length > 2 && (
                              <Chip
                                label={`+${job.skills_required.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        )}
                        <Button variant="outlined" size="small">
                          View Details
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                {index < filteredJobs.length - 1 && <Divider />}
              </Box>
            ))}
          </Paper>
        )}

        {/* No Results */}
        {filteredJobs.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No opportunities found matching your criteria
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Try adjusting your search terms or filters
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Job Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{selectedJob.title}</Typography>
                  <Typography color="textSecondary">{selectedJob.organization}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedJob.description}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {selectedJob.location && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <LocationIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Location:</strong> {selectedJob.location}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedJob.time_commitment && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <ScheduleIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Time Commitment:</strong> {selectedJob.time_commitment}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedJob.website && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <LanguageIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Website:</strong>{' '}
                        <a href={selectedJob.website} target="_blank" rel="noopener noreferrer">
                          Visit Organization
                        </a>
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedJob.contact_email && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedJob.contact_email}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Required Skills:
                  </Typography>
                  <Box>
                    {selectedJob.skills_required.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        sx={{ mr: 1, mb: 1 }}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Posted:</strong> {formatDate(selectedJob.created_at)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Source:</strong> {selectedJob.source}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button variant="contained" startIcon={<BookmarkIcon />}>
                Save Opportunity
              </Button>
              <Button variant="contained" color="primary" startIcon={<EmailIcon />}>
                Apply Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProfessionalDashboard;
