import React, { useEffect, useMemo, useState } from 'react';
import { formatDateTimeForDisplay, formatDateKey, formatForDisplay, formatTimeForDisplay } from '../utils/dateFormatter';

const Weekdays = ['日','一','二','三','四','五','六'];

const Calendar = ({ events = {}, onYearChange }) => {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const cells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // start from the Sunday of the week that contains the 1st
    const startDate = new Date(year, month, 1 - firstDayIndex);
    const list = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      list.push(d);
    }
    // chunk into weeks
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(list.slice(i * 7, i * 7 + 7));
    }
    return weeks;
  }, [year, month]);

  // 當檢視年份改變時，通知父元件（例如用來載入該年度的事件）
  useEffect(() => {
    if (typeof onYearChange === 'function') {
      onYearChange(year);
    }
  }, [year, onYearChange]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{year} 年 {month + 1} 月</div>
        <div>
          <button onClick={prevMonth}>上個月</button>
          <button onClick={nextMonth}>下個月</button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            {Weekdays.map((w) => <th key={w} style={{ padding: 6, textAlign: 'center' }}>{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {cells.map((week, wi) => (
            <tr key={wi}>
              {week.map((date) => {
                const key = formatDateKey(date);
                const inMonth = date.getMonth() === month;
                const dayEvents = events[key];
                return (
                  <td
                    key={key}
                    onClick={() => setSelected(key)}
                    style={{
                      verticalAlign: 'top',
                      padding: 6,
                      border: '1px solid #eee',
                      color: inMonth ? '#000' : '#d5d5d5ff',
                      cursor: 'pointer',
                      minWidth: 80
                    }}
                  >
                    <div>{date.getDate()}</div>
                    {dayEvents && (
                      Array.isArray(dayEvents) ? (
                        <ul style={{ margin: '6px 0 0 14px', padding: 0 }}>
                          {dayEvents.map((e, i) => {
                            const text = typeof e === 'string' ? e : (e && e.label) || '';
                            return (
                              <li key={i} style={{ fontWeight: 'bold' }}>{text}</li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div style={{ marginTop: 6, fontWeight: 'bold' }}>
                          {typeof dayEvents === 'string' ? dayEvents : (dayEvents && dayEvents.label) || ''}
                        </div>
                      )
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
          {selected ? (
            <div>
              <div style={{ marginTop: 6, fontWeight: 'bold' }}>詳情: {formatForDisplay(selected)}</div>
              <div>
              {(events[selected] && (Array.isArray(events[selected]) ? events[selected] : [events[selected]]))?.length
                  ? (events[selected] && (Array.isArray(events[selected]) ? events[selected] : [events[selected]])).map((e, i) => {
                    const label = typeof e === 'string' ? e : (e && e.label) || '';
                    // 支援舊格式 { datetime } 以及新格式 { start, end }
                    const start = e && typeof e === 'object' && (e.start || e.datetime) ? (e.start || e.datetime) : null;
                    const end = e && typeof e === 'object' && e.end ? e.end : null;
                    let timeText = '';
                    if (start && end) {
                      timeText = `${formatTimeForDisplay(start)} - ${formatTimeForDisplay(end)}`;
                    } else if (start) {
                      // 只有開始時間時，顯示完整日期時間作為後備
                      timeText = formatDateTimeForDisplay(start);
                    }
                    return (
                      <div key={i} style={{ marginTop: 4 }}>
                        <div style={{ fontWeight: 'bold' }}>{label}</div>
                        {timeText && (
                          <div style={{ fontSize: 16, color: '#555' }}>
                            {timeText}
                          </div>
                        )}
                      </div>
                    );
                  })
                  : <div>此日無事件</div>
                }
              </div>
            </div>
          ) : (
            <div>按一下日期檢視詳情</div>
          )}
      </div>
    </div>
  );
};

export default Calendar;