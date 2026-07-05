const express = require('express');
const router = express.Router();

// USE /api
router.use('/api', require('./api'));
// USE /admin
// router.use('/admin', require('./admin'));

module.exports = router;