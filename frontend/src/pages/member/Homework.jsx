import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const mockHomework = [
	{ id: 'H1001', subject: 'AI Animation 9A', assignment: 'Project 1', due: '2025-11-05', status: '未上傳', file: null },
	{ id: 'H1002', subject: 'AI Foundations', assignment: 'Project 2', due: '2025-11-10', status: '已上傳', file: 'ai_report.pdf' }
];

const Homework = () => {
	const [list, setList] = useState(mockHomework);
	const [uploading, setUploading] = useState({});

	const handleFileChange = (e, item) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		// simulate upload
		setUploading((s) => ({ ...s, [item.id]: true }));
		setTimeout(() => {
			setList((prev) => prev.map((h) => (h.id === item.id ? { ...h, status: '已上傳', file: file.name } : h)));
			setUploading((s) => {
				const n = { ...s };
				delete n[item.id];
				return n;
			});
			alert(`已模擬上傳 ${file.name} 到 ${item.assignment}`);
		}, 800);
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>作業 / 任務 (Member)</h1>
			<p>在此上傳你的 Assignment。</p>

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
							<td style={thTdStyle}>{h.status}{h.file ? ` (${h.file})` : ''}</td>
							<td style={thTdStyle}>
								<label style={{ cursor: 'pointer' }}>
									<input type="file" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, h)} />
									<button disabled={!!uploading[h.id]}>{uploading[h.id] ? '上傳中…' : '上傳'}</button>
								</label>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Homework;
