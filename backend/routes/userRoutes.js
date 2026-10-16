const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/', getUsers);
router.put('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
