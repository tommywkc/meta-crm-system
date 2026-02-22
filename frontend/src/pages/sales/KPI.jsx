import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchSalesKpi } from '../../api/kpiAPI';
import CommonTable from '../../components/CommonTable';
import { MobileCard, MobileCardRow } from '../../components/MobileCard';

// Helper to format numbers as percentages
const formatPercent = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${(Number(value) * 100).toFixed(1)}%`;
};

// Helper to format numbers as currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD', minimumFractionDigits: 0 }).format(value);
};

const METRICS = [
	{ key: 'conversionRate', label: '成交率', type: 'percent' },
	{ key: 'renewalRate', label: '續報率', type: 'percent' },
	{ key: 'actualReceiveAmount', label: '實收金額', type: 'currency' },
	{ key: 'actualReceiveRate', label: '實收率', type: 'percent' },
	{ key: 'unpaidFollowupCount', label: '未付款跟進量', type: 'number' },
	{ key: 'seminarConversion', label: '講座到課轉化', type: 'percent' },
];

const formatValue = (value, type) => {
	if (value === null || value === undefined) return 'N/A';
	if (type === 'percent') return formatPercent(value);
	if (type === 'currency') return formatCurrency(value);
	return String(value);
};

const KPI = () => {
	const { user } = useAuth();
	const [activeView, setActiveView] = useState('personal');
	const [kpiData, setKpiData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
    const [date, setDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

	const userRole = user?.role?.toLowerCase();
	const isLeader = userRole === 'leader';
	const isSales = userRole === 'sales';

    useEffect(() => {
        const loadKpiData = async () => {
            try {
                setLoading(true);
                const data = await fetchSalesKpi({ year: date.year, month: date.month });
                setKpiData(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch KPI data:", err);
                setError(err.message || '無法載入KPI數據');
            } finally {
                setLoading(false);
            }
        };

        if (isLeader || isSales) {
            loadKpiData();
        } else {
            setLoading(false);
        }
    }, [user, date, isLeader, isSales]);

	// Transform personal KPI data for display (includes admin-set targets when available)
	const personalCompare = kpiData?.personal?.compare || null;
	const personalMetrics = kpiData?.personal ? METRICS.map((m) => {
		const c = personalCompare ? personalCompare[m.key] : null;
		// Fallback to original metrics if compare isn't provided
		const fallbackActual = kpiData?.personal?.metrics ? kpiData.personal.metrics[m.key] : null;
		const actual = c ? c.actual : fallbackActual;
		return {
			indicator: m.label,
			value: formatValue(actual, m.type),
			target: formatValue(c ? c.target : null, m.type),
			status: (c && c.status) ? c.status : 'N/A'
		};
	}) : [];

	// Transform team KPI data for display (includes admin-set targets when available)
	const teamCompare = kpiData?.team?.compare || null;
	const teamMetrics = kpiData?.team ? METRICS.map((m) => {
		const c = teamCompare ? teamCompare[m.key] : null;
		const fallbackActual = kpiData?.team?.metrics ? kpiData.team.metrics[m.key] : null;
		const actual = c ? c.actual : fallbackActual;
		return {
			indicator: m.label,
			value: formatValue(actual, m.type),
			target: formatValue(c ? c.target : null, m.type),
			status: (c && c.status) ? c.status : 'N/A'
		};
	}) : [];

    const teamHeaders = ['指標', '實績', '目標', '達成率'];
    const personalHeaders = ['指標', '實績', '目標', '達成率'];

    const renderTeamCard = (metric, idx) => (
        <MobileCard key={`team-card-${idx}`}>
            <MobileCardRow label="指標" value={metric.indicator} />
            <MobileCardRow label="實績" value={metric.value} />
            <MobileCardRow label="目標" value={metric.target} />
			<MobileCardRow label="達成率" value={metric.status} />
        </MobileCard>
    );

    const renderPersonalCard = (metric, idx) => (
        <MobileCard key={`personal-card-${idx}`}>
            <MobileCardRow label="指標" value={metric.indicator} />
            <MobileCardRow label="實績" value={metric.value} />
            <MobileCardRow label="目標" value={metric.target} />
			<MobileCardRow label="達成率" value={metric.status} />
        </MobileCard>
    );

    if (loading) {
        return <div style={{ padding: 20 }}><h2>業務 KPI</h2><p>載入中...</p></div>;
    }

    if (error) {
        return <div style={{ padding: 20 }}><h2>業務 KPI</h2><p style={{ color: 'red' }}>{error}</p></div>;
    }

	return (
		<div style={{ padding: 20 }}>
			<h2>業務 KPI {isLeader ? '(Leader)' : '(Sales)'}</h2>

            <div style={{ marginBottom: 20 }}>
                <input 
                    type="month" 
                    value={`${date.year}-${String(date.month).padStart(2, '0')}`}
                    onChange={(e) => {
                        const [year, month] = e.target.value.split('-');
                        setDate({ year: parseInt(year), month: parseInt(month) });
                    }}
                />
            </div>

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
							<h2>團隊 KPI - {date.year}年{date.month}月</h2>
							<CommonTable headers={teamHeaders} data={teamMetrics} renderCard={renderTeamCard}>
									{teamMetrics.map((row, idx) => (
										<tr key={idx}>
											<td>{row.indicator}</td>
											<td>{row.value}</td>
											<td>{row.target}</td>
											<td>{row.status}</td>
										</tr>
									))}
							</CommonTable>
						</section>
					)}

					{activeView === 'personal' && (
						<section>
							<h2>個人 KPI - {date.year}年{date.month}月</h2>
							<CommonTable headers={personalHeaders} data={personalMetrics} renderCard={renderPersonalCard}>
									{personalMetrics.map((metric, idx) => (
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
						<h2>我的 KPI - {date.year}年{date.month}月</h2>
						<CommonTable headers={personalHeaders} data={personalMetrics} renderCard={renderPersonalCard}>
								{personalMetrics.map((metric, idx) => (
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
