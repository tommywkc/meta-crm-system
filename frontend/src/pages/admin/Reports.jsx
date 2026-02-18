import React, { useState } from 'react';
import AllCustomerReport from '../../components/report/AllCustomerReport';
import CourseInfoSummary from '../../components/report/CourseInfoSummary';
import MonthlyPromotionReport from '../../components/report/MonthlyPromotionReport';
import { PageContainer, PageHeader } from '../../components/CommonPage';

const Reports = () => {
    // view state: 'menu' | 'allCustomers' | 'courseGroupMenu' | 'courseInfoSummary' | 'monthlyPromotionReport'
    const [view, setView] = useState('menu');

    const cardStyle = {
        padding: '40px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        textAlign: 'center',
        fontSize: '1.4rem',
        fontWeight: '600',
        color: '#333',
        border: '1px solid #e0e0e0',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px'
    };

    const hoverHandlers = {
        onMouseEnter: (e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        }
    };

    return (
        <PageContainer>
            <PageHeader title="報表中心 (Report Center)" />
            
            {view === 'menu' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', padding: '30px' }}>
                    
                    {/* All Customer Data List Button */}
                    <div 
                        onClick={() => setView('allCustomers')}
                        style={cardStyle}
                        {...hoverHandlers}
                    >
                        <span style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</span>
                        全客戶資料名單
                    </div>

                    <div
                        onClick={() => setView('courseGroupMenu')}
                        style={cardStyle}
                        {...hoverHandlers}
                    >
                        <span style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</span>
                        課程分組
                    </div>

                    {/* Placeholder for future specific data buttons linked via event_id */}
                    {/* 
                    <div style={{...placeholderStyle}}>
                        其他報表...
                    </div> 
                    */}
                </div>
            )}

            {view === 'allCustomers' && (
                <AllCustomerReport onBack={() => setView('menu')} />
            )}

            {view === 'courseGroupMenu' && (
                <div style={{ padding: '20px' }}>
                    <button onClick={() => setView('menu')} style={{ marginBottom: '16px' }}>返回報表中心</button>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                        <div style={cardStyle} {...hoverHandlers} onClick={() => setView('courseInfoSummary')}>
                            <span style={{ fontSize: '2.6rem', marginBottom: '12px' }}>🗂️</span>
                            1. 講座及課堂資訊總表
                            <span style={{ marginTop: '8px', fontSize: '0.95rem', color: '#666' }}>日期 / 時間 / 地點 / 租場費用</span>
                        </div>
                        <div style={{ ...cardStyle }} {...hoverHandlers} onClick={() => setView('monthlyPromotionReport')}>
                            <span style={{ fontSize: '2.6rem', marginBottom: '12px' }}>🧾</span>
                            2. 宣傳費 (Monthly Promotion)
                            <span style={{ marginTop: '8px', fontSize: '0.95rem', color: '#666' }}>按月輸入金額並上載單據，列表＋彙總</span>
                        </div>
                        <div style={{ ...cardStyle, cursor: 'not-allowed', opacity: 0.6 }}>
                            <span style={{ fontSize: '2.6rem', marginBottom: '12px' }}>📊</span>
                            3. (開發中)
                            <span style={{ marginTop: '8px', fontSize: '0.95rem', color: '#666' }}>敬請期待</span>
                        </div>
                    </div>
                </div>
            )}

            {view === 'courseInfoSummary' && (
                <CourseInfoSummary onBack={() => setView('courseGroupMenu')} />
            )}

            {view === 'monthlyPromotionReport' && (
                <MonthlyPromotionReport onBack={() => setView('courseGroupMenu')} />
            )}
        </PageContainer>
    );
};

export default Reports;
