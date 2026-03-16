import React, { useEffect, useMemo, useState } from 'react';
import CommonTable from '../../components/CommonTable';
import { MobileCard, MobileCardRow } from '../../components/MobileCard';
import { fetchAdminKpi, saveAdminKpiTarget } from '../../api/kpiAPI';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const GROUP_METRICS = [
  { key: 'conversionRate', label: '成交率', type: 'percent' },
  { key: 'renewalRate', label: '續報率', type: 'percent' },
  { key: 'actualReceiveAmount', label: '實收金額', type: 'currency' },
  { key: 'actualReceiveRate', label: '實收率', type: 'percent' },
  { key: 'unpaidFollowupCount', label: '未付款跟進量', type: 'number' },
  { key: 'seminarConversion', label: '講座到課轉化', type: 'percent' },
];

const PERSONAL_METRICS = [
  { key: 'conversionRate', label: '成交率', type: 'percent' },
  { key: 'renewalRate', label: '續報率', type: 'number' },
  { key: 'actualReceiveAmount', label: '實收金額', type: 'currency' },
  { key: 'actualReceiveRate', label: '實收率', type: 'percent' },
  { key: 'unpaidFollowupCount', label: '未付款跟進量', type: 'number' },
  { key: 'seminarConversion', label: '講座到課轉化', type: 'number' },
];

