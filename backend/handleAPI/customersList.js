const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { listByUsersId, findByUserId, updateByUserId, createUser, removeByUserId, findUserByMobile, findLatestId } = require('../dao/usersDao');
const { emptyToNull } = require('../function/dataSanitizer');
const { formatDateTime } = require('../function/dateFormatter');
const crypto = require('crypto');


// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';



router.get('/customers/myqrcode', authMiddleware, async (req, res) => {
  try {
    // User can only view their own QR code
    const user_id = req.user.sub; // Use authenticated user's ID
    console.log('Received customer QR code request for user:', user_id);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('Customer not found:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    if (customer.create_time) {
      customer.create_time = formatDateTime(customer.create_time);
    }
    console.log('Successfully retrieved customer QR code:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('Failed to retrieve customer data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle get customers list
router.get('/customers', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    console.log('Received customers list request from user:', req.user.sub);

    // Implement pagination as needed
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const customers = await listByUsersId(limit, offset);
    console.log(`Retrieved ${customers.length} customer records`);

    res.json({ customers });
  } catch (error) {
    console.error('Failed to retrieve customers list:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get User by id in view customer detail
router.get('/customers/:id', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('Received customer data request:', user_id, 'from user:', req.user.sub);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('Customer not found:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    if (customer.create_time) {
      customer.create_time = formatDateTime(customer.create_time);
    }
    console.log('Successfully retrieved customer data:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('Failed to retrieve customer data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get User by id in edit customer detail
router.get('/customers/:id/edit', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('Received customer data (edit) request:', user_id, 'from user:', req.user.sub);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('Customer not found:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    if (customer.create_time) {
      customer.create_time = formatDateTime(customer.create_time);
    }
    console.log('Successfully retrieved customer data for edit:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('Failed to retrieve customer data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle update User by id in edit customer detail
router.put('/customers/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user_id = req.params.id;
    const updateData = emptyToNull(req.body);
    console.log('Received customer update request:', user_id, 'from user:', req.user.sub);

    const existing = await findByUserId(user_id);
    if (!existing) {
      return res.status(404).json({ message: '客戶不存在' });
    }

    const updated = await updateByUserId(user_id, updateData);

    console.log('Successfully updated customer data:', user_id);
    res.json({ message: '客戶資料更新成功', customer: updated });
  } catch (error) {
    console.error('Failed to update customer data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


function generateQrToken(mobile) {
  const timestamp = Date.now().toString();
  const uniqueSource = `${mobile}-${timestamp}-${Math.random()}`;
  const hash = crypto.createHash('sha256').update(uniqueSource).digest('hex');
  // Optional: shorten to 16–24 chars for QR display convenience
  return hash.substring(0, 24);
}

// Create a new customer
router.post('/customers', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const newCustomer = emptyToNull(req.body);
    console.log('Received create-customer request from user:', req.user.sub, 'with data:', newCustomer);

    if (!newCustomer.name || !newCustomer.mobile) {
      return res.status(400).json({ message: '缺少必要的客戶資料' });
    }
    if (newCustomer.password == null) {
      newCustomer.password = newCustomer.mobile;
    }

    const qr_token = generateQrToken(newCustomer.mobile);
    newCustomer.qr_token = qr_token;

    const latestId = parseInt(await findLatestId());
    newCustomer.user_id = (latestId || 49999) + 1;

    const createdCustomer = await createUser(newCustomer);
    console.log('Successfully created customer:', createdCustomer.user_id);
    newId = createdCustomer.user_id;
    // Return the new customer id to frontend for redirecting to customer detail page
    res.status(201).json({
      message: '客戶新增成功',
      newId: createdCustomer.user_id
    });
  } catch (error) {
    console.error('Failed to create customer:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle delete User by id
router.delete('/customers/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    console.log('Received delete-customer request from user:', req.user.sub);
    const user_id = req.params.id;
    console.log('Deleting customer:', user_id);

    const existing = await findByUserId(user_id);
    if (!existing) {
      return res.status(404).json({ message: '客戶不存在' });
    }

    await removeByUserId(user_id);
    console.log('Successfully deleted customer:', user_id);
    res.json({ message: '客戶資料刪除成功' });
  } catch (error) {
    console.error('Failed to delete customer data:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;