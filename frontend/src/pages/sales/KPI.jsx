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

	// Transform personal KPI data for display
	const personalMetrics = kpiData?.personal?.metrics ? [
		{ indicator: '成交率', value: formatPercent(kpiData.personal.metrics.conversionRate), target: 'N/A', status: 'N/A' },
		{ indicator: '續報率', value: kpiData.personal.metrics.renewalRate === null ? 'N/A' : formatPercent(kpiData.personal.metrics.renewalRate), target: 'N/A', status: 'N/A' },
		{ indicator: '實收金額', value: formatCurrency(kpiData.personal.metrics.actualReceiveAmount), target: 'N/A', status: 'N/A' },
        { indicator: '實收率', value: formatPercent(kpiData.personal.metrics.actualReceiveRate), target: 'N/A', status: 'N/A' },
		{ indicator: '未付款跟進量', value: kpiData.personal.metrics.unpaidFollowupCount, target: 'N/A', status: 'N/A' },
		{ indicator: '講座到課轉化', value: kpiData.personal.metrics.seminarConversion === null ? 'N/A' : formatPercent(kpiData.personal.metrics.seminarConversion), target: 'N/A', status: 'N/A' }
	] : [];

	// For now, team data is just the aggregated metrics.
    // We can expand this to show per-person data if the API provides it.
	const teamMetrics = kpiData?.team?.metrics ? [
        { indicator: '總簽單數', value: kpiData.team.total_signed },
        { indicator: '總成交數', value: kpiData.team.total_deals },
		{ indicator: '團隊成交率', value: formatPercent(kpiData.team.metrics.conversionRate) },
		{ indicator: '團隊總實收', value: formatCurrency(kpiData.team.metrics.actualReceiveAmount) },
        { indicator: '團隊實收率', value: formatPercent(kpiData.team.metrics.actualReceiveRate) },
		{ indicator: '團隊未付款跟進量', value: kpiData.team.metrics.unpaidFollowupCount },
	] : [];

    const teamHeaders = ['指標', '數值'];
    const personalHeaders = ['指標', '實績', '目標', '狀態'];

    const renderTeamCard = (metric, idx) => (
        <MobileCard key={`team-card-${idx}`}>
            <MobileCardRow label="指標" value={metric.indicator} />
            <MobileCardRow label="數值" value={metric.value} />
        </MobileCard>
    );

    const renderPersonalCard = (metric, idx) => (
        <MobileCard key={`personal-card-${idx}`}>
            <MobileCardRow label="指標" value={metric.indicator} />
            <MobileCardRow label="實績" value={metric.value} />
            <MobileCardRow label="目標" value={metric.target} />
            <MobileCardRow label="狀態" value={metric.status} />
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
