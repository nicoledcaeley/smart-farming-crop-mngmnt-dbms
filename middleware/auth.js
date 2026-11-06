const allowRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.session?.user?.role || req.session?.user?.role_name;
    if (req.session && req.session.user && roles.includes(userRole)) {
      return next();
    }
    return res.status(403).send('Access Denied: You do not have permission to view this page');
  };
};
module.exports = { allowRoles };
