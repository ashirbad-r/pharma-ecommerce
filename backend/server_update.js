// Copy the entire server.js content and find this section:
// Add these lines BEFORE the "404 HANDLER" comment:

// ====================================
// ROUTES REGISTRATION
// ====================================
// Authentication Routes
app.use('/api/auth', require('./routes/auth'));
