import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';
import { commonSelectStyle } from '../../styles/SelectStyles';
import { PageContainer, PageHeader } from '../../components/CommonPage';
import { fetchAllCustomers, fetchCosts, createCost, deleteCost, fetchCourseCustomers, fetchUnpaidCustomers, fetchFinancial } from '../../api/reportsAPI';
import { handleListEvents } from '../../api/eventListAPI';

const renderEmpty = (text = '暫無資料') => (
	<tr>
		<td style={thTdStyle} colSpan={20}>{text}</td>
	</tr>
);

const exportSheet = (data, filenameBase) => {
	if (!data || data.length === 0) return alert('目前沒有可匯出的資料');
	const sheet = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
	XLSX.writeFile(wb, `${filenameBase}.xlsx`);
};

const exportCsv = (data, filename) => {
	if (!data || data.length === 0) return alert('目前沒有可匯出的資料');
	const header = Object.keys(data[0]);
	const rows = data.map((row) => header.map((k) => row[k] ?? ''));
	const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
};

const Reports = () => {
	const [filters, setFilters] = useState({ course: '', source: '', dateStart: '', dateEnd: '', sales: '', keyword: '' });
	const [allCustomers, setAllCustomers] = useState([]);

	const [costFilters, setCostFilters] = useState({ courseCategory: '', year: '', month: '' });
	const [costs, setCosts] = useState([]);
	const [costSummary, setCostSummary] = useState(null);
	const [newCost, setNewCost] = useState({ category: 'RENTAL', course_category: '', event_id: '', year: '', month: '', amount: '', description: '', receipt: null });

	const [courseCategory, setCourseCategory] = useState('');
	const [courseCustomers, setCourseCustomers] = useState([]);
	const [unpaidAttended, setUnpaidAttended] = useState([]);
	const [unpaidNotAttended, setUnpaidNotAttended] = useState([]);

	const [financialCourse, setFinancialCourse] = useState('');
	const [financialMonth, setFinancialMonth] = useState('');
	const [financialData, setFinancialData] = useState(null);

	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setCostFilters((prev) => ({ ...prev, courseCategory }));
		setNewCost((prev) => ({ ...prev, course_category: courseCategory }));
	}, [courseCategory]);

	// load event list for category options and lecture info
	useEffect(() => {
		(async () => {
			try {
				const res = await handleListEvents({ limit: 200, offset: 0, q: '' });
				setEvents(res.events || []);
			} catch (e) {
				console.error('Failed to load events for options', e);
			}
		})();
	}, []);

	const categories = useMemo(() => {
		const set = new Set();
		events.forEach((e) => {
			if (e.category) set.add(e.category);
			else if (e.type) set.add(e.type);
		});
		return Array.from(set);
	}, [events]);

	const salesOptions = useMemo(() => {
		const set = new Set();
		allCustomers.forEach((c) => { if (c.sales_name) set.add(c.sales_name); });
		return Array.from(set);
	}, [allCustomers]);

	const handleFetchAllCustomers = async () => {
		setLoading(true);
		try {
			const data = await fetchAllCustomers(filters);
			setAllCustomers(data || []);
		} catch (e) {
			console.error(e);
			alert('載入全客戶資料失敗');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		handleFetchAllCustomers();
	}, []);

	const handleFetchCosts = async () => {
		try {
			const data = await fetchCosts(costFilters);
			if (data?.items) {
				setCosts(data.items);
				setCostSummary(data.summary || null);
			} else {
				setCosts(data || []);
				setCostSummary(null);
			}
		} catch (e) {
			console.error(e);
			alert('載入成本資料失敗');
		}
	};

	const handleCreateCost = async () => {
		if (!newCost.year || !newCost.month || !newCost.amount) return alert('請填寫年份、月份與金額');
		try {
			const payload = {
				category: newCost.category,
				course_category: newCost.course_category,
				event_id: newCost.event_id || null,
				year: newCost.year,
				month: newCost.month,
				amount: newCost.amount,
				description: newCost.description
			};
			if (newCost.receipt) payload.receipt = newCost.receipt;
			await createCost(payload);
			await handleFetchCosts();
			alert('已新增成本');
		} catch (e) {
			console.error(e);
			alert('新增成本失敗');
		}
	};

	const handleDeleteCost = async (id) => {
		if (!window.confirm('確定刪除這筆成本？')) return;
		try {
			await deleteCost(id);
			await handleFetchCosts();
		} catch (e) {
			console.error(e);
			alert('刪除成本失敗');
		}
	};

	const handleCourseCustomers = async () => {
		try {
			const data = await fetchCourseCustomers({ courseCategory });
			setCourseCustomers(data || []);
		} catch (e) {
			console.error(e);
			alert('載入課程客戶資料失敗');
		}
	};

	const handleUnpaid = async () => {
		try {
			const attended = await fetchUnpaidCustomers({ courseCategory, attended: 'true' });
			const notAttended = await fetchUnpaidCustomers({ courseCategory, attended: 'false' });
			setUnpaidAttended(attended || []);
			setUnpaidNotAttended(notAttended || []);
		} catch (e) {
			console.error(e);
			alert('載入未付款名單失敗');
		}
	};

	const handleFinancial = async () => {
		if (!financialMonth) return alert('請選擇月份');
		const [year, month] = financialMonth.split('-');
		try {
			const data = await fetchFinancial({ courseCategory: financialCourse, year, month });
			setFinancialData(data);
		} catch (e) {
			console.error(e);
			alert('載入財務報表失敗');
		}
	};

	const filteredEvents = useMemo(() => {
		if (!courseCategory) return events;
		return events.filter((e) => (e.category || e.type || '').toString().toLowerCase().includes(courseCategory.toLowerCase()));
	}, [events, courseCategory]);

	return (
		<PageContainer>
			<PageHeader title="報表中心 (Admin)" />

			{/* ① 全客戶資料名單 */}
			<section>
				<h2>① 全客戶資料名單</h2>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					<label>搜尋:</label>
					<input
						style={{ ...commonSelectStyle, minWidth: 160 }}
						placeholder="姓名/電話/Email"
						value={filters.keyword}
						onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
					/>
					<label>課程:</label>
					<select style={commonSelectStyle} value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })}>
						<option value="">全部</option>
						{categories.map((c) => <option key={c} value={c}>{c}</option>)}
					</select>
					<label>來源:</label>
					<input style={commonSelectStyle} value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} placeholder="WhatsApp/廣告/介紹" />
					<label>期間:</label>
					<input type="date" value={filters.dateStart} onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })} />
					<span>到</span>
					<input type="date" value={filters.dateEnd} onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })} />
					<label>銷售:</label>
					<select style={commonSelectStyle} value={filters.sales} onChange={(e) => setFilters({ ...filters, sales: e.target.value })}>
						<option value="">全部</option>
						{salesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
					</select>
					<button onClick={handleFetchAllCustomers}>查詢</button>
					<button onClick={() => exportCsv(allCustomers, '全客戶資料.csv')}>CSV</button>
					<button onClick={() => exportSheet(allCustomers, '全客戶資料')}>XLSX</button>
				</div>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>姓名</th><th style={thTdStyle}>電話</th><th style={thTdStyle}>Email</th><th style={thTdStyle}>課程</th><th style={thTdStyle}>來源</th><th style={thTdStyle}>加入日期</th><th style={thTdStyle}>負責銷售</th>
						</tr>
					</thead>
					<tbody>
						{loading ? renderEmpty('載入中...') : (allCustomers.length ? allCustomers.map((row, idx) => (
							<tr key={idx}>
								<td style={thTdStyle}>{row.name}</td>
								<td style={thTdStyle}>{row.mobile}</td>
								<td style={thTdStyle}>{row.email}</td>
								<td style={thTdStyle}>{row.courses}</td>
								<td style={thTdStyle}>{row.source}</td>
								<td style={thTdStyle}>{row.create_time ? new Date(row.create_time).toLocaleDateString() : ''}</td>
								<td style={thTdStyle}>{row.sales_name || ''}</td>
							</tr>
						)) : renderEmpty())}
					</tbody>
				</table>
			</section>

			{/* ② 課程分組 */}
			<section>
				<h2>② 課程分組 / 費用管理 / 課程客戶名單</h2>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					<label>課程分類:</label>
					<select style={commonSelectStyle} value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)}>
						<option value="">全部</option>
						{categories.map((c) => <option key={c} value={c}>{c}</option>)}
					</select>
					<button onClick={() => { handleCourseCustomers(); handleUnpaid(); handleFetchCosts(); }}>載入資料</button>
					<button onClick={() => exportSheet(courseCustomers, '課程客戶名單')}>匯出課程客戶</button>
				</div>

				<h3>講座及課堂資訊總表</h3>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>活動名稱</th><th style={thTdStyle}>日期</th><th style={thTdStyle}>時間</th><th style={thTdStyle}>地點</th><th style={thTdStyle}>票價</th><th style={thTdStyle}>操作</th>
						</tr>
					</thead>
					<tbody>
						{filteredEvents.length ? filteredEvents.map((e) => (
							<tr key={e.event_id}>
								<td style={thTdStyle}>{e.event_name}</td>
								<td style={thTdStyle}>{e.datetime_start ? new Date(e.datetime_start).toLocaleDateString() : ''}</td>
								<td style={thTdStyle}>{e.datetime_start ? new Date(e.datetime_start).toLocaleTimeString() : ''}</td>
								<td style={thTdStyle}>{e.location || 'N/A'}</td>
								<td style={thTdStyle}>{e.price != null ? `HK$${e.price}` : '免費'}</td>
								<td style={thTdStyle}>
									<button onClick={() => {
										const d = new Date(e.datetime_start || new Date());
										setNewCost({
											category: 'RENTAL',
											course_category: e.category || e.type || courseCategory,
											year: d.getFullYear(),
											month: d.getMonth() + 1,
											amount: '',
											description: `場地租金: ${e.event_name}`,
											receipt: null
										});
										alert('已填入下方新增費用表單，請輸入金額後儲存');
									}}>登記租場費</button>
								</td>
							</tr>
						)) : renderEmpty('尚無活動資料')}
					</tbody>
				</table>

				<h3>費用列表</h3>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					<label>年份</label><input style={{ width: 90 }} value={costFilters.year} onChange={(e) => setCostFilters({ ...costFilters, year: e.target.value })} placeholder="2026" />
					<label>月份</label><input style={{ width: 60 }} value={costFilters.month} onChange={(e) => setCostFilters({ ...costFilters, month: e.target.value })} placeholder="1-12" />
					<button onClick={handleFetchCosts}>查詢成本</button>
				</div>
				<table style={tableStyle}>
					<thead>
						<tr><th style={thTdStyle}>類別</th><th style={thTdStyle}>課程</th><th style={thTdStyle}>年月</th><th style={thTdStyle}>金額</th><th style={thTdStyle}>說明</th><th style={thTdStyle}>單據</th><th style={thTdStyle}>操作</th></tr>
					</thead>
					<tbody>
						{costs.length ? costs.map((c) => (
							<tr key={c.cost_id}>
								<td style={thTdStyle}>{c.category}</td>
								<td style={thTdStyle}>{c.course_category || '-'}</td>
								<td style={thTdStyle}>{c.cost_year}-{String(c.cost_month).padStart(2, '0')}</td>
								<td style={thTdStyle}>HK${c.amount}</td>
								<td style={thTdStyle}>{c.description}</td>
								<td style={thTdStyle}>{c.receipt_url ? <a href={c.receipt_url} target="_blank" rel="noreferrer">查看</a> : '-'}</td>
								<td style={thTdStyle}><button onClick={() => handleDeleteCost(c.cost_id)}>刪除</button></td>
							</tr>
						)) : renderEmpty()}
					</tbody>
					{costSummary && (
						<tfoot>
							<tr>
								<td style={thTdStyle}>合計</td>
								<td style={thTdStyle} colSpan={2}></td>
								<td style={thTdStyle}>HK${costSummary.total}</td>
								<td style={thTdStyle} colSpan={3}>
									{Object.entries(costSummary.byCategory || {}).map(([k, v]) => `${k}: HK$${v}`).join(' / ') || '—'}
								</td>
							</tr>
						</tfoot>
					)}
				</table>

				<div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
					<strong>新增費用</strong>
					<select value={newCost.category} onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}>
						<option value="RENTAL">RENTAL 租場費</option>
						<option value="DIRECT">DIRECT 直接支出</option>
						<option value="MISC">MISC 雜費</option>
						<option value="CALENDAR">CALENDAR 日曆成本</option>
						<option value="COMMISSION">COMMISSION 佣金</option>
						<option value="REFERRAL">REFERRAL 介紹費</option>
					</select>
					<select
						style={{ ...commonSelectStyle, maxWidth: 300 }}
						value={newCost.event_id || ''}
						onChange={(e) => {
							const eid = e.target.value;
							const evt = events.find(ev => String(ev.event_id) === String(eid));
							if (evt) {
								setNewCost({
									...newCost,
									event_id: eid,
									course_category: evt.category || evt.type || '',
								});
							} else {
								setNewCost({ ...newCost, event_id: '', course_category: '' });
							}
						}}
					>
						<option value="">-- 選擇關聯講座/活動 --</option>
						{events.map((ev) => (
							<option key={ev.event_id} value={ev.event_id}>
								{ev.event_name} ({ev.datetime_start ? new Date(ev.datetime_start).toLocaleDateString() : 'N/A'})
							</option>
						))}
					</select>
					<input placeholder="年份" style={{ width: 80 }} value={newCost.year} onChange={(e) => setNewCost({ ...newCost, year: e.target.value })} />
					<input placeholder="月份" style={{ width: 60 }} value={newCost.month} onChange={(e) => setNewCost({ ...newCost, month: e.target.value })} />
					<input placeholder="金額" style={{ width: 80 }} value={newCost.amount} onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })} />
					<input placeholder="說明" value={newCost.description} onChange={(e) => setNewCost({ ...newCost, description: e.target.value })} />
					<input type="file" onChange={(e) => setNewCost({ ...newCost, receipt: e.target.files[0] })} />
					<button onClick={handleCreateCost}>新增</button>
				</div>


				<h3>課程的客戶資料名單</h3>
				<table style={tableStyle}>
					<thead>
						<tr><th style={thTdStyle}>付款日</th><th style={thTdStyle}>尾款日</th><th style={thTdStyle}>姓名</th><th style={thTdStyle}>付款金額</th><th style={thTdStyle}>付款手段</th><th style={thTdStyle}>電話</th><th style={thTdStyle}>找數月</th><th style={thTdStyle}>介紹人</th><th style={thTdStyle}>負責銷售</th><th style={thTdStyle}>收據</th><th style={thTdStyle}>證書</th></tr>
					</thead>
					<tbody>
						{courseCustomers.length ? courseCustomers.map((c, idx) => (
							<tr key={idx}>
								<td style={thTdStyle}>{c.payment_date || ''}</td>
								<td style={thTdStyle}>{c.balance_date || ''}</td>
								<td style={thTdStyle}>{c.name}</td>
								<td style={thTdStyle}>{c.payment_amount}</td>
								<td style={thTdStyle}>{c.payment_method}</td>
								<td style={thTdStyle}>{c.mobile}</td>
								<td style={thTdStyle}>{c.settlement_month}</td>
								<td style={thTdStyle}>{c.referrer_name}</td>
								<td style={thTdStyle}>{c.sales_name}</td>
								<td style={thTdStyle}>{c.issued_receipt ? '是' : '否'}</td>
								<td style={thTdStyle}>{c.issued_certificate ? '是' : '否'}</td>
							</tr>
						)) : renderEmpty()}
					</tbody>
				</table>
			</section>

			{/* ③ 未付款客人名單 */}
			<section>
				<h2>③ 未付款客人名單</h2>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
					<label>課程分類:</label>
					<select style={commonSelectStyle} value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)}>
						<option value="">全部</option>
						{categories.map((c) => <option key={c} value={c}>{c}</option>)}
					</select>
					<button onClick={handleUnpaid}>查詢</button>
					<button onClick={() => exportSheet(unpaidAttended, '出席過講座名單')}>匯出出席</button>
					<button onClick={() => exportSheet(unpaidNotAttended, '未出席講座名單')}>匯出未出席</button>
				</div>

				<h3>出席過講座名單</h3>
				<table style={tableStyle}>
					<thead><tr><th style={thTdStyle}>分類</th><th style={thTdStyle}>課程</th><th style={thTdStyle}>姓名</th><th style={thTdStyle}>電話</th><th style={thTdStyle}>Email</th><th style={thTdStyle}>出席日期清單</th></tr></thead>
					<tbody>
						{unpaidAttended.length ? unpaidAttended.map((u, idx) => (
							<tr key={idx}>
								<td style={thTdStyle}>{u.category}</td>
								<td style={thTdStyle}>{u.event_name}</td>
								<td style={thTdStyle}>{u.name}</td>
								<td style={thTdStyle}>{u.mobile}</td>
								<td style={thTdStyle}>{u.email}</td>
								<td style={thTdStyle}>{(u.attend_dates || []).map((d) => new Date(d).toLocaleDateString()).join('、')}</td>
							</tr>
						)) : renderEmpty()}
					</tbody>
				</table>

				<h3>未出席講座名單</h3>
				<table style={tableStyle}>
					<thead><tr><th style={thTdStyle}>分類</th><th style={thTdStyle}>課程</th><th style={thTdStyle}>姓名</th><th style={thTdStyle}>電話</th><th style={thTdStyle}>Email</th></tr></thead>
					<tbody>
						{unpaidNotAttended.length ? unpaidNotAttended.map((u, idx) => (
							<tr key={idx}>
								<td style={thTdStyle}>{u.category}</td>
								<td style={thTdStyle}>{u.event_name}</td>
								<td style={thTdStyle}>{u.name}</td>
								<td style={thTdStyle}>{u.mobile}</td>
								<td style={thTdStyle}>{u.email}</td>
							</tr>
						)) : renderEmpty()}
					</tbody>
				</table>
			</section>

			{/* ④ 財務報表 */}
			<section>
				<h2>④ 財務報表</h2>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
					<label>課程分類:</label>
					<select style={commonSelectStyle} value={financialCourse} onChange={(e) => setFinancialCourse(e.target.value)}>
						<option value="">全部</option>
						{categories.map((c) => <option key={c} value={c}>{c}</option>)}
					</select>
					<label>月份:</label>
					<input type="month" value={financialMonth} onChange={(e) => setFinancialMonth(e.target.value)} />
					<button onClick={handleFinancial}>查詢</button>
				</div>
				<p>找數月口徑：以實際上課月份為準；學生至少出席一堂，該月即為其找數月 (由上課日起全數入帳)。若無出席紀錄，則優先參照付款期限 (Expire Date) 或付款日。</p>
				{financialData ? (() => {
					const { headcount, totalSales, paymentFees, costs } = financialData;
					const expenses = {
						referral: costs?.['REFERRAL'] || 0,
						rental: costs?.['RENTAL'] || 0,
						commission: costs?.['COMMISSION'] || 0,
						calendar: costs?.['CALENDAR'] || 0,
						misc: costs?.['MISC'] || 0,
						direct: costs?.['DIRECT'] || 0,
						promotion: costs?.['PROMOTION'] || 0,
						salary: costs?.['SALARY'] || 0,
						freight: costs?.['FREIGHT'] || 0,
						utilities: costs?.['UTILITIES'] || 0,
						telecom: costs?.['TELECOM'] || 0,
						cog: costs?.['COG'] || 0,
					};

					// --- Income Statement Logic ---
					const operatingRevenue = totalSales || 0;
					const operatingCosts = expenses.cog || 0;
					const grossProfit = operatingRevenue - operatingCosts;

					const operatingExpensesList = [
						{ name: '薪資支出 (Salary)', value: expenses.salary },
						{ name: '租金支出 (Rental)', value: expenses.rental },
						{ name: '運費 (Freight)', value: expenses.freight },
						{ name: '郵電費 (Telecom)', value: expenses.telecom },
						{ name: '廣告費 (Promotion)', value: expenses.promotion },
						{ name: '水電瓦斯費 (Utilities)', value: expenses.utilities },
						{ name: '介紹費 (Referral)', value: expenses.referral },
						{ name: '銷售佣金 (Commission)', value: expenses.commission },
						{ name: '日曆成本 (Calendar)', value: expenses.calendar },
						{ name: '雜費 (Misc)', value: expenses.misc },
						{ name: '直接支出 (Direct)', value: expenses.direct },
					];
					const totalOperatingExpenses = operatingExpensesList.reduce((acc, curr) => acc + curr.value, 0);

					const operatingIncome = grossProfit - totalOperatingExpenses;
					const nonOperatingExpenses = paymentFees || 0; // Treated as expense
					const netIncome = operatingIncome - nonOperatingExpenses;

					const renderRow = (label, value, isBold = false, indent = 0, isNegative = false) => {
						const displayValue = isNegative 
							? `(${Math.abs(value).toLocaleString()})` 
							: value.toLocaleString();
						const percentage = operatingRevenue > 0 
							? ((value / operatingRevenue) * 100).toFixed(2) + '%' 
							: '-';
						return (
							<tr key={label} style={{ fontWeight: isBold ? 'bold' : 'normal', backgroundColor: isBold ? '#f9f9f9' : 'transparent' }}>
								<td style={{ ...thTdStyle, paddingLeft: 8 + indent * 20 }}>{label}</td>
								<td style={{ ...thTdStyle, textAlign: 'right' }}>HK$ {displayValue}</td>
								<td style={{ ...thTdStyle, textAlign: 'right' }}>{percentage}</td>
							</tr>
						);
					};

					return (
						<table style={tableStyle}>
							<thead><tr><th style={thTdStyle}>項目</th><th style={thTdStyle}>金額</th><th style={{...thTdStyle, textAlign: 'right'}}>百分比%</th></tr></thead>
							<tbody>
								{/* 營業收入 */}
								{renderRow('營業收入', operatingRevenue, true)}
								{renderRow('營業收入合計', operatingRevenue, true, 2)}

								{/* 營業成本 */}
								{renderRow('營業成本', operatingCosts, true)}
								{renderRow('銷貨成本', expenses.cog, false, 1)}
								{renderRow('營業成本合計', operatingCosts, true, 2)}

								{/* 營業毛利 */}
								{renderRow('營業毛利', grossProfit, true)}

								{/* 營業費用 */}
								{renderRow('營業費用', totalOperatingExpenses, true)}
								{operatingExpensesList.map(item => renderRow(item.name, item.value, false, 1))}
								{renderRow('營業費用合計', totalOperatingExpenses, true, 2)}

								{/* 營業淨利 */}
								{renderRow('營業淨利', operatingIncome, true)}

								{/* 營業外 */}
								{renderRow('營業外收益及費損', -nonOperatingExpenses, true)}
								{renderRow('手續費 (Fees)', -nonOperatingExpenses, false, 1)}
								{renderRow('營業外收益及費損合計', -nonOperatingExpenses, true, 2)}
								
								{/* 本期淨利 */}
								{renderRow('本期淨利', netIncome, true)}
							</tbody>
						</table>
					);
				})() : <p>請選擇課程與月份後查詢</p>}
			</section>
		</PageContainer>
	);
};

export default Reports;
