import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleGetById } from '../../api/customersListAPI';
import Calendar from '../../components/Calendar';
import { QRCodeCanvas } from 'qrcode.react';
import { formatDateTimeForDisplay, formatDateKey } from '../../utils/dateFormatter';
import { handleListUserUpcomingSessions, handleListUserSessionsByYear } from '../../api/sessionAPI';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [ownerSalesName, setOwnerSalesName] = useState('');
  const [referrerName, setReferrerName] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetById(id);
      setCustomer(data.customer || {});
    };
    fetchData();
  }, [id]);

  // Fetch responsible sales/leader name by owner_sales id
  useEffect(() => {
    (async () => {
      const ownerId = customer?.owner_sales;
      if (!ownerId) {
        setOwnerSalesName('');
        return;
      }
      try {
        const data = await handleGetById(ownerId);
        const name = data?.customer?.name || '';
        setOwnerSalesName(name);
      } catch (err) {
        console.error('Failed to fetch owner sales name:', err);
        setOwnerSalesName('');
      }
    })();
  }, [customer?.owner_sales]);
  useEffect(() => {
    (async () => {
      const referrerId = customer?.referrer;
      if (!referrerId) {
        setReferrerName('');
        return;
      }
      try {
        const data = await handleGetById(referrerId);
        const name = data?.customer?.name || '';
        setReferrerName(name);
      } catch (err) {
        console.error('Failed to fetch referrer name:', err);
        setReferrerName('');
      }
    })();
  }, [customer?.referrer]);

  const isMember = customer.role?.toLowerCase() === 'member';

  // Calendar state (per-customer)
  const today = new Date();
  const initialYear = today.getFullYear();
  const [calendarYear, setCalendarYear] = React.useState(initialYear);
  const [eventsByYear, setEventsByYear] = React.useState({});
  const [calendarLoading, setCalendarLoading] = React.useState(false);
  const [calendarError, setCalendarError] = React.useState(null);

  const [upcomingSessions, setUpcomingSessions] = React.useState([]);
  const [upcomingLoading, setUpcomingLoading] = React.useState(false);
  const [upcomingError, setUpcomingError] = React.useState(null);

  const loadYearData = async (year) => {
    if (!customer?.user_id) return;
    try {
      setCalendarLoading(true);
      setCalendarError(null);
      const res = await handleListUserSessionsByYear(customer.user_id, year);
      const sessions = res.sessions || [];
      const map = {};
      sessions.forEach((s) => {
        if (!s.datetime_start) return;
        const key = formatDateKey(s.datetime_start);
        const labelParts = [];
        if (s.event_name) labelParts.push(s.event_name);
        if (s.session_name) labelParts.push(s.session_name);
        const label = labelParts.join(' - ') || '課堂';
        if (!map[key]) map[key] = [];
        map[key].push({ label, start: s.datetime_start, end: s.datetime_end });
      });
      setEventsByYear((prev) => ({ ...prev, [year]: map }));
    } catch (err) {
      console.error('Failed to load customer calendar sessions for year', year, err);
      setCalendarError('無法載入此年度的課程');
    } finally {
      setCalendarLoading(false);
    }
  };

  React.useEffect(() => {
    // when customer loads, fetch upcoming sessions and this year's calendar
    if (!customer?.user_id) return;
    let mounted = true;
    (async () => {
      try {
        setUpcomingLoading(true);
        setUpcomingError(null);
        const res = await handleListUserUpcomingSessions(customer.user_id, 5);
        if (!mounted) return;
        setUpcomingSessions(res.sessions || []);
      } catch (err) {
        console.error('Failed to load customer upcoming sessions:', err);
        if (mounted) setUpcomingError('無法載入即將到來的課堂');
      } finally {
        if (mounted) setUpcomingLoading(false);
      }
    })();

    if (!eventsByYear[initialYear]) {
      loadYearData(initialYear);
    }
    return () => { mounted = false; };
  }, [customer?.user_id]);

  const handleCalendarYearChange = (year) => {
    setCalendarYear(year);
    if (!eventsByYear[year]) loadYearData(year);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="查看客戶"
        showBack={true}
        onBack={() => navigate('/customers')}
      />
      
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
  {/* Left: customer information */}
        <div style={{ flex: isMember ? 1 : 'none', maxWidth: isMember ? 'none' : '600px' }}>
          <h2>客戶資訊</h2>
          <div style={{ marginTop: 20 }}>
            <div><strong>用戶 ID:</strong> {customer.user_id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>密碼:</strong> 
              <span>{showPassword ? customer.password : '••••••••'}</span>
              <button 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '隱藏密碼' : '顯示密碼'}
              </button>
            </div>
            <div><strong>姓名:</strong> {customer.name}</div>
            <div><strong>手機號碼:</strong> {customer.mobile}</div>
            <div><strong>Email:</strong> {customer.email || 'N/A'}</div>
            <div><strong>角色:</strong> {customer.role}</div>
            <div><strong>來源:</strong> {customer.source || 'N/A'}</div>
            <div>
              <strong>負責銷售:</strong>{' '}
              {customer.owner_sales
                ? (
                  <>
                    {customer.owner_sales}
                    {ownerSalesName ? ` - ${ownerSalesName}` : ' (載入中...)'}
                  </>
                )
                : 'N/A'}
            </div>
            <div>
              <strong>推薦人:</strong>{' '}
              {customer.referrer
                ? (
                  <>
                    {customer.referrer}
                    {referrerName ? ` - ${referrerName}` : ' (載入中...)'}
                  </>
                )
                : 'N/A'}
            </div>
            <div><strong>團隊:</strong> {customer.team || 'N/A'}</div>
            <div><strong>標籤:</strong> {customer.tags || 'N/A'}</div>
            <div><strong>特殊備註:</strong> {customer.note_special || 'N/A'}</div>
            <div><strong>QR Token:</strong> {customer.qr_token || 'N/A'}</div>
            <div style={{ marginTop: 20 }}>
              <strong>QR Code:</strong><br/>
              {customer.qr_token ? (
                <QRCodeCanvas value={customer.qr_token} size={100} />
              ) : (
                <div>N/A</div>
              )}
            </div>
            <div><strong>建立時間:</strong> {customer.create_time ? formatDateTimeForDisplay(customer.create_time) : 'N/A'}</div>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate(`/customers/${id}/edit`)}>編輯</button>
          </div>
        </div>

  {/* Right: calendar (visible to MEMBER only) */}
        {isMember && (
          <div style={{ flex: 1 }}>
            <h2>會員日曆</h2>
            {calendarError && <p style={{ color: 'red' }}>{calendarError}</p>}
            <Calendar events={eventsByYear[calendarYear] || {}} onYearChange={handleCalendarYearChange} />
            {calendarLoading && <p>日曆載入中...</p>}
            
            <div style={{ marginTop: 12 }}>
              <h3>即將到來的5堂課</h3>
              <button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  const userIdValue = (customer.user_id || '').toString();
                  navigate(`/sessions/enrolled${userIdValue ? `?user_id=${encodeURIComponent(userIdValue)}` : ''}`);
                }}
              >
                查看所有即將到來的場次
              </button>
              <button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  const userIdValue = (customer.user_id || '').toString();
                  navigate(`/events${userIdValue ? `?user_id=${encodeURIComponent(userIdValue)}` : ''}`);
                }}
              >
                查看已確認報名的活動
              </button>
              {upcomingLoading ? (
                <p>載入中...</p>
              ) : upcomingError ? (
                <p style={{ color: 'red' }}>{upcomingError}</p>
              ) : upcomingSessions.length === 0 ? (
                <p>暫時沒有即將到來的課堂</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>日期時間</th>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>課堂名稱</th>
                      <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '4px 8px' }}>場次</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingSessions.map((s) => (
                      <tr key={s.registration_id}>
                        <td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.datetime_start ? formatDateTimeForDisplay(s.datetime_start) : 'N/A'}</td>
                        <td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.event_name || '-'}</td>
                        <td style={{ borderBottom: '1px solid #eee', padding: '4px 8px' }}>{s.session_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CustomerView;
