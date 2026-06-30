export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user || req.admin;
    if (!user) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission for this action" });
    }

    next();
  };
}
