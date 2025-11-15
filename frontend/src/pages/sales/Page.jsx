import React, { useState } from 'react';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const SalesPage = () => {
	// Mock unpaid customers
	const unpaidCustomers = [
		{ id: 1, name: 'XXX', phone: 'XXX', amount: 'XXX$', dueDate: 'XXX', overdueDays: 5, status: 'XXX' },
		{ id: 2, name: 'XXX', phone: 'XXX', amount: 'XXX$', dueDate: 'XXX', overdueDays: 0, status: 'XXX' },
		{ id: 3, name: 'XXX', phone: 'XXX', amount: 'XXX$', dueDate: 'XXX', overdueDays: 2, status: 'XXX' }
	];

	// Mock unpaid but booked this month
	const unpaidBooked = [
		{ id: 1, name: 'XXX', phone: 'XXX', course: 'XXX', date: 'XXX', amount: 'XXX$', status: 'XXX' },
		{ id: 2, name: 'XXX', phone: 'XXX', course: 'XXX', date: 'XXX', amount: 'XXX$', status: 'XXX' },
		{ id: 3, name: 'XXX', phone: 'XXX', course: 'XXX', date: 'XXX', amount: 'XXX$', status: 'XXX' }
	];

  const handleReminder = () => {
    alert('已發送提醒');
  };

	return (
		<div>
			<h1>業務主頁 (Sales)</h1>

			{/* Unpaid Customers Section */}
			<section>
				<h2>未付款客戶清單</h2>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>客戶名稱</th>
							<th style={thTdStyle}>電話</th>
							<th style={thTdStyle}>尾款金額</th>
							<th style={thTdStyle}>尾款日期</th>
							<th style={thTdStyle}>逾期天數</th>
							<th style={thTdStyle}>狀態</th>
							<th style={thTdStyle}>動作</th>
						</tr>
					</thead>
					<tbody>
				{unpaidCustomers.map((row) => (
					<tr key={row.id} style={tableStyle}>
						<td style={thTdStyle}>{row.name}</td>
						<td style={thTdStyle}>{row.phone}</td>
						<td style={thTdStyle}>{row.amount}</td>
						<td style={thTdStyle}>{row.dueDate}</td>
						<td style={thTdStyle}>{row.overdueDays}天(3天自動取消課堂)</td>
						<td style={thTdStyle}>{row.status}</td>
						<td style={thTdStyle}>
							<button onClick={handleReminder}>提醒</button>
						</td>
					</tr>
				))}
					</tbody>
				</table>
			</section>

			{/* Unpaid But Booked Section */}
			<section>
				<h2>未付款但已預約本月課堂</h2>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>客戶名稱</th>
							<th style={thTdStyle}>電話</th>
							<th style={thTdStyle}>課程名稱</th>
							<th style={thTdStyle}>上課日期</th>
							<th style={thTdStyle}>尾款金額</th>
							<th style={thTdStyle}>狀態</th>
							<th style={thTdStyle}>動作</th>
						</tr>
					</thead>
					<tbody>
					{unpaidBooked.map((row) => (
						<tr key={row.id} style={tableStyle}>
							<td style={thTdStyle}>{row.name}</td>
							<td style={thTdStyle}>{row.phone}</td>
							<td style={thTdStyle}>{row.course}</td>
							<td style={thTdStyle}>{row.date}</td>
							<td style={thTdStyle}>{row.amount}</td>
							<td style={thTdStyle}>{row.status}</td>
							<td style={thTdStyle}>
								<button onClick={handleReminder}>發送提醒</button>
							</td>
						</tr>
					))}
					</tbody>
				</table>
			</section>
		</div>
	);
};

export default SalesPage;
