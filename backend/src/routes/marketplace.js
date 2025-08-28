const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   GET /api/marketplace/items
 * @desc    Get marketplace items with filters
 * @access  Public
 */
router.get('/items',
  validate(Joi.object({
    category: schemas.common.instrument.optional(),
    condition: Joi.string().valid('New', 'Like New', 'Good', 'Fair').optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    location: Joi.string().max(255).optional(),
    shippingAvailable: Joi.boolean().optional(),
    verificationStatus: Joi.string().valid('pending', 'verified', 'rejected').optional(),
    search: Joi.string().max(100).optional(),
    ...schemas.common.pagination
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { 
      category, condition, minPrice, maxPrice, location, shippingAvailable, 
      verificationStatus, search, page, limit, sort, order 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT mi.id, mi.title, mi.description, mi.price, mi.currency, mi.category,
             mi.condition, mi.brand, mi.model, mi.year_manufactured, mi.images_urls,
             mi.status, mi.location, mi.shipping_available, mi.verification_status,
             mi.created_at, mi.updated_at,
             u.id as seller_id, u.name as seller_name, u.avatar_url as seller_avatar,
             u.is_verified as seller_verified
      FROM marketplace_items mi
      LEFT JOIN users u ON mi.seller_id = u.id
      WHERE mi.status = 'available'
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND mi.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (condition) {
      query += ` AND mi.condition = $${paramIndex}`;
      queryParams.push(condition);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      query += ` AND mi.price >= $${paramIndex}`;
      queryParams.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      query += ` AND mi.price <= $${paramIndex}`;
      queryParams.push(maxPrice);
      paramIndex++;
    }

    if (location) {
      query += ` AND mi.location ILIKE $${paramIndex}`;
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    if (shippingAvailable !== undefined) {
      query += ` AND mi.shipping_available = $${paramIndex}`;
      queryParams.push(shippingAvailable);
      paramIndex++;
    }

    if (verificationStatus) {
      query += ` AND mi.verification_status = $${paramIndex}`;
      queryParams.push(verificationStatus);
      paramIndex++;
    }

    if (search) {
      query += ` AND (mi.title ILIKE $${paramIndex} OR mi.description ILIKE $${paramIndex} OR mi.brand ILIKE $${paramIndex} OR mi.model ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering
    const validSortFields = {
      'created_at': 'mi.created_at',
      'price': 'mi.price',
      'title': 'mi.title',
      'updated_at': 'mi.updated_at'
    };

    const sortField = validSortFields[sort] || 'mi.created_at';
    query += ` ORDER BY ${sortField} ${order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM marketplace_items mi WHERE mi.status = 'available'`;
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND mi.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (condition) {
      countQuery += ` AND mi.condition = $${countParamIndex}`;
      countParams.push(condition);
      countParamIndex++;
    }

    if (minPrice !== undefined) {
      countQuery += ` AND mi.price >= $${countParamIndex}`;
      countParams.push(minPrice);
      countParamIndex++;
    }

    if (maxPrice !== undefined) {
      countQuery += ` AND mi.price <= $${countParamIndex}`;
      countParams.push(maxPrice);
      countParamIndex++;
    }

    if (location) {
      countQuery += ` AND mi.location ILIKE $${countParamIndex}`;
      countParams.push(`%${location}%`);
      countParamIndex++;
    }

    if (shippingAvailable !== undefined) {
      countQuery += ` AND mi.shipping_available = $${countParamIndex}`;
      countParams.push(shippingAvailable);
      countParamIndex++;
    }

    if (verificationStatus) {
      countQuery += ` AND mi.verification_status = $${countParamIndex}`;
      countParams.push(verificationStatus);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (mi.title ILIKE $${countParamIndex} OR mi.description ILIKE $${countParamIndex} OR mi.brand ILIKE $${countParamIndex} OR mi.model ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        items: result.rows.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: parseFloat(item.price),
          currency: item.currency,
          category: item.category,
          condition: item.condition,
          brand: item.brand,
          model: item.model,
          yearManufactured: item.year_manufactured,
          imagesUrls: item.images_urls,
          status: item.status,
          location: item.location,
          shippingAvailable: item.shipping_available,
          verificationStatus: item.verification_status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          seller: {
            id: item.seller_id,
            name: item.seller_name,
            avatarUrl: item.seller_avatar,
            isVerified: item.seller_verified
          }
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/marketplace/items/:itemId
 * @desc    Get marketplace item by ID
 * @access  Public
 */
router.get('/items/:itemId',
  validate(Joi.object({ itemId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const result = await db.query(`
      SELECT mi.*, 
             u.id as seller_id, u.name as seller_name, u.avatar_url as seller_avatar,
             u.is_verified as seller_verified, u.join_date as seller_join_date
      FROM marketplace_items mi
      LEFT JOIN users u ON mi.seller_id = u.id
      WHERE mi.id = $1
    `, [itemId]);

    if (result.rows.length === 0) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }

    const item = result.rows[0];

    res.json({
      success: true,
      data: {
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          price: parseFloat(item.price),
          currency: item.currency,
          category: item.category,
          condition: item.condition,
          brand: item.brand,
          model: item.model,
          yearManufactured: item.year_manufactured,
          serialNumber: item.serial_number,
          imagesUrls: item.images_urls,
          status: item.status,
          location: item.location,
          shippingAvailable: item.shipping_available,
          verificationStatus: item.verification_status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          seller: {
            id: item.seller_id,
            name: item.seller_name,
            avatarUrl: item.seller_avatar,
            isVerified: item.seller_verified,
            joinDate: item.seller_join_date
          }
        }
      }
    });
  })
);

/**
 * @route   POST /api/marketplace/items
 * @desc    Create new marketplace item
 * @access  Private
 */
router.post('/items',
  authenticateToken,
  upload.array('images', 10),
  validate(schemas.marketplace.createItem),
  asyncHandler(async (req, res) => {
    const {
      title, description, price, currency, category, condition, brand, model,
      yearManufactured, serialNumber, location, shippingAvailable
    } = req.body;

    // Upload images to Cloudinary
    if (!req.files || req.files.length === 0) {
      throw new AppError('At least one image is required', 400, 'NO_IMAGES');
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'music-practice/marketplace',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    let imagesUrls;
    try {
      imagesUrls = await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Images upload error:', error);
      throw new AppError('Failed to upload images', 500, 'UPLOAD_FAILED');
    }

    const result = await db.query(`
      INSERT INTO marketplace_items (
        title, description, price, currency, category, condition, brand, model,
        year_manufactured, serial_number, seller_id, images_urls, location, shipping_available
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      title, description, price, currency, category, condition, brand, model,
      yearManufactured, serialNumber, req.user.id, imagesUrls, location, shippingAvailable
    ]);

    const item = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Item listed successfully',
      data: {
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          price: parseFloat(item.price),
          currency: item.currency,
          category: item.category,
          condition: item.condition,
          brand: item.brand,
          model: item.model,
          yearManufactured: item.year_manufactured,
          serialNumber: item.serial_number,
          imagesUrls: item.images_urls,
          status: item.status,
          location: item.location,
          shippingAvailable: item.shipping_available,
          verificationStatus: item.verification_status,
          createdAt: item.created_at
        }
      }
    });
  })
);

/**
 * @route   PUT /api/marketplace/items/:itemId
 * @desc    Update marketplace item
 * @access  Private (Seller only)
 */
router.put('/items/:itemId',
  authenticateToken,
  validate(Joi.object({ itemId: schemas.common.uuid }), 'params'),
  validate(schemas.marketplace.updateItem),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    // Check if item exists and user is the seller
    const itemResult = await db.query(
      'SELECT seller_id, status FROM marketplace_items WHERE id = $1',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }

    const item = itemResult.rows[0];

    if (item.seller_id !== req.user.id) {
      throw new AppError('You can only update items you listed', 403, 'ACCESS_DENIED');
    }

    if (item.status === 'sold') {
      throw new AppError('Cannot update sold items', 400, 'ITEM_SOLD');
    }

    const {
      title, description, price, condition, brand, model,
      yearManufactured, location, shippingAvailable, status
    } = req.body;

    const result = await db.query(`
      UPDATE marketplace_items 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          condition = COALESCE($4, condition),
          brand = COALESCE($5, brand),
          model = COALESCE($6, model),
          year_manufactured = COALESCE($7, year_manufactured),
          location = COALESCE($8, location),
          shipping_available = COALESCE($9, shipping_available),
          status = COALESCE($10, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      title, description, price, condition, brand, model,
      yearManufactured, location, shippingAvailable, status, itemId
    ]);

    const updatedItem = result.rows[0];

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: {
        item: {
          id: updatedItem.id,
          title: updatedItem.title,
          description: updatedItem.description,
          price: parseFloat(updatedItem.price),
          currency: updatedItem.currency,
          category: updatedItem.category,
          condition: updatedItem.condition,
          brand: updatedItem.brand,
          model: updatedItem.model,
          yearManufactured: updatedItem.year_manufactured,
          serialNumber: updatedItem.serial_number,
          imagesUrls: updatedItem.images_urls,
          status: updatedItem.status,
          location: updatedItem.location,
          shippingAvailable: updatedItem.shipping_available,
          verificationStatus: updatedItem.verification_status,
          createdAt: updatedItem.created_at,
          updatedAt: updatedItem.updated_at
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/marketplace/items/:itemId
 * @desc    Delete marketplace item
 * @access  Private (Seller only)
 */
router.delete('/items/:itemId',
  authenticateToken,
  validate(Joi.object({ itemId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const result = await db.query(
      'DELETE FROM marketplace_items WHERE id = $1 AND seller_id = $2 RETURNING id',
      [itemId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Item not found or you do not have permission to delete it', 404, 'ITEM_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  })
);

/**
 * @route   GET /api/marketplace/my-items
 * @desc    Get current user's marketplace items
 * @access  Private
 */
router.get('/my-items',
  authenticateToken,
  validate(Joi.object({
    status: Joi.string().valid('available', 'sold', 'reserved').optional(),
    ...schemas.common.pagination
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, description, price, currency, category, condition,
             brand, model, images_urls, status, location, shipping_available,
             verification_status, created_at, updated_at
      FROM marketplace_items
      WHERE seller_id = $1
    `;

    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM marketplace_items WHERE seller_id = $1`;
    const countParams = [req.user.id];

    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        items: result.rows.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: parseFloat(item.price),
          currency: item.currency,
          category: item.category,
          condition: item.condition,
          brand: item.brand,
          model: item.model,
          imagesUrls: item.images_urls,
          status: item.status,
          location: item.location,
          shippingAvailable: item.shipping_available,
          verificationStatus: item.verification_status,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/marketplace/categories
 * @desc    Get marketplace categories with item counts
 * @access  Public
 */
router.get('/categories',
  asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT category, COUNT(*) as item_count
      FROM marketplace_items
      WHERE status = 'available' AND verification_status = 'verified'
      GROUP BY category
      ORDER BY item_count DESC
    `);

    res.json({
      success: true,
      data: {
        categories: result.rows.map(row => ({
          name: row.category,
          itemCount: parseInt(row.item_count)
        }))
      }
    });
  })
);

/**
 * @route   POST /api/marketplace/items/:itemId/verify
 * @desc    Verify/reject marketplace item (Admin only)
 * @access  Private (Admin only)
 */
router.post('/items/:itemId/verify',
  authenticateToken,
  validate(Joi.object({ itemId: schemas.common.uuid }), 'params'),
  validate(Joi.object({
    status: Joi.string().valid('verified', 'rejected').required(),
    reason: Joi.string().max(500).when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })),
  asyncHandler(async (req, res) => {
    // Check if user has admin privileges (verified instructor for now)
    if (!req.user.is_instructor || !req.user.is_verified) {
      throw new AppError('Admin access required', 403, 'ACCESS_DENIED');
    }

    const { itemId } = req.params;
    const { status, reason } = req.body;

    const result = await db.query(
      'UPDATE marketplace_items SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, itemId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }

    // TODO: Send notification to seller about verification status
    // This could be implemented with email service or push notifications

    res.json({
      success: true,
      message: `Item ${status} successfully`,
      data: {
        verificationStatus: status,
        reason: reason || null
      }
    });
  })
);

module.exports = router;