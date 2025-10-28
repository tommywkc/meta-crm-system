import React, { useMemo, useState } from 'react';

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const Weekdays = ['日','一','二','三','四','五','六'];

const Calendar = ({ events = {} }) => {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells = [];
    // previous month's tail
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const date = new Date(year, month - 1, d);
      cells.push({ date, inMonth: false });
    }
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, inMonth: true });
    }
    // next month's head to fill 42 cells
    let nextDay = 1;
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const date = new Date(year, month + 1, nextDay++);
      cells.push({ date, inMonth: false });
    }
    return cells;
  }, [year, month]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 12, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 'bold' }}>{year} 年 {month + 1} 月</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prevMonth}>上個月</button>
          <button onClick={nextMonth}>下個月</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 6 }}>
        {Weekdays.map((w) => (
          <div key={w} style={{ fontWeight: '600', padding: '6px 0' }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map(({ date, inMonth }, idx) => {
          const key = formatKey(date);
          const dayEvents = events[key];
          const isToday = formatKey(new Date()) === key;
          return (
            <div
              key={idx}
              onClick={() => setSelected(key)}
              style={{
                minHeight: 80,
                padding: 6,
                borderRadius: 6,
                background: inMonth ? '#fff' : '#f7f7f7',
                border: isToday ? '1px solid #1976d2' : '1px solid #eee',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: inMonth ? '#000' : '#999' }}>{date.getDate()}</div>
              </div>
              <div style={{ fontSize: 12, color: '#333' }}>
                {dayEvents && (
                  Array.isArray(dayEvents) ? (
                    dayEvents.slice(0,2).map((t, i) => <div key={i} style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>• {t}</div>)
                  ) : (
                    <div style={{ fontSize: 12 }}>• {dayEvents}</div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {selected ? (
          <div>
            <strong>詳情 — {selected}</strong>
            <div style={{ marginTop: 8 }}>
              {(events[selected] && (Array.isArray(events[selected]) ? events[selected] : [events[selected]]))?.map((e, i) => (
                <div key={i} style={{ padding: '6px 8px', background: '#fafafa', borderRadius: 4, marginBottom: 6 }}>{e}</div>
              )) || <div style={{ color: '#666' }}>此日無事件</div>}
            </div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>按一下日期檢視詳情</div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
