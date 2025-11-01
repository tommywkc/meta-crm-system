const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createEvent, listbyEventsId } = require('../dao/eventsDao');
const { emptyToNull } = require('../function/dataSanitizer');
const { formatDateTime } = require('../function/dateFormatter');

// JWT 設定
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';

//handle create new event
router.post('/events', async (req, res) => {
  try {
    console.log('收到建立活動請求:', req.body);

    const newEvent = emptyToNull(req.body);

    if (!newEvent.event_name || !newEvent.type) {
      return res.status(400).json({ message: '缺少必要的活動資料' });
    }

    if (newEvent.capacity != null) {
      newEvent.remaining_seats = newEvent.capacity;
    } else {
      newEvent.remaining_seats = null;
    }



    const createdEvent = await createEvent(newEvent);
    console.log('活動建立成功:');
    res.status(201).json({ message: '活動建立成功', event: createdEvent });
  } catch (error) {
    console.error('建立活動失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get events list
router.get('/events', async (req, res) => {
  try {
    console.log('收到Events列表請求');

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const events = await listbyEventsId(limit, offset);
    console.log(`取得 ${events.length} 筆活動資料`);

    // 使用 formatDateTime 格式化每筆活動的日期欄位
    const formattedEvents = events.map(e => ({
      ...e,
      datetime_start: e.datetime_start ? formatDateTime(e.datetime_start) : null,
      datetime_end: e.datetime_end ? formatDateTime(e.datetime_end) : null
    }));

    res.json({ events: formattedEvents });
  } catch (error) {
    console.error('取得活動列表失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});






module.exports = router;