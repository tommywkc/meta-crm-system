import React from 'react';
import WaitingListTable from '../../components/WaitingListTable';

const mockWaiting = [
	{
		id: 'XXX',
		customerId: 1,
		customerName: 'XXX',
		contact: 'XXX',
		requestedClass: 'XXX',
		requestedDate: 'XXX',
		seatsNeeded: 1,
		currentSeats: 'XXX',
		status: 'XXX',
		submittedAt: 'XXX'
	},
	{
		id: 'XXX',
		customerId: null,
		customerName: 'XXX',
		contact: 'XXX',
		requestedClass: 'XXX',
		requestedDate: 'XXX',
		seatsNeeded: 2,
		currentSeats: 'XXX',
		status: 'XXX',
		submittedAt: 'XXX'
	}
];

const Waiting = () => {
	return (
		<div style={{ padding: 20 }}>
			<h1>等待清單 (Admin)</h1>
			<WaitingListTable data={mockWaiting} />
		</div>
	);
};

export default Waiting;
