import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const Reports = () => {
	const [activeTab, setActiveTab] = useState(1);
	const [expandedGroup, setExpandedGroup] = useState(null);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [selectedMonth, setSelectedMonth] = useState(null);

	// Mock data for section ①
	const allCustomersData = [
		{ id: 1, name: 'XXXX', phone: 'XXXX', email: 'XXXX', course: 'XXXX', source: 'XXXX', joinDate: 'XXXX', sales: 'XXXX' },
		{ id: 2, name: 'XXXX', phone: 'XXXX', email: 'XXXX', course: 'XXXX', source: 'XXXX', joinDate: 'XXXX', sales: 'XXXX' }
	];

	// Mock data for section ②
	const courseGroups = ['XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'];
	
	const sessionInfoData = [
		{ id: 1, date: 'XXXX', time: 'XXXX', location: 'XXXX', rentalCost: 'XXXX', type: 'XXXX' },
		{ id: 2, date: 'XXXX', time: 'XXXX', location: 'XXXX', rentalCost: 'XXXX', type: 'XXXX' }
	];

	const promotionExpenseData = [
		{ month: 'XXXX', amount: 'XXXX', receipt: 'XXXX' },
		{ month: 'XXXX', amount: 'XXXX', receipt: 'XXXX' }
	];

	const courseCustomersData = [
		{ paymentDate: 'XXXX', finalDate: 'XXXX', name: 'XXXX', amount: 'XXXX', method: 'XXXX', phone: 'XXXX', findMonth: 'XXXX', referrer: 'XXXX', sales: 'XXXX', receiptIssued: 'XXXX', certificateIssued: 'XXXX' },
		{ paymentDate: 'XXXX', finalDate: 'XXXX', name: 'XXXX', amount: 'XXXX', method: 'XXXX', phone: 'XXXX', findMonth: 'XXXX', referrer: 'XXXX', sales: 'XXXX', receiptIssued: 'XXXX', certificateIssued: 'XXXX' }
	];

	// Mock data for section ③
	const attendedSeminarData = [
		{ name: 'XXXX', phone: 'XXXX', email: 'XXXX', attendDates: 'XXXX' },
		{ name: 'XXXX', phone: 'XXXX', email: 'XXXX', attendDates: 'XXXX' }
	];

	const notAttendedData = [
		{ name: 'XXXX', phone: 'XXXX', email: 'XXXX' },
		{ name: 'XXXX', phone: 'XXXX', email: 'XXXX' }
	];

	// Mock data for section ④
	const financialReportData = [
		{ indicator: '當月收生', value: 'XXXX' },
		{ indicator: '銷售總額（按找數月）', value: 'XXXX' },
		{ indicator: '支付手續費', value: 'XXXX' },
		{ indicator: '當月實收', value: 'XXXX' },
		{ indicator: '介紹費', value: 'XXXX' },
		{ indicator: '宣傳費', value: 'XXXX' },
		{ indicator: '租場費', value: 'XXXX' },
		{ indicator: '銷售佣金分成', value: 'XXXX' },
		{ indicator: '日曆成本', value: 'XXXX' },
		{ indicator: '雜費', value: 'XXXX' },
		{ indicator: '直接支出', value: 'XXXX' },
		{ indicator: 'GP（毛利潤）', value: 'XXXX' },
		{ indicator: 'GP%', value: 'XXXX' }
	];

	const downloadCSV = (data, filename) => {
		const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>報表中心 (Admin)</h1>

			{/* Section ① */}
			<section>
				<h2>全客戶資料名單</h2>
				<div>
					<label>課程篩選: </label>
					<select>
						<option>全部</option>
						<option>AI 課</option>
						<option>AI Agent 課</option>
					</select>
					<label>來源: </label>
					<select>
						<option>全部</option>
						<option>介紹</option>
						<option>廣告</option>
					</select>
					<label>期間: </label>
					<input type="date" />
					到
					<input type="date" />
					<label>銷售: </label>
					<select>
						<option>全部</option>
						<option>銷售林</option>
						<option>經理張</option>
					</select>
					<button onClick={() => downloadCSV(allCustomersData, '全客戶資料.csv')}>CSV</button>
					<button onClick={() => downloadCSV(allCustomersData, '全客戶資料.xlsx')}>XLSX</button>
				</div>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>姓名</th>
							<th style={thTdStyle}>電話</th>
							<th style={thTdStyle}>Email</th>
							<th style={thTdStyle}>課程</th>
							<th style={thTdStyle}>來源</th>
							<th style={thTdStyle}>加入日期</th>
							<th style={thTdStyle}>負責銷售</th>
						</tr>
					</thead>
					<tbody>
						{allCustomersData.map((row) => (
							<tr key={row.id}>
								<td style={thTdStyle}>{row.name}</td>
								<td style={thTdStyle}>{row.phone}</td>
								<td style={thTdStyle}>{row.email}</td>
								<td style={thTdStyle}>{row.course}</td>
								<td style={thTdStyle}>{row.source}</td>
								<td style={thTdStyle}>{row.joinDate}</td>
								<td style={thTdStyle}>{row.sales}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			{/* Section ② */}
			<section>
				<h2>課程分組</h2>
				<div>
					{courseGroups.map((group) => (
						<div key={group}>
							<button onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}>
								{group} {expandedGroup === group ? '▼' : '▶'}
							</button>
						</div>
					))}
				</div>

				{expandedGroup && (
					<div>
						<h3>{expandedGroup}</h3>
						<div>
							<button onClick={() => setActiveTab(201)}>講座及課堂資訊總表</button>
							<button onClick={() => setActiveTab(202)}>宣傳費</button>
							<button onClick={() => setActiveTab(203)}>課程的客戶資料名單</button>
						</div>

						{activeTab === 201 && (
							<table style={tableStyle}>
								<thead>
									<tr>
										<th style={thTdStyle}>日期</th>
										<th style={thTdStyle}>時間</th>
										<th style={thTdStyle}>地點</th>
										<th style={thTdStyle}>租場費用</th>
										<th style={thTdStyle}>費用類型</th>
									</tr>
								</thead>
								<tbody>
									{sessionInfoData.map((row) => (
										<tr key={row.id}>
											<td style={thTdStyle}>{row.date}</td>
											<td style={thTdStyle}>{row.time}</td>
											<td style={thTdStyle}>{row.location}</td>
											<td style={thTdStyle}>${row.rentalCost}</td>
											<td style={thTdStyle}>{row.type}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}

						{activeTab === 202 && (
							<table style={tableStyle}>
								<thead>
									<tr>
										<th style={thTdStyle}>月份</th>
										<th style={thTdStyle}>金額</th>
										<th style={thTdStyle}>單據</th>
									</tr>
								</thead>
								<tbody>
									{promotionExpenseData.map((row, idx) => (
										<tr key={idx}>
											<td style={thTdStyle}>{row.month}</td>
											<td style={thTdStyle}>¥{row.amount}</td>
											<td style={thTdStyle}><a href="#">{row.receipt}</a></td>
										</tr>
									))}
								</tbody>
								<tfoot>
									<tr>
										<td style={thTdStyle}>合計</td>
										<td style={thTdStyle}>${promotionExpenseData.reduce((sum, r) => sum + r.amount, 0)}</td>
										<td style={thTdStyle}></td>
									</tr>
								</tfoot>
							</table>
						)}

						{activeTab === 203 && (
							<table style={tableStyle}>
								<thead>
									<tr>
										<th style={thTdStyle}>付款日</th>
										<th style={thTdStyle}>尾款日</th>
										<th style={thTdStyle}>姓名</th>
										<th style={thTdStyle}>付款金額</th>
										<th style={thTdStyle}>付款手段</th>
										<th style={thTdStyle}>電話</th>
										<th style={thTdStyle}>找數月</th>
										<th style={thTdStyle}>介紹人</th>
										<th style={thTdStyle}>負責銷售</th>
										<th style={thTdStyle}>收據是否已出</th>
										<th style={thTdStyle}>證書是否已出</th>
									</tr>
								</thead>
								<tbody>
									{courseCustomersData.map((row, idx) => (
										<tr key={idx}>
											<td style={thTdStyle}>{row.paymentDate}</td>
											<td style={thTdStyle}>{row.finalDate}</td>
											<td style={thTdStyle}>{row.name}</td>
											<td style={thTdStyle}>${row.amount}</td>
											<td style={thTdStyle}>{row.method}</td>
											<td style={thTdStyle}>{row.phone}</td>
											<td style={thTdStyle}>{row.findMonth}</td>
											<td style={thTdStyle}>{row.referrer}</td>
											<td style={thTdStyle}>{row.sales}</td>
											<td style={thTdStyle}>{row.receiptIssued}</td>
											<td style={thTdStyle}>{row.certificateIssued}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				)}
			</section>

			{/* Section ③ */}
			<section>
				<h2>未付款客人名單</h2>
				<div>
					<button onClick={() => setActiveTab(301)}>出席過講座名單</button>
					<button onClick={() => setActiveTab(302)}>未出席講座名單</button>
				</div>

				{activeTab === 301 && (
					<div>
						<h3>出席過講座名單</h3>
						<p>課程篩選: 
							<select>
								<option>全部</option>
								<option>AI 課</option>
								<option>AI Agent 課</option>
							</select>
						</p>
						<table style={tableStyle}>
							<thead>
								<tr>
									<th style={thTdStyle}>姓名</th>
									<th style={thTdStyle}>電話</th>
									<th style={thTdStyle}>Email</th>
									<th style={thTdStyle}>出席日期清單</th>
								</tr>
							</thead>
							<tbody>
								{attendedSeminarData.map((row, idx) => (
									<tr key={idx}>
										<td style={thTdStyle}>{row.name}</td>
										<td style={thTdStyle}>{row.phone}</td>
										<td style={thTdStyle}>{row.email}</td>
										<td style={thTdStyle}>{row.attendDates}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{activeTab === 302 && (
					<div>
						<h3>未出席講座名單</h3>
						<p>課程篩選: 
							<select>
								<option>全部</option>
								<option>AI 課</option>
								<option>AI Agent 課</option>
							</select>
						</p>
						<table style={tableStyle}>
							<thead>
								<tr>
									<th style={thTdStyle}>姓名</th>
									<th style={thTdStyle}>電話</th>
									<th style={thTdStyle}>Email</th>
								</tr>
							</thead>
							<tbody>
								{notAttendedData.map((row, idx) => (
									<tr key={idx}>
										<td style={thTdStyle}>{row.name}</td>
										<td style={thTdStyle}>{row.phone}</td>
										<td style={thTdStyle}>{row.email}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Section ④ */}
			<section>
				<h2>財務報表</h2>
				<div>
					<label>選擇課程: </label>
					<select onChange={(e) => setSelectedCourse(e.target.value)}>
						<option>請選擇</option>
						<option>AI 課</option>
						<option>AI Agent 課</option>
						<option>小紅書</option>
						<option>創業</option>
						<option>AI 動畫</option>
					</select>
					<label>選擇月份: </label>
					<input 
						type="month" 
						onChange={(e) => setSelectedMonth(e.target.value)}
					/>
				</div>

				{selectedCourse && selectedMonth && (
					<div>
						<p>找數月口徑：以實際上課月份為準；學生至少出席一堂，該月即為其找數月。</p>
						<table style={tableStyle}>
							<thead>
								<tr>
									<th style={thTdStyle}>指標</th>
									<th style={thTdStyle}>數值</th>
								</tr>
							</thead>
							<tbody>
								{financialReportData.map((row, idx) => (
									<tr key={idx}>
										<td style={thTdStyle}>{row.indicator}</td>
										<td style={thTdStyle}>{row.value}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{(!selectedCourse || !selectedMonth) && (
					<p>請選擇課程和月份以查看財務報表</p>
				)}
			</section>
		</div>
	);
};

export default Reports;
