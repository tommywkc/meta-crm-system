import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CommonTable from '../../components/CommonTable';
import { MobileCard, MobileCardRow } from '../../components/MobileCard';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import { formatDateTimeForDisplay } from '../../utils/dateFormatter';
import { handleGetById as handleGetEventById } from '../../api/eventListAPI';
import { handleListAssignments, handleDeleteAssignment } from '../../api/assignmentsAPI';
import { handleDeleteHomeworkFile, handleListHomeworkFiles, handleUploadHomeworkFile } from '../../api/homeworkFilesAPI';

const EventHomework = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { user } = useAuth();

  const [eventInfo, setEventInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filesByAssignment, setFilesByAssignment] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const uploadInputRefs = useRef({});

  const userRole = (user?.role || '').toLowerCase();
  const isMember = userRole === 'member';
  const isAdmin = userRole === 'admin';
  const isStaff = !isAdmin && !isMember;

  useEffect(() => {
    if (!eventId) return;
    handleGetEventById(eventId)
      .then((res) => setEventInfo(res.event || null))
      .catch(() => setEventInfo(null));
  }, [eventId]);

  const fetchAssignments = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await handleListAssignments(eventId);
      setAssignments(Array.isArray(res.assignments) ? res.assignments : []);
    } catch (err) {
      console.error(err);
      setError('載入功課失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [eventId]);

  useEffect(() => {
    const loadFiles = async () => {
      if (!isMember || assignments.length === 0) return;
      const results = {};
      await Promise.all(
        assignments.map(async (item) => {
          try {
            const payload = await handleListHomeworkFiles(eventId, item.assignment_id);
            results[item.assignment_id] = Array.isArray(payload.files) ? payload.files : [];
          } catch (err) {
            results[item.assignment_id] = [];
          }
        })
      );
      setFilesByAssignment(results);
    };

    loadFiles();
  }, [assignments, isMember]);

  const handleGoCreate = () => {
    if (!eventId) return;
    navigate(`/admin/events/${eventId}/homework/create`);
  };

  const handleGoEdit = (assignmentId) => {
    if (!eventId || !assignmentId) return;
    navigate(`/admin/events/${eventId}/homework/${assignmentId}/edit`);
  };

  const handleGoView = (assignmentId) => {
    if (!eventId || !assignmentId) return;
    navigate(`/events/${eventId}/homework/${assignmentId}`);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('確認要刪除此功課？')) return;
    try {
      await handleDeleteAssignment(assignmentId);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請稍後再試');
    }
  };

  const handleUploadFile = async (assignmentId, file) => {
    if (!file) return;
    setUploadingId(assignmentId);
    try {
      await handleUploadHomeworkFile(eventId, assignmentId, file);
      await fetchAssignments();
    } catch (err) {
      alert(err?.message || '上傳失敗，請稍後再試');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!fileName) return;
    if (!window.confirm('確認要刪除此檔案？')) return;
    try {
      await handleDeleteHomeworkFile(fileName);
      await fetchAssignments();
    } catch (err) {
      alert(err?.message || '刪除失敗，請稍後再試');
    }
  };

  const headers = [
    'ID',
    '名稱',
    '描述',
    '截止日期',
    isMember ? '提交時間' : null,
    isMember ? '結果' : null,
    '操作'
  ].filter(Boolean);

  return (
    <PageContainer>
      <PageHeader 
        title="功課" 
        showBack={true} 
        onBack={() => navigate(-1)} 
      />
      {eventInfo ? (
        <p>活動 ID: {eventInfo.event_id} ｜ 課堂/講座名稱: {eventInfo.event_name}</p>
      ) : (
        <p>活動 ID: {eventId || 'N/A'}</p>
      )}

      <div style={{ marginBottom: 16 }}>
        {isAdmin && (
          <button onClick={handleGoCreate}>新增功課</button>
        )}

      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
      <CommonTable 
        headers={headers} 
        data={assignments} 
        emptyMessage="暫無功課"
        renderCard={(item, idx) => (
             <MobileCard key={`hw-${item.assignment_id || idx}`}>
                <MobileCardRow label="Assignment ID" value={item.assignment_id} />
                <MobileCardRow label="Name" value={item.name} />
                <MobileCardRow label="Description">
                    <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', textAlign: 'right' }}>{item.description}</pre>
                </MobileCardRow>
                <MobileCardRow label="Deadline" value={item.deadline ? formatDateTimeForDisplay(item.deadline) : 'N/A'} />
                
                {isMember && (
                    <>
                        <MobileCardRow label="Submitted">
                            {filesByAssignment[item.assignment_id]?.[0]?.submittedAt
                            ? formatDateTimeForDisplay(filesByAssignment[item.assignment_id][0].submittedAt)
                            : 'N/A'}
                        </MobileCardRow>
                        <MobileCardRow label="Graded">
                             {filesByAssignment[item.assignment_id]?.[0]?.graded ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                    <span>已批改</span>
                                    <button
                                    onClick={() => navigate(`/events/${eventId}/homework/${item.assignment_id}/result`)}
                                    >
                                    查看結果
                                    </button>
                                </div>
                                ) : (
                                '未批改'
                                )}
                        </MobileCardRow>
                    </>
                )}

                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {isAdmin ? (
                    <>
                      <button onClick={() => handleGoView(item.assignment_id)}>查看</button>
                      <button onClick={() => handleGoEdit(item.assignment_id)}>編輯</button>
                      <button onClick={() => handleDelete(item.assignment_id)} className="btn-danger">刪除</button>
                    </>
                  ) : isStaff ? (
                    <button onClick={() => handleGoView(item.assignment_id)}>查看</button>
                  ) : (
                    <>
                      <input
                        type="file"
                        ref={(el) => { uploadInputRefs.current[item.assignment_id] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadFile(item.assignment_id, e.target.files?.[0])}
                      />
                      <button
                        onClick={() => uploadInputRefs.current[item.assignment_id]?.click()}
                        disabled={uploadingId === item.assignment_id || (filesByAssignment[item.assignment_id] || []).length > 0}
                      >
                        {uploadingId === item.assignment_id ? '上傳中...' : '上傳'}
                      </button>
                      {(filesByAssignment[item.assignment_id] || []).length > 0 && (
                        <span style={{ color: '#666', fontSize: 13, alignSelf: 'center' }}>已提交（如需更改請先刪除）</span>
                      )}
                      {(filesByAssignment[item.assignment_id] || []).map((file) => (
                        <div key={file.fileName} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
                          <span style={{ fontSize: 13 }}>{file.originalName || file.fileName}</span>
                          <button
                            onClick={() => handleDeleteFile(file.fileName)}
                            className="btn-danger"
                          >
                            刪除
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
             </MobileCard>
        )}
      >
            {assignments.map((item) => (
              <tr key={item.assignment_id}>
                <td>{item.assignment_id}</td>
                <td>{item.name}</td>
                <td>
                  <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{item.description}</pre>
                </td>
                <td>
                  {item.deadline ? formatDateTimeForDisplay(item.deadline) : 'N/A'}
                </td>
                {isMember && (
                  <td>
                    {filesByAssignment[item.assignment_id]?.[0]?.submittedAt
                      ? formatDateTimeForDisplay(filesByAssignment[item.assignment_id][0].submittedAt)
                      : 'N/A'}
                  </td>
                )}
                {isMember && (
                  <td>
                    {filesByAssignment[item.assignment_id]?.[0]?.graded ? (
                      <>
                        已批改
                        <button
                          onClick={() => navigate(`/events/${eventId}/homework/${item.assignment_id}/result`)}
                          style={{ marginLeft: 8 }}
                        >
                          查看結果
                        </button>
                      </>
                    ) : (
                      '未批改'
                    )}
                  </td>
                )}
                <td>
                  {isAdmin ? (
                    <>
                      <button onClick={() => handleGoView(item.assignment_id)} style={{ marginRight: 8 }}>查看</button>
                      <button onClick={() => handleGoEdit(item.assignment_id)} style={{ marginRight: 8 }}>編輯</button>
                      <button onClick={() => handleDelete(item.assignment_id)} className="btn-danger">刪除</button>
                    </>
                  ) : isStaff ? (
                    <button onClick={() => handleGoView(item.assignment_id)}>查看</button>
                  ) : (
                    <>
                      <input
                        type="file"
                        ref={(el) => { uploadInputRefs.current[item.assignment_id] = el; }}
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadFile(item.assignment_id, e.target.files?.[0])}
                      />
                      <button
                        onClick={() => uploadInputRefs.current[item.assignment_id]?.click()}
                        disabled={uploadingId === item.assignment_id || (filesByAssignment[item.assignment_id] || []).length > 0}
                        style={{ marginRight: 8 }}
                      >
                        {uploadingId === item.assignment_id ? '上傳中...' : '上傳'}
                      </button>
                      {(filesByAssignment[item.assignment_id] || []).length > 0 && (
                        <span style={{ color: '#666' }}>已提交（如需更改請先刪除）</span>
                      )}
                      {(filesByAssignment[item.assignment_id] || []).map((file) => (
                        <div key={file.fileName} style={{ marginTop: 6 }}>
                          <span>{file.originalName || file.fileName}</span>
                          <button
                            onClick={() => handleDeleteFile(file.fileName)}
                            className="btn-danger"
                            style={{ marginLeft: 8 }}
                          >
                            刪除
                          </button>
                        </div>
                      ))}
                      {(filesByAssignment[item.assignment_id] || []).length === 0 && (
                        <span>未上傳</span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
      </CommonTable>
      )}

    </PageContainer>
  );
};

export default EventHomework;
