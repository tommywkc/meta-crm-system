const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { listByUsersId, findByUserId } = require('../dao/usersDao');

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

//handle get User by id
router.get('/customers/:id', async (req, res) => {
  try {
    const user_id = req.params.id;
    console.log('收到客戶資料請求:', user_id);

    const customer = await findByUserId(user_id);
    if (!customer) {
      console.log('未找到客戶:', user_id);
      return res.status(404).json({ message: '客戶不存在' });
    }
    console.log('取得客戶資料成功:', user_id);
    res.json({ customer });
  } catch (error) {
    console.error('取得客戶資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;