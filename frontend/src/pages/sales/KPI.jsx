import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

const KPI = () => {
	const { user } = useAuth();
	const [activeView, setActiveView] = useState('personal');

	const userRole = user?.role?.toLowerCase();
	const isLeader = userRole === 'leader';
	const isSales = userRole === 'sales';

	// Mock KPI data for personal
	const personalKpiData = {
		month: '2025年11月',
		metrics: [
			{ indicator: '成交率', value: 'XXX%', target: 'XXX%', status: '達成' },
			{ indicator: '續報率', value: 'XXX%', target: 'XXX%', status: 'XXX' },
			{ indicator: '實收金額', value: 'XXX$', target: 'XXX$', status: 'XXX' },
			{ indicator: '未付款跟進量', value: 'XXX', target: 'XXX', status: 'XXX' },
			{ indicator: '講座到課轉化', value: 'XXX%', target: 'XXX%', status: 'XXX' }
		]
	};

	// Mock team data (for Leader only)
	const teamData = [
		{ id: 1, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' },
		{ id: 2, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' },
		{ id: 3, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' }
	];

	// Mock individual sales data
	const individualSalesData = [
		{ id: 1, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' },
		{ id: 2, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' },
		{ id: 3, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' },
		{ id: 4, name: 'XXX', conversionRate: 'XXX%', renewalRate: 'XXX%', actualRevenue: 'XXX$', followUp: 'XXX', seminarConversion: 'XXX%' }
	];

	return (
		<div style={{ padding: 20 }}>
			<h1>業務 KPI {isLeader ? '(Leader)' : '(Sales)'}</h1>

			{isLeader ? (
				<>
					{/* Leader View: Team + Personal */}
					<div style={{ marginBottom: 20 }}>
						<button 
							onClick={() => setActiveView('team')}
							style={{ marginRight: 8, fontWeight: activeView === 'team' ? 'bold' : 'normal' }}
						>
							團隊 KPI
						</button>
						<button 
							onClick={() => setActiveView('personal')}
							style={{ fontWeight: activeView === 'personal' ? 'bold' : 'normal' }}
						>
							個人 KPI
						</button>
					</div>

					{activeView === 'team' && (
						<section>
							<h2>團隊 KPI - {personalKpiData.month}</h2>
							<table style={tableStyle}>
								<thead>
									<tr>
										<th style={thTdStyle}>銷售名稱</th>
										<th style={thTdStyle}>成交率</th>
										<th style={thTdStyle}>續報率</th>
										<th style={thTdStyle}>實收金額</th>
										<th style={thTdStyle}>未付款跟進量</th>
										<th style={thTdStyle}>講座到課轉化</th>
									</tr>
								</thead>
								<tbody>
									{teamData.map((row) => (
										<tr key={row.id}>
											<td style={thTdStyle}>{row.name}</td>
											<td style={thTdStyle}>{row.conversionRate}</td>
											<td style={thTdStyle}>{row.renewalRate}</td>
											<td style={thTdStyle}>{row.actualRevenue}</td>
											<td style={thTdStyle}>{row.followUp}</td>
											<td style={thTdStyle}>{row.seminarConversion}</td>
										</tr>
									))}
								</tbody>
							</table>
						</section>
					)}

					{activeView === 'personal' && (
						<section>
							<h2>個人 KPI - {personalKpiData.month}</h2>
							<table style={tableStyle}>
								<thead>
									<tr>
										<th style={thTdStyle}>指標</th>
										<th style={thTdStyle}>實績</th>
										<th style={thTdStyle}>目標</th>
										<th style={thTdStyle}>狀態</th>
									</tr>
								</thead>
								<tbody>
									{personalKpiData.metrics.map((metric, idx) => (
										<tr key={idx}>
											<td style={thTdStyle}>{metric.indicator}</td>
											<td style={thTdStyle}>{metric.value}</td>
											<td style={thTdStyle}>{metric.target}</td>
											<td style={thTdStyle}>{metric.status}</td>
										</tr>
									))}
								</tbody>
							</table>
						</section>
					)}
				</>
			) : isSales ? (
				<>
					{/* Sales View: Personal Only */}
					<section>
						<h2>我的 KPI - {personalKpiData.month}</h2>
						<table style={tableStyle}>
							<thead>
								<tr>
									<th style={thTdStyle}>指標</th>
									<th style={thTdStyle}>實績</th>
									<th style={thTdStyle}>目標</th>
									<th style={thTdStyle}>狀態</th>
								</tr>
							</thead>
							<tbody>
								{personalKpiData.metrics.map((metric, idx) => (
									<tr key={idx}>
										<td style={thTdStyle}>{metric.indicator}</td>
										<td style={thTdStyle}>{metric.value}</td>
										<td style={thTdStyle}>{metric.target}</td>
										<td style={thTdStyle}>{metric.status}</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
				</>
			) : (
				<p>您沒有權限查看此頁面</p>
			)}
		</div>
	);
};

export default KPI;
