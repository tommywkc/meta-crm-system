import React, { useState, useEffect } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const Files = () => {
	const [homeworkFiles, setHomeworkFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		fetchFiles();
	}, []);

	const fetchFiles = async () => {
		setLoading(true);
            setError('');
		try {
            	// Fetch all homework files (Admin API)
			const homeworkRes = await fetch('http://localhost:4000/api/homework/files/admin/all', {
				method: 'GET',
				credentials: 'include'
			});
			const homeworkData = await homeworkRes.json();
			
				if (homeworkData.success) {
					setHomeworkFiles(homeworkData.files || []);
				} else {
					setError(homeworkData.error || '無法獲取功課檔案');
				}

				// Certificate files API call can be added here if needed
				// const certificateRes = await fetch('http://localhost:4000/api/certificates/files', {...});
		} catch (err) {
			console.error('Failed to fetch file list:', err);
			setError(`無法獲取檔案列表: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadFile = async (file) => {
		try {
			const fileName = encodeURIComponent(file.name);
			const response = await fetch(`http://localhost:4000/api/homework/download/${fileName}`, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: '下載失敗' }));
				alert(`下載失敗: ${error.error || '未知錯誤'}`);
				return;
			}

			// Get filename from the Response header (if provided)
			const contentDisposition = response.headers.get('content-disposition');
			let fileName_download = file.metadata?.originalName || file.name.split('/').pop();
			
			if (contentDisposition && contentDisposition.includes('filename=')) {
				fileName_download = contentDisposition.split('filename=')[1].replace(/"/g, '');
			}

			// Download the file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName_download;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Download file failed:', err);
			alert(`下載失敗: ${err.message}`);
		}
	};

	const handleDeleteFile = async (file) => {
		if (!window.confirm(`確定要刪除檔案 "${file.metadata?.originalName || file.name}" 嗎？`)) {
			return;
		}

		try {
			const response = await fetch(`http://localhost:4000/api/homework/file/${encodeURIComponent(file.name)}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			const result = await response.json();
			if (result.success || response.ok) {
				alert('檔案已刪除');
				fetchFiles(); // refresh the list
			} else {
				alert(`刪除失敗: ${result.error || '未知錯誤'}`);
			}
		} catch (err) {
			console.error('Delete file failed:', err);
			alert(`刪除失敗: ${err.message}`);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>檔案/訂閱管理(Admin)</h1>
			
			{error && <p style={{ color: 'red' }}>{error}</p>}
			{loading && <p>加載中...</p>}

			<section style={{ marginBottom: 30 }}>
				<h2>功課</h2>
				{homeworkFiles.length > 0 ? (
					<table style={tableStyle}>
						<thead>
							<tr>
								<th style={thTdStyle}>Student ID</th>
								<th style={thTdStyle}>Student Name</th>
								<th style={thTdStyle}>課程</th>
								<th style={thTdStyle}>Assignment</th>
								<th style={thTdStyle}>檔案名稱</th>
								<th style={thTdStyle}>上傳日期</th>
								<th style={thTdStyle}>檔案大小</th>
								<th style={thTdStyle}>操作</th>
							</tr>
						</thead>
						<tbody>
							{homeworkFiles.map((file, idx) => (
								<tr key={idx}>
									<td style={thTdStyle}>XXX</td>
									<td style={thTdStyle}>XXX</td>
									<td style={thTdStyle}>XXX</td>
									<td style={thTdStyle}>XXX</td>
									<td style={thTdStyle}>{file.metadata?.originalName || file.name}</td>
									<td style={thTdStyle}>
										{file.metadata?.uploadDate 
											? new Date(file.metadata.uploadDate).toLocaleString() 
											: file.properties?.lastModified
											? new Date(file.properties.lastModified).toLocaleString()
											: '—'
										}
									</td>
									<td style={thTdStyle}>
										{file.properties?.contentLength ? `${(file.properties.contentLength / 1024).toFixed(2)} KB` : '—'}
									</td>
									<td style={thTdStyle}>
										<button 
											onClick={() => handleDownloadFile(file)}
											style={{ marginRight: '8px' }}
										>
											下載
										</button>
										<button 
											onClick={() => handleDeleteFile(file)}
											style={{marginRight: '8px'}}
										>
											刪除
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p>沒有功課檔案</p>
				)}
			</section>

			<section style={{ marginBottom: 30 }}>
				<h2>訂閱管理</h2>
			</section>

			<section>
				<h2>證書</h2>
			</section>
		</div>
	);
};

export default Files;
