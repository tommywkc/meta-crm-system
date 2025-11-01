const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { listByUsersId, findByUserId, updateByUserId, createUser, removeByUserId } = require('../dao/usersDao');
const { emptyToNull } = require('../function/dataSanitizer');
const { formatDateTime } = require('../function/dateFormatter');

// JWT 設定
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';






//handle get customers list
router.get('/customers', async (req, res) => {
  try {
    console.log('收到客戶列表請求');

    // 根據需要實現分頁
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const customers = await listByUsersId(limit, offset);
    console.log(`取得 ${customers.length} 筆客戶資料`);

    res.json({ customers });
  } catch (error) {
    console.error('取得客戶列表失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get User by id in view customer detail
router.get('/customers/:id', async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('收到客戶資料請求:', user_id);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('未找到客戶:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    if (customer.create_time) {
      customer.create_time = formatDateTime(customer.create_time);
    }
    console.log('取得客戶資料成功:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('取得客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get User by id in edit customer detail
router.get('/customers/:id/edit', async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('收到客戶資料請求:', user_id);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('未找到客戶:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    if (customer.create_time) {
      customer.create_time = formatDateTime(customer.create_time);
    }
    console.log('取得客戶資料成功:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('取得客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle update User by id in edit customer detail
router.put('/customers/:id', async (req, res) => {
  try {
    const user_id = req.params.id;
    const updateData = emptyToNull(req.body);
    console.log('收到更新客戶資料請求:', user_id, updateData);

    const existing = await findByUserId(user_id);
    if (!existing) {
      return res.status(404).json({ message: '客戶不存在' });
    }

    const updated = await updateByUserId(user_id, updateData);

    console.log('更新客戶資料成功:', user_id);
    res.json({ message: '客戶資料更新成功', customer: updated });
  } catch (error) {
    console.error('更新客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle create new customer
router.post('/customers', async (req, res) => {
  try {
    const newCustomer = emptyToNull(req.body);   // ✅ 先宣告
    console.log('收到新增客戶資料請求:', newCustomer);

    if (!newCustomer.name || !newCustomer.mobile) {
      return res.status(400).json({ message: '缺少必要的客戶資料' });
    }
    if (newCustomer.password == null) {
      newCustomer.password = newCustomer.mobile;
    }

    const createdCustomer = await createUser(newCustomer);
    console.log('新增客戶資料成功:', createdCustomer.user_id);
    res.status(201).json({ message: '客戶新增成功', customer: createdCustomer });
  } catch (error) {
    console.error('新增客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle delete User by id
router.delete('/customers/:id', async (req, res) => {
  try {
    console.log('收到刪除客戶資料請求');
    const user_id = req.params.id;
    console.log('收到刪除客戶資料請求:', user_id);

    const existing = await findByUserId(user_id);
    if (!existing) {
      return res.status(404).json({ message: '客戶不存在' });
    }

    await removeByUserId(user_id);
    console.log('刪除客戶資料成功:', user_id);
    res.json({ message: '客戶資料刪除成功' });
  } catch (error) {
    console.error('刪除客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;