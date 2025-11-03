const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createEvent, listbyEventsId, findLatestEventId, findByEventId, updateByEventId, removeByEventId } = require('../dao/eventsDao');
const { emptyToNull } = require('../function/dataSanitizer');
const { formatDateTime } = require('../function/dateFormatter');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';

//handle create new event
router.post('/events', async (req, res) => {
  try {
  console.log('Received create event request:', req.body);

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
    console.log('Event created successfully:');
    res.status(201).json({ message: '活動建立成功', event: createdEvent });
  } catch (error) {
    console.error('Create event failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get events list
router.get('/events', async (req, res) => {
  try {
  console.log('Received events list request');

  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const events = await listbyEventsId(limit, offset);
  console.log(`Retrieved ${events.length} events`);

    // 使用 formatDateTime 格式化每筆活動的日期欄位
    const formattedEvents = events.map(e => ({
      ...e,
      datetime_start: e.datetime_start ? formatDateTime(e.datetime_start) : null,
      datetime_end: e.datetime_end ? formatDateTime(e.datetime_end) : null
    }));

    res.json({ events: formattedEvents });
  } catch (error) {
    console.error('Get events list failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

//handle get event detail in view
router.get('/events/:id', async (req, res) => {
  try {
  const id = parseInt(req.params.id, 10);
  console.log('Received event data request:', id);

    if (isNaN(id)) {
      return res.status(400).json({ message: '無效的事件 ID' });
    }

    const event = await findByEventId(id);
    if (!event) {
      console.log('Event not found:', id);
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
    

  console.log('Successfully retrieved event data:', id);
  console.log(event);
    res.json({ event });

  } catch (error) {
    console.error('Get event data failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle update event details
router.put('/events/:id', async (req, res) => {
  try {
  const event_id = req.params.id;
  const updateData = emptyToNull(req.body);
  console.log('Received update event request:', event_id, updateData);

    const existing = await findByEventId(event_id);
    if (!existing) {
      return res.status(404).json({ message: 'event不存在' });
    }

    const updated = await updateByEventId(event_id, updateData);

    console.log('Update event data successful:', event_id);
    res.json({ message: 'event資料更新成功', event: updated });
  } catch (error) {
    console.error('Update event data failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


//handle delete Event by id
router.delete('/events/:id', async (req, res) => {
  try {
  console.log('Received delete event request');
  const event_id = req.params.id;
  console.log('Received delete event request:', event_id);

    const existing = await findByEventId(event_id);
    if (!existing) {
      return res.status(404).json({ message: 'event不存在' });
    }

    await removeByEventId(event_id);
    console.log('Event deleted successfully:', event_id);
    res.json({ message: 'event資料刪除成功' });
  } catch (error) {
    console.error('Delete event failed:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});


module.exports = router;