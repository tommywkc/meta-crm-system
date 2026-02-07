import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CommonTable from '../../components/CommonTable';

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

	// Mock individual sales data (not used in current view logic but kept for reference)
	const individualSalesData = [
		// ... (same as personal mock)
	];

    const teamHeaders = ['銷售名稱', '成交率', '續報率', '實收金額', '未付款跟進量', '講座到課轉化'];
    const personalHeaders = ['指標', '實績', '目標', '狀態'];

	return (
		<div style={{ padding: 20 }}>
			<h2>業務 KPI {isLeader ? '(Leader)' : '(Sales)'}</h2>

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
							<CommonTable headers={teamHeaders}>
									{teamData.map((row) => (
										<tr key={row.id}>
											<td>{row.name}</td>
											<td>{row.conversionRate}</td>
											<td>{row.renewalRate}</td>
											<td>{row.actualRevenue}</td>
											<td>{row.followUp}</td>
											<td>{row.seminarConversion}</td>
										</tr>
									))}
							</CommonTable>
						</section>
					)}

					{activeView === 'personal' && (
						<section>
							<h2>個人 KPI - {personalKpiData.month}</h2>
							<CommonTable headers={personalHeaders}>
									{personalKpiData.metrics.map((metric, idx) => (
										<tr key={idx}>
											<td>{metric.indicator}</td>
											<td>{metric.value}</td>
											<td>{metric.target}</td>
											<td>{metric.status}</td>
										</tr>
									))}
							</CommonTable>
						</section>
					)}
				</>
			) : isSales ? (
				<>
					{/* Sales View: Personal Only */}
					<section>
						<h2>我的 KPI - {personalKpiData.month}</h2>
						<CommonTable headers={personalHeaders}>
								{personalKpiData.metrics.map((metric, idx) => (
									<tr key={idx}>
										<td>{metric.indicator}</td>
										<td>{metric.value}</td>
										<td>{metric.target}</td>
										<td>{metric.status}</td>
									</tr>
								))}
						</CommonTable>
					</section>
				</>
			) : (
				<p>您沒有權限查看此頁面</p>
			)}
		</div>
	);
};

export default KPI;
