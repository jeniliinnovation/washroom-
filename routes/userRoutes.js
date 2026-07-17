const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Note: In strict production these endpoints would check for ADMIN or SUPER_ADMIN roles
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/', authMiddleware, userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id/status', authMiddleware, userController.updateUserStatus);
router.put('/:id/role', authMiddleware, userController.updateUserRole);
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
