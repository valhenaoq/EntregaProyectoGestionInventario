const express = require('express');
const { productController } = require('../../container');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// URL final: /api/products/... (todas requieren token)
router.use(authMiddleware);

router.get('/', asyncHandler(productController.list));
router.get('/:id', asyncHandler(productController.getById));
router.post('/', asyncHandler(productController.create));
router.put('/:id', asyncHandler(productController.update));
router.delete('/:id', asyncHandler(productController.remove));

module.exports = router;
