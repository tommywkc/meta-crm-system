import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "../contexts/AuthContext";
import { handleListBanners, handleCreateBanner, handleDeleteBanner } from "../api/bannersAPI";

const BannerSection = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal state for uploading
    const [showModal, setShowModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        try {
            const res = await handleListBanners();
            if (res.success) {
                setBanners(res.banners);
            }
        } catch (error) {
            console.error("Failed to load banners", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) return alert("請選擇圖片");
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('caption', ''); // No caption
            
            const res = await handleCreateBanner(formData);
            if (!res.success) {
                throw new Error(res.error || "Upload returned failure");
            }
            alert("上傳成功！");
            setShowModal(false);
            setUploadFile(null);
            loadBanners();
        } catch (error) {
            console.error("Upload failed", error);
            alert("上傳失敗，請稍後再試。");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, blobName) => {
        if (!window.confirm("確定要刪除這張 Banner 嗎？")) return;
        try {
            const res = await handleDeleteBanner(id, blobName);
            if (!res.success) throw new Error(res.error || "Delete failed");
            loadBanners();
        } catch (error) {
            console.error("Delete failed", error);
            alert("刪除失敗");
        }
    };

    // Slider settings
    const settings = {
        dots: false,
        infinite: banners.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000
    };

    return (
        <div className="banner-section-wrapper" style={{ width: '100%', position: 'relative' }}>
            <style>{`
                .banner-section-wrapper .slick-prev:before,
                .banner-section-wrapper .slick-next:before {
                    color: white !important;
                    opacity: 1;
                    font-size: 30px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                }
                .banner-section-wrapper .slick-prev,
                .banner-section-wrapper .slick-next {
                    z-index: 2;
                    width: auto;
                    height: auto;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .banner-section-wrapper .slick-prev:hover,
                .banner-section-wrapper .slick-next:hover,
                .banner-section-wrapper .slick-prev:focus,
                .banner-section-wrapper .slick-next:focus {
                    background: transparent !important;
                    box-shadow: none !important;
                }
                .banner-section-wrapper .slick-prev { left: 20px !important; }
                .banner-section-wrapper .slick-next { right: 20px !important; }
            `}</style>

            {loading && <p>Banner 載入中...</p>}

            {!loading && banners.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p>暫無 Banner</p>
                    {isAdmin && (
                        <button onClick={() => setShowModal(true)}>+ 上傳新 Banner</button>
                    )}
                </div>
            )}

            {/* Banner Slider */}
            {!loading && banners.length > 0 && (
                <Slider {...settings}>
                    {banners.map(banner => (
                        <div key={banner.id || banner.blobName} style={{ outline: 'none' }}>
                            <div style={{ 
                                width: '100%', 
                                height: '130px', 
                                overflow: 'hidden', 
                                borderRadius: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <img 
                                    src={banner.url} 
                                    alt={banner.caption || 'Banner'} 
                                    style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                                />
                                {isAdmin && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        zIndex: 10,
                                        display: 'flex',
                                        gap: '10px'
                                    }}>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent drag/click of slider
                                                setShowModal(true);
                                            }}
                                        >
                                            + 上傳新 Banner
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent drag/click of slider
                                                handleDelete(banner.id, banner.blobName);
                                            }}
                                            className="btn-danger"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </Slider>
            )}


             {/* Upload Modal */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>上傳新 Banner</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>選擇圖片:</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setUploadFile(e.target.files[0])} 
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    取消
                                </button>
                                <button type="submit" disabled={uploading}>
                                    {uploading ? '上傳中...' : '確認上傳'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple inline styles for modal
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '400px',
    maxWidth: '90%'
};

export default BannerSection;
