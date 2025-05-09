import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log(decoded);
    req.user = decoded;

    next(); 
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};
