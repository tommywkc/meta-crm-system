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
				credentials: 'include' // 包含 cookies
			});

			const result = await response.json();

			if (result.success) {
				// 更新列表狀態
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
			console.error('上傳錯誤:', error);
			setError('網路錯誤或伺服器無回應');
			alert('上傳失敗: 網路錯誤或伺服器無回應');
		} finally {
			// 結束上傳狀態
			setUploading((s) => {
				const n = { ...s };
				delete n[item.id];
				return n;
			});
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
											<a 
												href={h.fileUrl} 
												target="_blank" 
												rel="noopener noreferrer"
											>
												查看
											</a>
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
								<div>
									支援: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (最大 10MB)
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Homework;
