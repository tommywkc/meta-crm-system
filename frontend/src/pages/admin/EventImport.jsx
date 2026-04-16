import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleImportStudentsExcel } from '../../api/eventListAPI';
import EventForm from '../../components/EventForm';

const EventImport = () => {
  const MIN_LOADING_MS = 2500;
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('準備匯入');

  const handleFileChange = (e) => {
    const nextFile = e.target.files && e.target.files[0];
    setFile(nextFile || null);
  };

  const handleSubmit = async (formData) => {
    if (!file) {
      alert('請選擇匯入檔案（.xlsx/.xls/.csv）');
      return;
    }
    let timer = null;
    const startedAt = Date.now();
    try {
      setImporting(true);
      setProgress(10);
      setImportStatus('讀取檔案中...');
      timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev >= 90 ? prev : prev + 5;
          if (next < 25) {
            setImportStatus('讀取檔案中...');
          } else if (next < 50) {
            setImportStatus('匯入活動與場次中...');
          } else if (next < 75) {
            setImportStatus('匯入用戶與報名中...');
          } else if (next < 95) {
            setImportStatus('匯入付款與出席中...');
          } else {
            setImportStatus('整理結果中...');
          }
          return next;
        });
      }, 300);

      const res = await handleImportStudentsExcel(file, {
        event_name: formData?.event_name || '',
        price: formData?.price ?? '',
      });
      setProgress(100);
      setImportStatus('完成');
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
      }
      const summary = res?.summary;
      const msg = summary
        ? `匯入完成\n新增活動: ${res?.event?.event_name || '-'}\n新增用戶: ${summary.createdUsers}\n既有用戶: ${summary.existingUsers}\n新增報名: ${summary.createdEnrollments}\n略過筆數: ${summary.skippedRows?.length || 0}`
        : '匯入完成';
      alert(msg);
      navigate('/events');
    } catch (err) {
      alert(err?.message || '匯入失敗');
    } finally {
      if (timer) clearInterval(timer);
      setImporting(false);
      setTimeout(() => setProgress(0), 400);
      setTimeout(() => setImportStatus('準備匯入'), 400);
    }
  };

  return (
    <>
      <EventForm
        title="活動檔案匯入"
        submitButtonText={importing ? '匯入中...' : '開始匯入'}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/events')}
        showSessionForm={false}
        requireName={false}
        initialData={{ type: 'CLASS', status: 'SCHEDULED' }}
        extraFields={(
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label>匯入檔案:</label>
            </div>
            <input type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={handleFileChange} disabled={importing} />
          </div>
        )}
      />

      {importing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(420px, 90vw)',
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ marginBottom: 10, fontSize: 15, fontWeight: 600 }}>
              匯入中... {progress}%
            </div>
            <div style={{ marginBottom: 10, fontSize: 13, color: '#666' }}>
              {importStatus}
            </div>
            <div
              style={{
                width: '100%',
                height: 12,
                background: '#eee',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #1e88e5 0%, #42a5f5 50%, #1e88e5 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'importBarMove 1s linear infinite',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes importBarMove {
          0% { background-position: 200% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </>
  );
};

export default EventImport;
