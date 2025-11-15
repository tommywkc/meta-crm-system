import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const Download = () => {
	const [selectedDate, setSelectedDate] = useState('');
	const [selectedClass, setSelectedClass] = useState('');
	const [showPreview, setShowPreview] = useState(false);

	// Mock data for classes
	const classes = [
		{ id: 'C1', name: 'XXX', date: '2025-11-15' },
		{ id: 'C2', name: 'YYY', date: '2025-11-20' },
		{ id: 'C3', name: 'ZZZ', date: '2025-11-22' }
	];

	// Mock attendance list data
	const mockAttendanceData = [
		{ no: 1, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 2, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 3, name: 'XXX', phone: 'XXX', signature: '', mark: '🔴' },
		{ no: 4, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 5, name: 'XXX', phone: 'XXX', signature: '', mark: '📄' },
		{ no: 6, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 7, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 8, name: 'XXX', phone: 'XXX', signature: '', mark: '💬' },
		{ no: 9, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 10, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 11, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 12, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 13, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 14, name: 'XXX', phone: 'XXX', signature: '', mark: '🔴' },
		{ no: 15, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 16, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 17, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 18, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 19, name: 'XXX', phone: 'XXX', signature: '', mark: '📄' },
		{ no: 20, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 21, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 22, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 23, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 24, name: 'XXX', phone: 'XXX', signature: '', mark: '💬' },
		{ no: 25, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 26, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 27, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 28, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 29, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 30, name: 'XXX', phone: 'XXX', signature: '', mark: '🔴' },
		{ no: 31, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 32, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 33, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 34, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 35, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 36, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 37, name: 'XXX', phone: 'XXX', signature: '', mark: '📄' },
		{ no: 38, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 39, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 40, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 41, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 42, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 43, name: 'XXX', phone: 'XXX', signature: '', mark: '💬' },
		{ no: 44, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 45, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 46, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 47, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 48, name: 'XXX', phone: 'XXX', signature: '', mark: '🔴' },
		{ no: 49, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 50, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 51, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 52, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 53, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 54, name: 'XXX', phone: 'XXX', signature: '', mark: '📄' },
		{ no: 55, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 56, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 57, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 58, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 59, name: 'XXX', phone: 'XXX', signature: '', mark: '' },
		{ no: 60, name: 'XXX', phone: 'XXX', signature: '', mark: '💬' }
	];

	const handleDownload = () => {
		if (!selectedDate || !selectedClass) {
			alert('請選擇日期和班別');
			return;
		}
		
		const selectedClassName = classes.find(c => c.id === selectedClass)?.name || 'Unknown';
		const csv = [
			['點名表', selectedClassName, selectedDate].join(','),
			['編號', '姓名', '電話', '簽名', '標記'].join(','),
			...mockAttendanceData.map(r => 
				[r.no, r.name, r.phone, r.signature, r.mark].join(',')
			)
		].join('\n');
		
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `點名表_${selectedClassName}_${selectedDate}.csv`;
		link.click();
	};

	const handlePrint = () => {
		if (!selectedDate || !selectedClass) {
			alert('請選擇日期和班別');
			return;
		}
		setShowPreview(true);
	};

	const filteredData = mockAttendanceData;

	return (
		<div style={{ padding: 20 }}>
			<h1>下載名單（課堂用）</h1>

			<section style={{ marginBottom: 30 }}>
				<h2>點名表下載</h2>
				<div style={{ marginBottom: 20 }}>
					<label style={{ marginRight: 15 }}>
						選擇日期：
						<input 
							type="date" 
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							style={{ marginLeft: 8 }}
						/>
					</label>
					<label style={{ marginRight: 15 }}>
						選擇班別：
						<select 
							value={selectedClass}
							onChange={(e) => setSelectedClass(e.target.value)}
							style={{ marginLeft: 8 }}
						>
							<option value="">-- 請選擇 --</option>
							{classes.map(c => (
								<option key={c.id} value={c.id}>{c.name}</option>
							))}
						</select>
					</label>
				</div>

				<div style={{ marginBottom: 20 }}>
					<button onClick={handleDownload} style={{ marginRight: 8 }}>
						下載 CSV
					</button>
					<button onClick={handlePrint}>
						列印預覽
					</button>
				</div>

				{showPreview && (
					<div style={{ marginTop: 20, border: '1px solid #ccc', padding: 20, backgroundColor: '#f9f9f9' }}>
						<div style={{ textAlign: 'center', marginBottom: 20 }}>
							<h3>點名表 - {classes.find(c => c.id === selectedClass)?.name}</h3>
							<p>日期：{selectedDate}</p>
						</div>

						<table style={{ ...tableStyle, fontSize: 12 }}>
							<thead>
								<tr>
									<th style={{ ...thTdStyle, width: '5%' }}>編號</th>
									<th style={{ ...thTdStyle, width: '15%' }}>姓名</th>
									<th style={{ ...thTdStyle, width: '15%' }}>電話</th>
									<th style={{ ...thTdStyle, width: '50%' }}>簽名</th>
									<th style={{ ...thTdStyle, width: '15%' }}>標記</th>
								</tr>
							</thead>
							<tbody>
								{filteredData.map((row) => (
									<tr key={row.no}>
										<td style={{ ...thTdStyle, textAlign: 'center' }}>{row.no}</td>
										<td style={thTdStyle}>{row.name}</td>
										<td style={thTdStyle}>{row.phone}</td>
										<td style={{ ...thTdStyle, height: 30 }}></td>
										<td style={{ ...thTdStyle, textAlign: 'center' }}>{row.mark}</td>
									</tr>
								))}
							</tbody>
						</table>

						<div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
							<p>圖例：🔴 欠款 | 📄 證書未出 | 💬 特別座位</p>
						</div>

						<div style={{ marginTop: 20, textAlign: 'center' }}>
							<button onClick={() => window.print()} style={{ marginRight: 8 }}>
								列印
							</button>
							<button onClick={() => setShowPreview(false)}>
								關閉預覽
							</button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
};

export default Download;
