import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import { handleListImportLogs } from '../../api/eventListAPI';

const formatDateTime = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ImportHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const payload = await handleListImportLogs(200, 0);
      setLogs(payload?.logs || []);
    } catch (err) {
      alert(err?.message || '無法載入匯入記錄');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Excel 匯入記錄"
        showBack
        onBack={() => navigate('/events')}
        extra={<button onClick={loadLogs} disabled={loading}>{loading ? '載入中...' : '重新整理'}</button>}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>時間</th>
              <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>檔案</th>
              <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>結果摘要</th>
              <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>錯誤/略過資料列</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ padding: 12, color: '#666' }}>暫無匯入記錄</td>
              </tr>
            )}
            {logs.map((log) => {
              const d = log?.details_json || {};
              const summary = d?.summary || {};
              const skippedRows = d?.skipped_rows || summary?.skippedRows || [];
              const summaryText = d?.error
                ? `失敗：${d.error}`
                : `活動名稱: ${d?.event_name || '-'}；新增用戶: ${summary.createdUsers || 0}；新增報名: ${summary.createdEnrollments || 0}`;

              return (
                <tr key={log.log_id}>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{formatDateTime(log.log_time)}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{d?.file_name || '-'}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{summaryText}</td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                    {Array.isArray(skippedRows) && skippedRows.length > 0 ? (
                      <details>
                        <summary>共 {skippedRows.length} 筆</summary>
                        <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                          {(skippedRows || []).map((item, idx) => (
                            <div
                              key={`${log.log_id}-${idx}`}
                              style={{
                                padding: '8px 10px',
                                borderTop: idx === 0 ? 'none' : '1px solid #f3f4f6',
                                background: idx % 2 === 0 ? '#fafafa' : '#fff',
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              <div><strong>第 {item?.row || '-'} 行</strong></div>
                              <div>原因：{item?.reason || '-'}</div>
                              {item?.mobile ? <div>電話：{item.mobile}</div> : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
};

export default ImportHistory;
