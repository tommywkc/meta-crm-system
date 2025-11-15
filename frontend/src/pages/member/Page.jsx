import React, { useState } from 'react';
import Calendar from '../../components/Calendar';
import { tableStyle, thTdStyle } from '../../styles/TableStyles';

function formatKey(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

const MemberPage = () => {
	const today = new Date();
	const todayKey = formatKey(today);
	const [uploadedWorks, setUploadedWorks] = useState([
		{ id: 1, name: 'XXX', title: 'XXX', type: 'XXX', tags: 'XXX', status: '審核中' },
		{ id: 2, name: 'XXX', title: 'XXX', type: 'XXX', tags: 'XXX', status: '已公開' },
	]);

	// Mock free seminars for this month
	const freeSeminars = [
		{ id: 1, date: 'XXX', topic: 'XXX', speaker: 'XXX', quota: 5 },
		{ id: 2, date: 'XXX', topic: 'XXX', speaker: 'XXX', quota: 12 },
	];

	// Mock schedule for next 7-14 days
	const mySchedule = [
		{ id: 1, date: 'XXX', type: '上課', course: 'XXX', status: '已出席' },
		{ id: 2, date: 'XXX', type: '補課', course: 'XXX', status: '已出席' },
		{ id: 3, date: 'XXX', type: '請假', course: 'XXX', status: '已批准' },
	];

	// Mock recommended courses
	const recommendedCourses = [
		{ id: 1, name: 'XXX', level: 'XXX', duration: 'XXX', price: 'XXX$' },
		{ id: 2, name: 'XXX', level: 'XXX', duration: 'XXX', price: 'XXX$' },
		{ id: 3, name: 'XXX', level: 'XXX', duration: 'XXX', price: 'XXX$' },
	];

	// Mock services
	const myServices = [
		{ id: 1, name: 'ChatGPT 訂閱', status: '啟用', expiryDate: 'XXX' },
		{ id: 2, name: '小紅書服務', status: '待開始', expiryDate: 'XXX' },
		{ id: 3, name: '付費工作坊', status: '過期', expiryDate: 'XXX' },
	];

	// Mock homework assignments
	const homeworkAssignments = [
		{ id: 1, subject: 'XXX', dueDate: 'XXX', format: 'XXX', status: '已交' },
		{ id: 2, subject: 'XXX', dueDate: 'XXX', format: 'XXX', status: '待批改' },
		{ id: 3, subject: 'XXX', dueDate: 'XXX', format: 'XXX', status: '已評語' },
	];

	// Mock student artworks
	const studentArtworks = [
		{ id: 1, author: 'XXX', title: 'XXX', type: 'XXX', tags: 'XXX', likes: 10 },
		{ id: 2, author: 'XXX', title: 'XXX', type: 'XXX', tags: 'XXX', likes: 25 },
		{ id: 3, author: 'XXX', title: 'XXX', type: 'XXX', tags: 'XXX', likes: 8 },
	];

	const handleRegisterSeminar = (seminarId) => {
		alert(`已報名講座 ${seminarId}`);
	};

	const handleUploadWork = () => {
		alert('打開上載作品介面');
	};

	const handleSubmitHomework = (homeworkId) => {
		alert(`提交作業 ${homeworkId}`);
	};

	const handleEnrollCourse = (courseId) => {
		alert(`已報名課程 ${courseId}`);
	};

	// Generate mock events for the calendar
	const events = {
		[todayKey]: ['課堂: XXXXX', '課堂: XXXXXX'],
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>會員主頁(Member)</h1>

			{/* Free Seminars Banner */}
			<section>
				<h2>本月免費講座</h2>
				<div>
					{freeSeminars.map((seminar) => (
						<div key={seminar.id}>
							<div><strong>日期：</strong>{seminar.date}</div>
							<div><strong>主題：</strong>{seminar.topic}</div>
							<div><strong>講者：</strong>{seminar.speaker}</div>
							<div><strong>名額餘額：</strong>{seminar.quota}</div>
							<button onClick={() => handleRegisterSeminar(seminar.id)}>一鍵報名</button>
						</div>
					))}
				</div>
			</section>

			{/* My Schedule */}
			<section>
				<h2>我的行程卡（最近 7–14 天）</h2>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>日期</th>
							<th style={thTdStyle}>類型</th>
							<th style={thTdStyle}>課程名稱</th>
							<th style={thTdStyle}>狀態</th>
						</tr>
					</thead>
					<tbody>
						{mySchedule.map((item) => (
							<tr key={item.id} style={tableStyle}>
								<td style={thTdStyle}>{item.date}</td>
								<td style={thTdStyle}>{item.type}</td>
								<td style={thTdStyle}>{item.course}</td>
								<td style={thTdStyle}>{item.status}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			{/* Recommended Courses */}
			<section>
				<h2>為你推薦課程</h2>
				<div>
					{recommendedCourses.map((course) => (
						<div key={course.id}>
							<h3>{course.name}</h3>
							<div><strong>等級：</strong>{course.level}</div>
							<div><strong>時長：</strong>{course.duration}</div>
							<div><strong>價格：</strong>{course.price}</div>
							<button onClick={() => handleEnrollCourse(course.id)}>報名</button>
						</div>
					))}
				</div>
			</section>

			{/* My Services */}
			<section>
				<h2>我的服務</h2>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>服務名稱</th>
							<th style={thTdStyle}>狀態</th>
							<th style={thTdStyle}>到期日期</th>
						</tr>
					</thead>
					<tbody>
						{myServices.map((service) => (
							<tr key={service.id} style={tableStyle}>
								<td style={thTdStyle}>{service.name}</td>
								<td style={thTdStyle}>{service.status}</td>
								<td style={thTdStyle}>{service.expiryDate}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			{/* Student Artworks Gallery */}
			<section>
				<h2>學生作品牆</h2>
				<button onClick={handleUploadWork}>上載作品</button>
				<div>
					{studentArtworks.map((artwork) => (
						<div key={artwork.id}>
							<div><strong>{artwork.author}</strong></div>
							<div>{artwork.title}</div>
							<div>類型: {artwork.type} | 標籤: {artwork.tags}</div>
							<div>讚數 {artwork.likes}</div>
						</div>
					))}
				</div>
			</section>

			{/* Homework Submissions */}
			<section>
				<h2>交功課入口</h2>
				<table style={tableStyle}>
					<thead>
						<tr>
							<th style={thTdStyle}>功課主題</th>
							<th style={thTdStyle}>截止日期</th>
							<th style={thTdStyle}>格式</th>
							<th style={thTdStyle}>狀態</th>
							<th style={thTdStyle}>動作</th>
						</tr>
					</thead>
					<tbody>
						{homeworkAssignments.map((hw) => (
							<tr key={hw.id} style={tableStyle}>
								<td style={thTdStyle}>{hw.subject}</td>
								<td style={thTdStyle}>{hw.dueDate}</td>
								<td style={thTdStyle}>{hw.format}</td>
								<td style={thTdStyle}>{hw.status}</td>
								<td style={thTdStyle}>
									{hw.status === '已交' ? (
										<span>已提交</span>
									) : (
										<button onClick={() => handleSubmitHomework(hw.id)}>提交</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	);
};

export default MemberPage;
