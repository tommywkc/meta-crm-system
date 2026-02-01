const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { listByUsersId, findByUserId, updateByUserId, createUser, removeByUserId, findUserByMobile, findUserByEmail, findLatestId, findUserByQrToken, findUserByRole, searchUsers } = require('../dao/usersDao');
const { emptyToNull } = require('../function/dataSanitizer');
const crypto = require('crypto');



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
    // Return customer with ISO format datetime (no formatting needed)
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
    const q = req.query.q || '';

    let customers;
    if (q && q.trim()) {
      customers = await searchUsers(limit, offset, q);
    } else {
      customers = await listByUsersId(limit, offset);
    }

    console.log(`Retrieved ${customers.length} customer records (search q=${q})`);

    res.json({ customers });
  } catch (error) {
    console.error('Failed to retrieve customers list:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get User by id in view customer detail
router.get('/customers/:id', authMiddleware, async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('Received customer data request:', user_id, 'from user:', req.user.sub);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('Customer not found:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    // Return ISO format, frontend will format for display
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
    // Return ISO format, frontend will format for display
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

    if (updateData.mobile) {
      updateData.mobile = normalizeMobileForStorage(updateData.mobile);
    }

    // 手機／Email 重複檢查（排除自己）
    if (updateData.mobile && String(updateData.mobile) !== String(existing.mobile)) {
      const mobileOwner = await findUserByMobile(updateData.mobile);
      if (mobileOwner && String(mobileOwner.user_id) !== String(user_id)) {
        return res.status(409).json({ message: '手機號碼已被使用' });
      }
    }
    if (updateData.email && String(updateData.email) !== String(existing.email || '')) {
      const emailOwner = await findUserByEmail(updateData.email);
      if (emailOwner && String(emailOwner.user_id) !== String(user_id)) {
        return res.status(409).json({ message: 'Email 已被使用' });
      }
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

function normalizeMobileForStorage(mobile) {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.startsWith('852') && digits.length > 8) {
    return digits.slice(3);
  }
  return digits;
}

// Create a new customer
router.post('/customers', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const newCustomer = emptyToNull(req.body);
    console.log('Received create-customer request from user:', req.user.sub, 'with data:', newCustomer);

    if (!newCustomer.name || !newCustomer.mobile) {
      return res.status(400).json({ message: '缺少必要的客戶資料' });
    }

    newCustomer.mobile = normalizeMobileForStorage(newCustomer.mobile);

    // 手機／Email 重複檢查（給前端清楚訊息）
    const mobileOwner = await findUserByMobile(newCustomer.mobile);
    if (mobileOwner) {
      return res.status(409).json({ message: '手機號碼已被使用' });
    }
    if (newCustomer.email) {
      const emailOwner = await findUserByEmail(newCustomer.email);
      if (emailOwner) {
        return res.status(409).json({ message: 'Email 已被使用' });
      }
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

//handle get user detail in scan
router.get('/customers/scan/:qr_token', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const qr_token = req.params.qr_token;
    console.log('Received customer scan request with QR token:', qr_token, 'from user:', req.user.sub);

    const customer = await findUserByQrToken(qr_token);
    if (!customer) {
      console.log('Customer not found for QR token:', qr_token);
      return res.status(404).json({ message: '客戶不存在' });
    }
    // Return ISO format, frontend will format for display
    console.log('Successfully retrieved customer data from QR token');
    res.json({ customer });
  } catch (error) {
    console.error('Failed to retrieve customer data from QR token:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle find users by role
router.get('/customers/role/:role', authMiddleware, roleMiddleware(['admin', 'sales', 'leader']), async (req, res) => {
  try {
    const role = req.params.role;
    console.log('Received find-users-by-role request for role:', role, 'from user:', req.user.sub);

    const customers = await findUserByRole(role);
    console.log(`Retrieved ${customers.length} users with role ${role}`);

    res.json({ customers });
  } catch (error) {
    console.error('Failed to retrieve users by role:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


module.exports = router;