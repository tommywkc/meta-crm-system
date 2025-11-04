import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockHomework = [
	{ id: 'H1001', subject: 'AI Animation 9A', assignment: 'Project 1', due: '2025-11-05', status: '未上傳', file: null },
	{ id: 'H1002', subject: 'AI Foundations', assignment: 'Project 2', due: '2025-11-10', status: '已上傳', file: 'ai_report.pdf' }
];

const Homework = () => {
	const [list, setList] = useState(mockHomework);
	const [uploading, setUploading] = useState({});
	const [error, setError] = useState('');

	const handleFileChange = async (e, item) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;

		// 開始上傳
		setUploading((s) => ({ ...s, [item.id]: true }));
		setError('');

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('assignmentId', item.id);

			const response = await fetch('http://localhost:4000/api/homework/upload', {
				method: 'POST',
				body: formData,
				credentials: 'include' // include cookies
			});

			const result = await response.json();

			if (result.success) {
				// update list status
				setList((prev) => prev.map((h) => (
					h.id === item.id 
						? { ...h, status: '已上傳', file: result.data.originalName, fileUrl: result.data.url } 
						: h
				)));
				alert(`成功上傳 ${result.data.originalName} 到 ${item.assignment}`);
			} else {
				setError(result.error || '上傳失敗');
				alert(`上傳失敗: ${result.error || '未知錯誤'}`);
			}
		} catch (error) {
			console.error('Upload error:', error);
			setError('網路錯誤或伺服器無回應');
			alert('上傳失敗: 網路錯誤或伺服器無回應');
		} finally {
			// end upload state
			setUploading((s) => {
				const n = { ...s };
				delete n[item.id];
				return n;
			});
		}
	};

	const handleDownloadFile = async (fileUrl) => {
		try {
			// extract file name from URL (remove domain portion)
			// example: https://metaacademyfiles.blob.core.windows.net/homework-files/50003/H1001/xxx.jpg
			// extract: 50003/H1001/xxx.jpg
			const urlParts = fileUrl.split('/homework-files/');
			const fileName = urlParts[1] || fileUrl.split('/').pop();
			
			const encodedFileName = encodeURIComponent(fileName);
			const response = await fetch(`http://localhost:4000/api/homework/download/${encodedFileName}`, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: '下載失敗' }));
				alert(`下載失敗: ${error.error || '未知錯誤'}`);
				return;
			}

			// 從 Response Header 中獲取檔案名稱
			const contentDisposition = response.headers.get('content-disposition');
			let fileName_download = fileName.split('/').pop();
			
			if (contentDisposition && contentDisposition.includes('filename=')) {
				fileName_download = contentDisposition.split('filename=')[1].replace(/"/g, '');
			}

			// 下載檔案
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
			console.error('下載檔案失敗:', err);
			alert(`下載失敗: ${err.message}`);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>作業 / 任務 (Member)</h1>
			<p>在此上傳你的 Assignment 到 Azure Blob Storage。</p>
			
			{error && (
				<div>
					錯誤: {error}
				</div>
			)}

			<table style={tableStyle}>
				<thead>
								<tr>
									<th style={thTdStyle}>課程</th>
									<th style={thTdStyle}>Assignment</th>
									<th style={thTdStyle}>截止</th>
									<th style={thTdStyle}>狀態</th>
									<th style={thTdStyle}>上傳</th>
								</tr>
				</thead>
				<tbody>
					{list.map((h) => (
						<tr key={h.id}>
							<td style={thTdStyle}>{h.subject}</td>
							<td style={thTdStyle}>{h.assignment}</td>
							<td style={thTdStyle}>{h.due}</td>
							<td style={thTdStyle}>
								{h.status}
								{h.file && (
									<div>
										檔案: {h.file}
										{h.fileUrl && (
											<button 
												onClick={() => handleDownloadFile(h.fileUrl)}
												style={{ marginLeft: '8px', padding: '4px 8px' }}
											>
												下載
											</button>
										)}
									</div>
								)}
							</td>
							<td style={thTdStyle}>
								<input 
									type="file" 
									onChange={(e) => handleFileChange(e, h)}
									disabled={!!uploading[h.id]}
									accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
								/>
								{uploading[h.id] && <div>上傳中…</div>}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Homework;
