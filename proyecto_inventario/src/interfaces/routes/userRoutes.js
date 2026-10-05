const express = require('express');
const { userController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// URL final: /api/users/... (todas requieren token)
router.use(authMiddleware);

router.get('/', asyncHandler(userController.list));
router.get('/:id', asyncHandler(userController.getById));
router.put('/:id', asyncHandler(userController.update));
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;
