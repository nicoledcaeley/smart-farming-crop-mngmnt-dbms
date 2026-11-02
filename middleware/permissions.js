
function allowRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        if (!allowedRoles.includes(req.session.user.role_name)) {
            return res.status(403).send('Access denied. You do not have permission to access this page.');
        }

        next();
    };
}

module.exports = { allowRoles };
