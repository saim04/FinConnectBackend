// middlewares/role.middleware.js

export const verifyAdminRole = (req, res, next) => {
    const decodedUser = req.user;  // Assuming the user info is already decoded in req.user by `verifyToken`
  
    if (!decodedUser || decodedUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
  
    next();  // Proceed if the user is an Admin
};
  