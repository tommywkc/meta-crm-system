// src/components/Member/MemberCalendar.js
import React from 'react';

const MemberCalendar = () => {
  // 靜態數據 - 根據文檔3的4節「事件型別與日曆色碼」
  const events = [
    { 
      id: 1, 
      title: 'AI技術講座', 
      date: '2023-10-15', 
      type: 'seminar', 
      status: 'registered',
      color: 'green' // 出席=綠，缺席=紅
    },
    // 更多活動數據...
  ];

  return (
    <div className="member-calendar">
      <h2>我的學習日曆</h2>
      <div className="calendar-view">
        {events.map(event => (
          <div key={event.id} className={`calendar-event ${event.color}`}>
            <span className="event-date">{event.date}</span>
            <span className="event-title">{event.title}</span>
            <span className="event-status">{event.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberCalendar;