const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-jwt-key-2026';

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query('SELECT id, name, email, avatar_url, role, bio FROM users WHERE id = $1', [decoded.id]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token. User no longer exists.' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: err.message });
  }
};

const checkProjectRole = (minRole = 'Viewer') => {
  const roleHierarchy = {
    'Viewer': 1,
    'Member': 2,
    'Admin': 3,
    'Owner': 4
  };

  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;
      if (!projectId) {
        return next();
      }

      // Check if project exists
      const projRes = await db.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
      if (projRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      // If user is direct owner of the project
      if (projRes.rows[0].owner_id === req.user.id) {
        req.projectRole = 'Owner';
        return next();
      }

      // Check project_members table
      const memRes = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (memRes.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project.' });
      }

      const userRole = memRes.rows[0].role;
      req.projectRole = userRole;

      if ((roleHierarchy[userRole] || 0) < (roleHierarchy[minRole] || 0)) {
        return res.status(403).json({
          success: false,
          message: `Action requires at least ${minRole} permissions. Your role is ${userRole}.`
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Permission check error.', error: err.message });
    }
  };
};

module.exports = {
  authenticate,
  checkProjectRole,
  JWT_SECRET
};
