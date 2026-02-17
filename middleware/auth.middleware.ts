import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Initialize JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN || 'dev-csw4n464gbo2s3pe.us.auth0.com'}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Helper function to get the signing key from Auth0
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Socket.IO token verification middleware
export const verifySocketToken = (socket: any, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  jwt.verify(
    token,
    getKey,
    {
      audience: process.env.AUTH0_AUDIENCE || 'https://my-api.com', // Your API Identifier in Auth0
      issuer: `https://${process.env.AUTH0_DOMAIN || 'dev-csw4n464gbo2s3pe.us.auth0.com'}/`,
      algorithms: ['RS256']
    },
    (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Type assertion for the decoded payload
      const payload = decoded as JwtPayload;
      
      // Attach user info to the socket object for future use
      socket.user = payload;
      socket.userId = payload.sub;
      socket.userEmail = payload.email || '';
      socket.userName = payload.name || payload.nickname || 'Unknown';
      
      console.log(`User authenticated: ${payload.sub} (${payload.email})`);
      next();
    }
  );
};

// Express middleware for HTTP endpoints
export const verifyHttpToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication error: Token missing or malformed',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);

  jwt.verify(
    token,
    getKey,
    {
      audience: process.env.AUTH0_AUDIENCE || 'https://my-api.com',
      issuer: `https://${process.env.AUTH0_DOMAIN || 'dev-csw4n464gbo2s3pe.us.auth0.com'}/`,
      algorithms: ['RS256']
    },
    (err, decoded) => {
      if (err) {
        console.error('HTTP JWT verification error:', err.message);
        return res.status(401).json({
          error: 'Authentication error: Invalid token',
          message: 'Your token has expired or is invalid'
        });
      }
      
      // Type assertion for the decoded payload
      const payload = decoded as JwtPayload;
      
      // Attach user info to request object
      req.user = payload;
      req.userId = payload.sub;
      req.userEmail = payload.email || '';
      req.userName = payload.name || payload.nickname || 'Unknown';
      
      next();
    }
  );
};

// Helper function to decode token without verification (for debugging)
export const decodeToken = (token: string) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// Health check for JWKS endpoint
export const checkJwksHealth = async () => {
  try {
    const keys = await client.getSigningKeys();
    console.log(`JWKS health check passed: ${keys.length} keys available`);
    return true;
  } catch (error) {
    console.error('JWKS health check failed:', error);
    return false;
  }
};
