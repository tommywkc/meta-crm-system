import React from 'react';

const mockData = [
  {
    id: 'A1',
    customerName: '陳小明',
    customerId: 'C1001',
    eventName: 'AI Animation',
    classLabel: '9A',
    current: '—',
    applied: '9/19',
    type: '加入',
    salesName: '林銷售',
    salesTeam: 'Team Alpha',
    paymentStatus: '已付',
    remainingSeats: 5,
    within3Days: false,
    timeConflict: false,
    priority: '補堂',
    status: '待審批'
  },
  {
    id: 'B2',
    customerName: '李美麗',
    customerId: 'C1002',
    eventName: 'Seminar-SEP-03',
    classLabel: 'N/A',
    current: '9/12 19:00',
    applied: '9/19 19:00',
    type: '改期',
    salesName: '張經理',
    salesTeam: 'Team Beta',
    paymentStatus: '欠款',
    remainingSeats: null,
    within3Days: true,
    timeConflict: true,
    priority: '覆課1',
    status: '待審批'
  }
];

const filterOptions = {
  types: ['加入', '改期', '取消'],
  eventCategories: ['講座', '課堂'],
  statuses: ['待審批', '已核准', '已駁回']
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 12
};

const thTdStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left'
};

const Approvals = () => {
  // navigation removed for '查看客戶月曆' action per request
  const filtered = mockData;

  const onApprove = (id) => {
    console.log('Approve', id);
    alert(`已核准 ${id}`);
  };
  const onReject = (id) => {
    console.log('Reject', id);
    alert(`已駁回 ${id}`);
  };
  // onViewCalendar removed
  const onAddWaitlist = (id) => {
    console.log('Add waitlist', id);
    alert(`已加入等待清單 ${id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>簽核待辦 (Admin)</h1>

      {/* filter UI removed per request - simplified list view */}

      <section>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>客戶姓名</th>
              <th style={thTdStyle}>事件</th>
              <th style={thTdStyle}>現況 → 申請</th>
              <th style={thTdStyle}>申請類型</th>
              <th style={thTdStyle}>申請銷售</th>
              <th style={thTdStyle}>付款狀態</th>
              <th style={thTdStyle}>檢查</th>
              <th style={thTdStyle}>剩餘名額</th>
              <th style={thTdStyle}>三個工作天</th>
              <th style={thTdStyle}>時間衝突</th>
              <th style={thTdStyle}>狀態</th>
              <th style={thTdStyle}>動作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={thTdStyle}>{r.customerName}</td>
                <td style={thTdStyle}>{r.eventName} {r.classLabel !== 'N/A' ? ` / ${r.classLabel}` : ''}</td>
                <td style={thTdStyle}>{r.current} → {r.applied}</td>
                <td style={thTdStyle}>{r.type}</td>
                <td style={thTdStyle}>{r.salesName} / {r.salesTeam}</td>
                <td style={thTdStyle}>{r.paymentStatus}</td>
                <td style={thTdStyle}>
                  {r.priority && <span style={{ marginRight: 6, padding: '2px 6px', background: '#eef', borderRadius: 4 }}>{r.priority}</span>}
                </td>
                <td style={thTdStyle}>{r.remainingSeats != null ? `餘 ${r.remainingSeats}` : ''}</td>
                <td style={thTdStyle}>{r.within3Days ? '!' : ''}</td>
                <td style={thTdStyle}>{r.timeConflict ? '!' : ''}</td>
                <td style={thTdStyle}>{r.status}</td>
                <td style={thTdStyle}>
                  <button onClick={() => onApprove(r.id)} style={{ marginRight: 6 }}>核准</button>
                  <button onClick={() => onReject(r.id)} style={{ marginRight: 6 }}>駁回</button>
                  {r.type === '加入' && r.remainingSeats != null && (
                    <button onClick={() => onAddWaitlist(r.id)}>加入等待清單</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: 12, textAlign: 'center', color: '#666' }}>無符合的申請</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Approvals;
