const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createEvent, listbyEventsId, findLatestEventId, findByEventId, updateByEventId, removeByEventId } = require('../dao/eventsDao');
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

    const latestId = parseInt(await findLatestEventId());
    newEvent.event_id = (latestId || 100) + 1;


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

//handle get event detail in view
router.get('/events/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log('收到 event 資料請求:', id);

    if (isNaN(id)) {
      return res.status(400).json({ message: '無效的事件 ID' });
    }

    const event = await findByEventId(id);
    if (!event) {
      console.log('未找到 event:', id);
      return res.status(404).json({ message: 'event 不存在' });
    }

    if (event.create_time) {
      event.create_time = formatDateTime(event.create_time);
    }
    if (event.datetime_start) {
      event.datetime_start = formatDateTime(event.datetime_start);
    }
    if (event.datetime_end) {
      event.datetime_end = formatDateTime(event.datetime_end);
    }
    

    console.log('取得 event 資料成功:', id);
    console.log(event);
    res.json({ event });

  } catch (error) {
    console.error('取得 event 資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle update event details
router.put('/events/:id', async (req, res) => {
  try {
    const event_id = req.params.id;
    const updateData = emptyToNull(req.body);
    console.log('收到更新event資料請求:', event_id, updateData);

    const existing = await findByEventId(event_id);
    if (!existing) {
      return res.status(404).json({ message: 'event不存在' });
    }

    const updated = await updateByEventId(event_id, updateData);

    console.log('更新event資料成功:', event_id);
    res.json({ message: 'event資料更新成功', event: updated });
  } catch (error) {
    console.error('更新event資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle delete Event by id
router.delete('/events/:id', async (req, res) => {
  try {
    console.log('收到刪除event資料請求');
    const event_id = req.params.id;
    console.log('收到刪除event資料請求:', event_id);

    const existing = await findByEventId(event_id);
    if (!existing) {
      return res.status(404).json({ message: 'event不存在' });
    }

    await removeByEventId(event_id);
    console.log('刪除event資料成功:', event_id);
    res.json({ message: 'event資料刪除成功' });
  } catch (error) {
    console.error('刪除event資料失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


module.exports = router;