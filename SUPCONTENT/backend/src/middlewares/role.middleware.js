export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const userRoles = req.user.roles.map(r => r.toLowerCase());

    const hasRole = userRoles.some(role =>
      allowedRoles.map(r => r.toLowerCase()).includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    next();
  };
};