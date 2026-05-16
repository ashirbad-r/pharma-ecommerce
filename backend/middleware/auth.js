const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer token

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                message: 'No authorization token provided'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Token verification error:', err.message);
                
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Token expired',
                        message: 'Please login again'
                    });
                }
                
                return res.status(403).json({
                    error: 'Invalid token',
                    message: 'Token verification failed'
                });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({
            error: 'Authentication error',
            message: error.message
        });
    }
};

// Middleware to verify admin role
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin
};
