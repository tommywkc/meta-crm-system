import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestForm from '../../components/RequestForm';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const requestOptions = [
	'覆課申請',
	'補堂申請',
	'改期申請',
	'請假申請',
	'取消申請'
];

const RequestSelection = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const normalizedRole = (user?.role || '').toLowerCase();
	const isMember = normalizedRole === 'member';
	const canViewRequests = ['member', 'sales', 'leader'].includes(normalizedRole);
	const availableOptions = useMemo(() => {
		if (isMember) {
			return requestOptions.filter((opt) => opt !== '改期申請');
		}
		return requestOptions;
	}, [isMember]);
	const [selected, setSelected] = useState('');

	const handleSelect = (type) => {
		setSelected(type);
	};

	const handleSubmitted = (request) => {
		if (request?.request_id) {
			navigate(`/requests/${request.request_id}`, { state: { request } });
		}
	};

	useEffect(() => {
		if (selected && !availableOptions.includes(selected)) {
			setSelected('');
		}
	}, [availableOptions, selected]);

	return (
		<PageContainer>
			<PageHeader 
				title="選擇申請類型"
				extra={
					<button onClick={() => navigate('/requests/history')} style={{ minWidth: 140 }}>
						查看申請紀錄
					</button>
				}
			/>
			<p style={{ marginBottom: 20 }}>請選擇申請種類。</p>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
				{availableOptions.map((opt) => (
					<button
						key={opt}
						onClick={() => handleSelect(opt)}
						style={{
							padding: '10px 12px',
							textAlign: 'center',
							border: selected === opt ? '2px solid #2563eb' : '1px solid #d1d5db',
							background: selected === opt ? '#eff6ff' : '#fff',
							borderRadius: 8,
							cursor: 'pointer'
						}}
					>
						{opt}
					</button>
				))}
			</div>

			{selected && (
				<RequestForm key={selected} requestType={selected} onSubmitted={handleSubmitted} />
			)}
		</PageContainer>
	);
};

export default RequestSelection;
