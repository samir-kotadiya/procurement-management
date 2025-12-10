const express = require('express');
const users = require('./users');
const checklist = require('./checklist');
const orders = require('./orders');

const router = express.Router();

router.use('/users', users);
router.use('/checklist', checklist);
router.use('/orders', orders);

module.exports = router;
