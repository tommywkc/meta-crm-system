import React, { useState } from 'react';
import { apiUrl } from '../../api/apiBase';
import CommonTable from '../../components/CommonTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const mockHomework = [
	{ id: 'H1001', subject: 'AI Animation 9A', assignment: 'Project 1', due: '2025-11-05', status: '未上傳', file: null },
	{ id: 'H1002', subject: 'AI Foundations', assignment: 'Project 2', due: '2025-11-10', status: '已上傳', file: 'ai_report.pdf' }
];

const Homework = () => {
	const [list, setList] = useState(mockHomework);
	const [uploading, setUploading] = useState({});
	const [error, setError] = useState('');

    // Mock upload handler
	const handleFileChange = async (e, item) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;

		setUploading((s) => ({ ...s, [item.id]: true }));
		setError('');
        
        // Simulate upload delay
        setTimeout(() => {
            setUploading((s) => ({ ...s, [item.id]: false }));
            setList(prev => prev.map(h => h.id === item.id ? { ...h, status: '已上傳', file: file.name } : h ));
            alert(`已上傳 ${file.name}`);
        }, 1500);
	};

    const handleDownloadFile = (url) => {
        window.open(url, '_blank');
    };

    const headers = ['課程', 'Assignment', '截止', '狀態', '上傳'];

	return (
		<PageContainer>
            <PageHeader title="我的功課 (Member)" />
            {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
            
			<CommonTable headers={headers} data={list} emptyMessage="暫無功課">
				{list.map((h) => (
					<tr key={h.id}>
						<td>{h.subject}</td>
						<td>{h.assignment}</td>
						<td>{h.due}</td>
						<td>
							{h.status}
							{h.file && (
								<div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
									檔案: {h.file}
									{h.fileUrl && (
										<button 
											onClick={() => handleDownloadFile(h.fileUrl)}
											style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.8em' }}
										>
											下載
										</button>
									)}
								</div>
							)}
						</td>
						<td>
							<input 
								type="file" 
								onChange={(e) => handleFileChange(e, h)}
								disabled={!!uploading[h.id]}
								accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                                style={{ maxWidth: 200 }}
							/>
							{uploading[h.id] && <span style={{ marginLeft: 8, color: 'blue' }}>上傳中…</span>}
						</td>
					</tr>
				))}
			</CommonTable>
		</PageContainer>
	);
};

export default Homework;
