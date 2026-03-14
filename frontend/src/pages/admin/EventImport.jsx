import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleImportStudentsExcel } from '../../api/eventListAPI';
import EventForm from '../../components/EventForm';

const EventImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const nextFile = e.target.files && e.target.files[0];
    setFile(nextFile || null);
  };

  const handleSubmit = async (formData) => {
    if (!file) {
      alert('請選擇 Excel 檔案');
      return;
    }
    try {
      setImporting(true);
      const res = await handleImportStudentsExcel(file, {
        event_name: formData?.event_name || '',
        price: formData?.price ?? '',
      });
      const summary = res?.summary;
      const msg = summary
        ? `匯入完成\n新增活動: ${res?.event?.event_name || '-'}\n新增用戶: ${summary.createdUsers}\n既有用戶: ${summary.existingUsers}\n新增報名: ${summary.createdEnrollments}\n略過筆數: ${summary.skippedRows?.length || 0}`
        : '匯入完成';
      alert(msg);
      navigate('/events');
    } catch (err) {
      alert(err?.message || '匯入失敗');
    } finally {
      setImporting(false);
    }
  };

  return (
    <EventForm
      title="活動 Excel 匯入"
      submitButtonText={importing ? '匯入中...' : '開始匯入'}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/events')}
      showSessionForm={false}
      requireName={false}
      initialData={{ type: 'CLASS', status: 'SCHEDULED' }}
      extraFields={(
        <div style={{ marginBottom: 12 }}>
          <label>Excel 檔案:</label><br />
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        </div>
      )}
    />
  );
};

export default EventImport;
