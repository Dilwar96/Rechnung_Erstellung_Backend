import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token from Authorization header
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header (format: "Bearer TOKEN")
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Keine Authentifizierung vorhanden. Token erforderlich.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token fehlt' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request object for use in controllers
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Ungültiges Token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token ist abgelaufen. Bitte erneut anmelden.' 
      });
    }
    return res.status(401).json({ 
      message: 'Authentifizierung fehlgeschlagen',
      error: error.message 
    });
  }
};

export default authMiddleware;
