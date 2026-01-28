import React, { useEffect, useMemo, useState } from 'react';
import RequestForm from '../../components/RequestForm';
import { useAuth } from '../../contexts/AuthContext';

const requestOptions = [
	'覆課申請',
	'補堂申請',
	'改期申請',
	'請假申請',
	'取消申請'
];

const RequestSelection = () => {
	const { user } = useAuth();
	const isMember = user?.role?.toLowerCase() === 'member';
	const availableOptions = useMemo(() => {
		if (isMember) {
			return requestOptions.filter((opt) => opt !== '改期申請' && opt !== '取消申請');
		}
		return requestOptions;
	}, [isMember]);
	const [selected, setSelected] = useState('');

	const handleSelect = (type) => {
		setSelected(type);
	};

	useEffect(() => {
		if (selected && !availableOptions.includes(selected)) {
			setSelected('');
		}
	}, [availableOptions, selected]);

	return (
		<div style={{ padding: 20 }}>
			<h1>選擇申請類型</h1>
			<p style={{ marginBottom: 12 }}>請選擇申請種類。</p>

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
				<RequestForm key={selected} requestType={selected} />
			)}
		</div>
	);
};

export default RequestSelection;
