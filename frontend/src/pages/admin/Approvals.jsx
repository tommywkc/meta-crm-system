import React from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockData = [
  {
    id: 'XXX',
    customerName: 'XXX',
    customerId: 'XXX',
    eventName: 'XXX',
    classLabel: 'XXX',
    current: 'XXX',
    applied: 'XXX',
    type: 'XXX',
    salesName: 'XXX',
    salesTeam: 'XXX',
    paymentStatus: 'XXX',
    remainingSeats: 'XXX',
    within3Days: false,
    timeConflict: false,
    priority: 'XXX',
    status: 'XXX'
  },
  {
    id: 'XXX',
    customerName: 'XXX',
    customerId: 'XXX',
    eventName: 'XXX',
    classLabel: 'XXX',
    current: 'XXX',
    applied: 'XXX',
    type: 'XXX',
    salesName: 'XXX',
    salesTeam: 'XXX',
    paymentStatus: 'XXX',
    remainingSeats: 'XXX',
    within3Days: true,
    timeConflict: true,
    priority: 'XXX',
    status: 'XXX'
  }
];

const filterOptions = {
  types: ['Join', 'Reschedule', 'Cancel'],
  eventCategories: ['Seminar', 'Class'],
  statuses: ['Pending', 'Approved', 'Rejected']
};

const Approvals = () => {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const filtered = mockData;

  const showDetailModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const onApprove = (id) => {
    console.log('Approve', id);
    alert(`Approved ${id}`);
  };
  const onReject = (id) => {
    console.log('Reject', id);
    alert(`Rejected ${id}`);
  };
  const onAddWaitlist = (id) => {
    console.log('Add waitlist', id);
    alert(`Added to waiting list ${id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>審批頁 (Admin)</h1>

      <section>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>會員名稱</th>
              <th style={thTdStyle}>講座/課堂</th>
              <th style={thTdStyle}>現在時間</th>
              <th style={thTdStyle}>申請時間</th>
              <th style={thTdStyle}>申請類型</th>
              <th style={thTdStyle}>銷售</th>
              <th style={thTdStyle}>付款狀態</th>
              <th style={thTdStyle}>檢查</th>
              <th style={thTdStyle}>剩餘座位</th>
              <th style={thTdStyle}>三日內</th>
              <th style={thTdStyle}>時間衝突</th>
              <th style={thTdStyle}>狀態</th>
              <th style={thTdStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={thTdStyle}>{r.customerName}</td>
                <td style={thTdStyle}>{r.eventName} {r.classLabel !== 'N/A' ? ` / ${r.classLabel}` : ''}</td>
                <td style={thTdStyle}>{r.current}</td>
                <td style={thTdStyle}>{r.applied}</td>
                <td style={thTdStyle}>{r.type}</td>
                <td style={thTdStyle}>{r.salesName} / {r.salesTeam}</td>
                <td style={thTdStyle}>{r.paymentStatus}</td>
                <td style={thTdStyle}>
                  {r.priority && <span>{r.priority}</span>}
                </td>
                <td style={thTdStyle}>{r.remainingSeats != null ? `${r.remainingSeats} left` : ''}</td>
                <td style={thTdStyle}>{r.within3Days ? '!' : ''}</td>
                <td style={thTdStyle}>{r.timeConflict ? '!' : ''}</td>
                <td style={thTdStyle}>{r.status}</td>
                <td style={thTdStyle}>
                  <button onClick={() => onApprove(r.id)}>批准</button>
                  <button onClick={() => onReject(r.id)}>拒絕</button>
                  {r.type === 'Join' && r.remainingSeats != null && (
                    <button onClick={() => onAddWaitlist(r.id)}>加入等待名單</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13}>沒有匹配的申請</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Approvals;
