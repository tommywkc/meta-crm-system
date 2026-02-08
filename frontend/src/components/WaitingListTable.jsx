import React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonTable from './CommonTable';

const WaitingListTable = ({ data }) => {
	const navigate = useNavigate();

	const handleApprove = (row) => {
		alert(`模擬：已核准 ${row.id}（${row.customerName}）`);
	};
	const handleNotify = (row) => {
		alert(`模擬：已通知 ${row.contact}（${row.customerName}）`);
	};
	const handleReject = (row) => {
		const ok = window.confirm(`確定要拒絕候補 ${row.id} 嗎？`);
		if (ok) alert(`模擬：已拒絕 ${row.id}`);
	};
	const handleViewCustomer = (row) => {
		if (row.customerId) navigate(`/customers/${row.customerId}`);
		else alert('此候補沒有綁定客戶資料');
	};

	const headers = ['候補編號', '姓名', '連絡電話', '申請課堂', '申請日期', '課堂現在空位', '送出時間', '動作'];

	const [sortConfig, setSortConfig] = useState(null);

	const handleSort = (colIndex) => {
		setSortConfig((prev) => {
			if (!prev || prev.columnIndex !== colIndex) return { columnIndex: colIndex, direction: 'asc' };
			return { columnIndex: colIndex, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
		});
	};

	const sorted = useMemo(() => {
		if (!Array.isArray(data)) return [];
		if (!sortConfig) return data;
		const dir = sortConfig.direction === 'asc' ? 1 : -1;
		const cmp = (a, b) => {
			switch (sortConfig.columnIndex) {
				case 0: {
					const na = Number(a.id ?? 0);
					const nb = Number(b.id ?? 0);
					return (na - nb) * dir;
				}
				case 1: return String(a.customerName ?? '').localeCompare(String(b.customerName ?? '')) * dir;
				case 2: return String(a.contact ?? '').localeCompare(String(b.contact ?? '')) * dir;
				case 3: return String(a.requestedClass ?? '').localeCompare(String(b.requestedClass ?? '')) * dir;
				case 4: {
					const ta = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
					const tb = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
					return (ta - tb) * dir;
				}
				case 5: {
					const na = Number(a.currentSeats ?? 0);
					const nb = Number(b.currentSeats ?? 0);
					return (na - nb) * dir;
				}
				case 6: {
					const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
					const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
					return (ta - tb) * dir;
				}
				default: return 0;
			}
		};
		const copy = [...data];
		copy.sort(cmp);
		return copy;
	}, [data, sortConfig]);

	return (
		<CommonTable headers={headers} data={sorted} emptyMessage="暫無候補資料" onSort={handleSort} sortConfig={sortConfig}>
			{sorted.map((r) => (
				<tr key={r.id}>
					<td>{r.id}</td>
					<td>{r.customerName}</td>
					<td>{r.contact}</td>
					<td>{r.requestedClass}</td>
					<td>{r.requestedDate}</td>
					<td>{r.currentSeats}</td>
					<td>{r.submittedAt}</td>
					<td>
						<button onClick={() => handleApprove(r)} style={{ marginRight: 8 }}>
							核准
						</button>
						<button onClick={() => handleNotify(r)} style={{ marginRight: 8 }}>
							通知
						</button>
						<button onClick={() => handleReject(r)} style={{ marginRight: 8 }}>
							拒絕
						</button>
						<button onClick={() => handleViewCustomer(r)}>查看客戶</button>
					</td>
				</tr>
			))}
		</CommonTable>
	);
};

export default WaitingListTable;
