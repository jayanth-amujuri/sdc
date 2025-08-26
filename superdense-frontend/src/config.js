// Configuration for different backend phases
const config = {
  // Testing Phase - uses app.py on port 5000
  testing: {
    baseURL: 'http://localhost:5000',
    endpoints: {
      runSimulation: '/api/run_simulation',
      health: '/api/health'
    }
  },
  
  // Application Phase - uses application.py on port 5001
  application: {
    baseURL: 'http://localhost:5001',
    endpoints: {
      qkdSimulation: '/api/qkd_simulation',
      superdenseCoding: '/api/superdense_coding',
      fullSimulation: '/api/full_simulation',
      health: '/api/health'
    }
  }
};

export default config;
