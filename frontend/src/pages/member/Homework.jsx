import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { apiUrl } from '../../api/apiBase';

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
			const Homework = () => null;

			export default Homework;
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
