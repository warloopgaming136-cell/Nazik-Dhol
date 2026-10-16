const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teamController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload, setUploadType } = require('../middleware/upload');

router.get('/', optionalAuth, ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', protect, authorize('admin'), setUploadType('team'), upload.single('photo'), ctrl.create);
router.put('/:id', protect, authorize('admin'), setUploadType('team'), upload.single('photo'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
