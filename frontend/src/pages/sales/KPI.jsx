import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CommonTable from '../../components/CommonTable';
import { MobileCard, MobileCardRow } from '../../components/MobileCard';
import { fetchSalesKpi } from '../../api/kpiAPI';

const KPI = () => {
	const { user } = useAuth();
	const [activeView, setActiveView] = useState('personal');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [kpiData, setKpiData] = useState(null);

	const userRole = user?.role?.toLowerCase();
	const isLeader = userRole === 'leader';
	const isSales = userRole === 'sales';

	useEffect(() => {
		let isMounted = true;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				const now = new Date();
				const year = now.getFullYear();
				const month = now.getMonth() + 1;
				const data = await fetchSalesKpi({ year, month });
				if (!isMounted) return;
				setKpiData(data);
			} catch (e) {
				if (!isMounted) return;
				setError(e.message || '載入 KPI 失敗');
			} finally {
				if (isMounted) setLoading(false);
			}
		}
		if (isLeader || isSales) {
			load();
		}
		return () => {
			isMounted = false;
		};
	}, [isLeader, isSales]);

	const teamHeaders = ['範圍', '成交率', '續報率', '實收金額', '未付款跟進量', '講座到課轉化'];
	const personalHeaders = ['指標', '實績'];

	const renderTeamCard = (row, idx) => (
		<MobileCard key={`team-card-${row.scope || idx}`}>
			<MobileCardRow label="範圍" value={row.scope} />
			<MobileCardRow label="成交率" value={row.conversionRate} />
			<MobileCardRow label="續報率" value={row.renewalRate ?? '-'} />
			<MobileCardRow label="實收金額" value={row.actualRevenue} />
			<MobileCardRow label="未付款跟進量" value={row.followUp} />
			<MobileCardRow label="講座到課轉化" value={row.seminarConversion ?? '-'} />
		</MobileCard>
	);

	const renderPersonalCard = (metric, idx) => (
		<MobileCard key={`personal-card-${idx}`}>
			<MobileCardRow label="指標" value={metric.indicator} />
			<MobileCardRow label="實績" value={metric.value} />
		</MobileCard>
	);

	if (!isLeader && !isSales) {
		return <div style={{ padding: 20 }}>您沒有權限查看此頁面</div>;
	}

	const periodLabel = kpiData?.personal?.period || '';
	const personalMetrics = kpiData?.personal?.metrics || {};
	const teamMetrics = kpiData?.team?.metrics || null;

	const personalRows = [
		{ indicator: '成交率', value: personalMetrics.conversionRate != null ? `${(personalMetrics.conversionRate * 100).toFixed(1)}%` : '-' },
		{ indicator: '續報率', value: personalMetrics.renewalRate != null ? `${(personalMetrics.renewalRate * 100).toFixed(1)}%` : '-' },
		{ indicator: '實收金額', value: personalMetrics.actualReceiveAmount != null ? `${personalMetrics.actualReceiveAmount.toFixed(0)}$` : '-' },
		{ indicator: '實收比例', value: personalMetrics.actualReceiveRate != null ? `${(personalMetrics.actualReceiveRate * 100).toFixed(1)}%` : '-' },
		{ indicator: '未付款跟進量', value: personalMetrics.unpaidFollowupCount != null ? String(personalMetrics.unpaidFollowupCount) : '-' },
		{ indicator: '講座到課轉化', value: personalMetrics.seminarConversion != null ? `${(personalMetrics.seminarConversion * 100).toFixed(1)}%` : '-' }
	];

	const tableTeamRows = [];
	if (isLeader && teamMetrics) {
		tableTeamRows.push({
			$scope: '團隊',
			scope: '團隊',
			conversionRate: teamMetrics.conversionRate != null ? `${(teamMetrics.conversionRate * 100).toFixed(1)}%` : '-',
			renewalRate: teamMetrics.renewalRate != null ? `${(teamMetrics.renewalRate * 100).toFixed(1)}%` : '-',
			actualRevenue: teamMetrics.actualReceiveAmount != null ? `${teamMetrics.actualReceiveAmount.toFixed(0)}$` : '-',
			followUp: teamMetrics.unpaidFollowupCount != null ? String(teamMetrics.unpaidFollowupCount) : '-',
			seminarConversion: teamMetrics.seminarConversion != null ? `${(teamMetrics.seminarConversion * 100).toFixed(1)}%` : '-',
		});
	}

	if (loading) {
		return <div style={{ padding: 20 }}>KPI 載入中...</div>;
	}
	if (error) {
		return <div style={{ padding: 20, color: 'red' }}>載入失敗：{error}</div>;
	}

	return (
		<div style={{ padding: 20 }}>
			<h2>業務 KPI {isLeader ? '(Leader)' : '(Sales)'}</h2>
			{periodLabel && <p>統計期間：{periodLabel}</p>}

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

					{activeView === 'team' && isLeader && teamMetrics && (
						<section>
							<h2>團隊 KPI - {periodLabel}</h2>
							<CommonTable headers={teamHeaders} data={tableTeamRows} renderCard={renderTeamCard}>
									{tableTeamRows.map((row) => (
										<tr key={row.scope}>
											<td>{row.scope}</td>
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
							<h2>個人 KPI - {periodLabel}</h2>
							<CommonTable headers={personalHeaders} data={personalRows} renderCard={renderPersonalCard}>
									{personalRows.map((metric, idx) => (
										<tr key={idx}>
											<td>{metric.indicator}</td>
											<td>{metric.value}</td>
										</tr>
									))}
							</CommonTable>
						</section>
					)}
				</>
			) : (
				<section>
					<h2>我的 KPI - {periodLabel}</h2>
					<CommonTable headers={personalHeaders} data={personalRows} renderCard={renderPersonalCard}>
							{personalRows.map((metric, idx) => (
								<tr key={idx}>
									<td>{metric.indicator}</td>
									<td>{metric.value}</td>
								</tr>
							))}
					</CommonTable>
				</section>
			)}
		</div>
	);
};

export default KPI;
