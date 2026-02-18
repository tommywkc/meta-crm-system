import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { API_BASE_URL } from '../../api/apiBase'; // Ensure correct import path

const AllCustomerReport = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventId: '',
    source: '',
    salesId: '',
    startDate: null,
    endDate: null
  });
  const [events, setEvents] = useState([]);
  const [sales, setSales] = useState([]);

  // Create axios instance with base URL and credentials
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [eventsRes, salesRes] = await Promise.all([
          api.get('/api/events?status=OPEN,SCHEDULED,COMPLETED'), 
          // Fetch Sales users
          api.get('/api/customers/role/SALES') 
        ]);
        
        // Adjust based on actual API response structure
        setEvents(eventsRes.data.events || eventsRes.data || []); 
        // For sales, endpoint returns { customers: [...] }
        setSales(salesRes.data.customers || salesRes.data || []);
      } catch (err) {
        console.error("Error fetching options", err);
        // Fallback or mock if endpoints don't exist exactly as assumed
      }
    };
    fetchOptions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        eventId: filters.eventId,
        source: filters.source,
        salesId: filters.salesId,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '',
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''
      };
      
      const res = await api.get('/api/reports/customers', { params });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching report data", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please login again.");
      } else {
        alert("Failed to fetch data: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      if (data.length === 0) return alert("No data to export");
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_report_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

  const handleExportXLSX = () => {
    try {
      if (data.length === 0) return alert("No data to export");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `customers_report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <button onClick={onBack} style={{marginRight: '1rem'}}>Back</button>
        <h2>全客戶資料名單</h2>
      </div>

      <div className="filters-section" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <select 
          value={filters.eventId} 
          onChange={(e) => setFilters({...filters, eventId: e.target.value})}
          style={{ padding: '5px' }}
        >
          <option value="">依課程 (全部)</option>
          {events.map(ev => (
            <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
          ))}
        </select>

        <select 
          value={filters.source} 
          onChange={(e) => setFilters({...filters, source: e.target.value})}
          style={{ padding: '5px' }}
        >
          <option value="">依來源 (全部)</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
          <option value="Friend">Friend</option>
          <option value="Google">Google</option>
          <option value="Other">Other</option>
        </select>

        <select 
          value={filters.salesId} 
          onChange={(e) => setFilters({...filters, salesId: e.target.value})}
          style={{ padding: '5px' }}
        >
          <option value="">依銷售 (全部)</option>
          {sales.map(s => (
            <option key={s.user_id} value={s.user_id}>{s.name || s.username}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>期間:</span>
          <DatePicker 
            selected={filters.startDate} 
            onChange={date => setFilters({...filters, startDate: date})} 
            placeholderText="開始日期"
            dateFormat="yyyy-MM-dd"
          />
          <span>-</span>
          <DatePicker 
            selected={filters.endDate} 
            onChange={date => setFilters({...filters, endDate: date})} 
            placeholderText="結束日期"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <button onClick={fetchData} style={{ padding: '5px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          查詢
        </button>
      </div>

      <div className="actions-section" style={{ marginBottom: '10px' }}>
        <button onClick={handleExportCSV} style={{ marginRight: '10px' }}>匯出 CSV</button>
        <button onClick={handleExportXLSX}>匯出 XLSX</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>姓名</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>電話</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>來源</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>負責銷售</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>參與課程</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>创建日期</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.user_id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.mobile}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.email}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.source}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.sales_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.enrolled_courses}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.create_time ? format(new Date(row.create_time), 'yyyy-MM-dd') : ''}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllCustomerReport;
