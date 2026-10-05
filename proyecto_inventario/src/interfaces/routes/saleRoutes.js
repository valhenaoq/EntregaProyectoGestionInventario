const express = require('express');
const { saleController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// URL final: /api/sales/... (todas requieren token)
router.use(authMiddleware);

router.get('/', asyncHandler(saleController.list));
router.get('/:id', asyncHandler(saleController.getById));
router.post('/', asyncHandler(saleController.create));
router.put('/:id', asyncHandler(saleController.update));
router.delete('/:id', asyncHandler(saleController.remove));

module.exports = router;