const formatPercent = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${(Number(value) * 100).toFixed(1)}%`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatValue = (value, type) => {
  if (type === 'percent') return formatPercent(value);
  if (type === 'currency') return formatCurrency(value);
  if (value === null || value === undefined) return 'N/A';
  return String(value);
};

const toPercentDisplay = (storedDecimal) => {
  if (storedDecimal === null || storedDecimal === undefined) return '';
  const num = Number(storedDecimal);
  if (Number.isNaN(num)) return '';
  // stored as 0.9, display as 90
  return num * 100;
};

const toPercentStoredDecimal = (displayPercent) => {
  if (displayPercent === '' || displayPercent === null || displayPercent === undefined) return '';
  const num = Number(displayPercent);
  if (Number.isNaN(num)) return '';
  // display as 90, store as 0.9
  return num / 100;
};

const normalizeInputNumber = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  return Number.isNaN(num) ? '' : num;
};

const KPIAdmin = () => {
  const now = new Date();
  const [date, setDate] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [activeView, setActiveView] = useState('group');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const shiftMonth = (delta) => {
    setDate((prev) => {
      const baseIndex = (prev.year * 12) + (prev.month - 1);
      const nextIndex = baseIndex + delta;
      const nextYear = Math.floor(nextIndex / 12);
      const nextMonth = (nextIndex % 12) + 1;
      return { year: nextYear, month: nextMonth };
    });
  };

  const [groupForm, setGroupForm] = useState({});
  const [personalForm, setPersonalForm] = useState({});
  const [savingScope, setSavingScope] = useState('');

  const loadData = async ({ keepUser = true } = {}) => {
    try {
      setLoading(true);
      const data = await fetchAdminKpi({ year: date.year, month: date.month, userId: selectedUserId || undefined });
      setKpiData(data);

      const firstUser = data?.staffOptions?.[0]?.user_id || '';
      if (!keepUser && !selectedUserId && firstUser) {
        setSelectedUserId(String(firstUser));
      }

      const groupTarget = data?.group?.target || {};
      const personalTarget = data?.personal?.target || {};
      const nextGroup = {};
      const nextPersonal = {};
      GROUP_METRICS.forEach(({ key, type }) => {
        const groupVal = groupTarget[key];
        nextGroup[key] = type === 'percent' ? toPercentDisplay(groupVal) : (groupVal ?? '');
      });
      PERSONAL_METRICS.forEach(({ key, type }) => {
        const personalVal = personalTarget[key];
        nextPersonal[key] = type === 'percent' ? toPercentDisplay(personalVal) : (personalVal ?? '');
      });
      setGroupForm(nextGroup);
      setPersonalForm(nextPersonal);
      setError('');
    } catch (err) {
      console.error('Failed to load admin KPI:', err);
      setError(err.message || '無法載入 KPI 資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ keepUser: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.year, date.month]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadData({ keepUser: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const groupRows = useMemo(() => {
    const compare = kpiData?.group?.compare || {};
    return GROUP_METRICS.map(({ key, label, type }) => ({
      indicator: label,
      actual: formatValue(compare[key]?.actual, type),
      target: formatValue(compare[key]?.target, type),
      status: compare[key]?.status || 'N/A',
    }));
  }, [kpiData]);

  const personalRows = useMemo(() => {
    const compare = kpiData?.personal?.compare || {};
    return PERSONAL_METRICS.map(({ key, label, type }) => ({
      indicator: label,
      actual: formatValue(compare[key]?.actual, type),
      target: formatValue(compare[key]?.target, type),
      status: compare[key]?.status || 'N/A',
    }));
  }, [kpiData]);

  const saveGroupTarget = async () => {
    try {
      setSavingScope('GROUP');
      const payloadTargets = {};
      GROUP_METRICS.forEach(({ key, type }) => {
        payloadTargets[key] = type === 'percent'
          ? toPercentStoredDecimal(groupForm[key])
          : (groupForm[key] ?? '');
      });
      await saveAdminKpiTarget({
        year: date.year,
        month: date.month,
        scope: 'GROUP',
        targets: payloadTargets,
      });
      await loadData({ keepUser: true });
    } catch (err) {
      console.error('Failed to save group KPI target:', err);
      alert(err.message || '更新團隊目標失敗');
    } finally {
      setSavingScope('');
    }
  };

  const savePersonalTarget = async () => {
    if (!selectedUserId) {
      alert('請先選擇業務人員');
      return;
    }
    try {
      setSavingScope('PERSONAL');
      const payloadTargets = {};
      PERSONAL_METRICS.forEach(({ key, type }) => {
        payloadTargets[key] = type === 'percent'
          ? toPercentStoredDecimal(personalForm[key])
          : (personalForm[key] ?? '');
      });
      await saveAdminKpiTarget({
        year: date.year,
        month: date.month,
        scope: 'PERSONAL',
        userId: Number(selectedUserId),
        targets: payloadTargets,
      });
      await loadData({ keepUser: true });
    } catch (err) {
      console.error('Failed to save personal KPI target:', err);
      alert(err.message || '更新個人目標失敗');
    } finally {
      setSavingScope('');
    }
  };

  const renderCard = (row, idx) => (
    <MobileCard key={`metric-card-${idx}`}>
      <MobileCardRow label="指標" value={row.indicator} />
      <MobileCardRow label="實績" value={row.actual} />
      <MobileCardRow label="目標" value={row.target} />
      <MobileCardRow label="達成率" value={row.status} />
    </MobileCard>
  );

  if (loading) {
    return <div style={{ padding: 20 }}><h2>KPI 管理</h2><p>載入中...</p></div>;
  }

  if (error) {
    return <div style={{ padding: 20 }}><h2>KPI 管理</h2><p style={{ color: 'red' }}>{error}</p></div>;
  }

  const renderTargetEditor = (scope, metricDefs, formState, onChange, onSave, isSaving) => (
    <div style={{ marginTop: 12 }}>
      {metricDefs.map((metric) => (
        <div key={`${scope}-input-${metric.key}`} style={{ marginBottom: 8 }}>
          <label style={{ display: 'inline-block', minWidth: 140 }}>{metric.label}</label>
          <input
            type="number"
            step={metric.type === 'number' ? '1' : '0.01'}
            value={formState[metric.key] ?? ''}
            onChange={(e) => onChange((prev) => ({
              ...prev,
              [metric.key]: normalizeInputNumber(e.target.value),
            }))}
          />
        </div>
      ))}
      <button onClick={onSave} disabled={isSaving}>
        {isSaving ? '儲存中...' : (scope === 'group' ? '儲存團隊目標' : '儲存個人目標')}
      </button>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader title="團隊&個人 KPI" />

		<div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
			<button onClick={() => shiftMonth(-1)} style={{ margin: 0 }}>上月</button>
			<button onClick={() => shiftMonth(1)} style={{ margin: 0 }}>下月</button>
			<div style={{ marginLeft: 8, color: '#666' }}>{date.year}年{date.month}月</div>
		</div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveView('group')}
          style={{ marginRight: 8, fontWeight: activeView === 'group' ? 'bold' : 'normal' }}
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

      {activeView === 'group' && (
        <section style={{ marginBottom: 24, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
          <h2>團隊 KPI - {date.year}年{date.month}月</h2>
          <CommonTable headers={['指標', '實績', '目標', '達成率']} data={groupRows} renderCard={renderCard}>
            {groupRows.map((row, idx) => (
              <tr key={`group-row-${idx}`}>
                <td>{row.indicator}</td>
                <td>{row.actual}</td>
                <td>{row.target}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </CommonTable>
          {renderTargetEditor(
            'group',
            GROUP_METRICS,
            groupForm,
            setGroupForm,
            saveGroupTarget,
            savingScope === 'GROUP'
          )}
        </section>
      )}

      {activeView === 'personal' && (
        <section style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
          <h2>個人 KPI - {date.year}年{date.month}月</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>選擇人員</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              {(kpiData?.staffOptions || []).map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.user_id} - {u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <CommonTable headers={['指標', '實績', '目標', '達成率']} data={personalRows} renderCard={renderCard}>
            {personalRows.map((row, idx) => (
              <tr key={`personal-row-${idx}`}>
                <td>{row.indicator}</td>
                <td>{row.actual}</td>
                <td>{row.target}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </CommonTable>

          {renderTargetEditor(
            'personal',
            PERSONAL_METRICS,
            personalForm,
            setPersonalForm,
            savePersonalTarget,
            savingScope === 'PERSONAL'
          )}
        </section>
      )}
    </PageContainer>
  );
};

export default KPIAdmin;
