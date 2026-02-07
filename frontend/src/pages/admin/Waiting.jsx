import React from 'react';
import WaitingListTable from '../../components/WaitingListTable';
import { PageContainer, PageHeader } from '../../components/CommonPage';

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
		<PageContainer>
			<PageHeader title="等待清單 (Admin)" />
			<WaitingListTable data={mockWaiting} />
		</PageContainer>
	);
};

export default Waiting;
