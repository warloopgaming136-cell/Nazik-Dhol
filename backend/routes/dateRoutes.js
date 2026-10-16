const express = require('express');
const router = express.Router();
const { getDates, setDate, deleteDate } = require('../controllers/dateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDates);
router.post('/', protect, authorize('admin'), setDate);
router.delete('/:id', protect, authorize('admin'), deleteDate);

module.exports = router;
