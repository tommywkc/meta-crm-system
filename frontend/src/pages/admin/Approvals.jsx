import React from 'react';

const mockData = [
  {
    id: 'A1',
    customerName: 'John Chen',
    customerId: 'C1001',
    eventName: 'AI Animation',
    classLabel: '9A',
    current: '—',
    applied: '9/19',
    type: 'Join',
    salesName: 'Sales Lin',
    salesTeam: 'Team Alpha',
    paymentStatus: 'Paid',
    remainingSeats: 5,
    within3Days: false,
    timeConflict: false,
    priority: 'Makeup',
    status: 'Pending'
  },
  {
    id: 'B2',
    customerName: 'Mary Li',
    customerId: 'C1002',
    eventName: 'Seminar-SEP-03',
    classLabel: 'N/A',
    current: '9/12 19:00',
    applied: '9/19 19:00',
    type: 'Reschedule',
    salesName: 'Manager Zhang',
    salesTeam: 'Team Beta',
    paymentStatus: 'Outstanding',
    remainingSeats: null,
    within3Days: true,
    timeConflict: true,
    priority: 'Retake 1',
    status: 'Pending'
  }
];

const filterOptions = {
  types: ['Join', 'Reschedule', 'Cancel'],
  eventCategories: ['Seminar', 'Class'],
  statuses: ['Pending', 'Approved', 'Rejected']
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
  const filtered = mockData;

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
      <h1>Approval Tasks (Admin)</h1>

      <section>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Customer Name</th>
              <th style={thTdStyle}>Event</th>
              <th style={thTdStyle}>Current → Applied</th>
              <th style={thTdStyle}>Request Type</th>
              <th style={thTdStyle}>Sales</th>
              <th style={thTdStyle}>Payment Status</th>
              <th style={thTdStyle}>Check</th>
              <th style={thTdStyle}>Remaining Seats</th>
              <th style={thTdStyle}>Within 3 Days</th>
              <th style={thTdStyle}>Time Conflict</th>
              <th style={thTdStyle}>Status</th>
              <th style={thTdStyle}>Actions</th>
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
                <td style={thTdStyle}>{r.remainingSeats != null ? `${r.remainingSeats} left` : ''}</td>
                <td style={thTdStyle}>{r.within3Days ? '!' : ''}</td>
                <td style={thTdStyle}>{r.timeConflict ? '!' : ''}</td>
                <td style={thTdStyle}>{r.status}</td>
                <td style={thTdStyle}>
                  <button onClick={() => onApprove(r.id)} style={{ marginRight: 6 }}>Approve</button>
                  <button onClick={() => onReject(r.id)} style={{ marginRight: 6 }}>Reject</button>
                  {r.type === 'Join' && r.remainingSeats != null && (
                    <button onClick={() => onAddWaitlist(r.id)}>Add to Waiting List</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: 12, textAlign: 'center', color: '#666' }}>No matching requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Approvals;
