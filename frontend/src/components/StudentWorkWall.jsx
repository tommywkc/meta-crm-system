import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "../contexts/AuthContext";
import { handleListStudentWorks, handleCreateStudentWork, handleDeleteStudentWork, handleUpdateStudentWork } from "../api/studentWorksAPI";

// Custom Arrow Components for styling similar to the example image (grey arrow icons)
const NextArrow = ({ className, style, onClick }) => {
  return (
    <div
      className={className}
      style={{ ...style, display: "block", right: "-25px", zIndex: 1 }}
      onClick={onClick}
    />
  );
};

const PrevArrow = ({ className, style, onClick }) => {
  return (
    <div
      className={className}
      style={{ ...style, display: "block", left: "-25px", zIndex: 1 }}
      onClick={onClick}
    />
  );
};

const StudentWorkWall = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal state for uploading
    const [showModal, setShowModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCaption, setUploadCaption] = useState("");
    const [uploading, setUploading] = useState(false);

    // Edit Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editWorkId, setEditWorkId] = useState(null);
    const [editCaption, setEditCaption] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");

    useEffect(() => {
        loadWorks();
    }, []);

    const loadWorks = async () => {
        setLoading(true);
        try {
            const res = await handleListStudentWorks();
            if (res.success) {
                setWorks(res.works);
            }
        } catch (error) {
            console.error("Failed to load student works", error);
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
            formData.append('caption', uploadCaption);
            
            await handleCreateStudentWork(formData);
            alert("上傳成功！");
            setShowModal(false);
            setUploadFile(null);
            setUploadCaption("");
            loadWorks();
        } catch (error) {
            console.error("Upload failed", error);
            alert("上傳失敗，請稍後再試。");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("確定要刪除這張作品嗎？")) return;
        try {
            await handleDeleteStudentWork(id);
            loadWorks();
        } catch (error) {
            console.error("Delete failed", error);
            alert("刪除失敗");
        }
    };

    const openEditModal = (work) => {
         setEditWorkId(work.work_id);
         setEditCaption(work.caption || "");
         setEditImageUrl(work.image_url); // Store URL to help backend identify non-DB blobs
         setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await handleUpdateStudentWork(editWorkId, editCaption, editImageUrl);
            alert("更新成功！");
            setShowEditModal(false);
            loadWorks();
        } catch (error) {
            console.error("Update failed", error);
            alert("更新失敗");
        }
    };

    // Slick settings
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    const wallStyle = {
        textAlign: 'left', 
        padding: '20px 0', 
        margin: '20px 0'
    };

    const cardStyle = {
        padding: '0 10px',
        boxSizing: 'border-box',
        position: 'relative' // relative for absolute positioning of admin delete button
    };

    const imageStyle = {
        width: '100%',
        // height: '200px',
        aspectRatio: '16/9', // 16:9 ratio (1920x1080)
        objectFit: 'cover',
        borderRadius: '4px',
        display: 'block'
    };

    const captionStyle = {
        marginTop: '10px',
        fontSize: '14px',
        color: '#333',
        textAlign: 'left',
        minHeight: '40px'
    };

    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    };

    const modalContentStyle = {
        backgroundColor: '#fff', padding: 20, borderRadius: 8, 
        width: 400, maxWidth: '90%'
    };

    return (
        <section style={wallStyle}>
            <style>{`.slick-prev:before, .slick-next:before { color: black !important; }`}</style>
            <div style={{ width: '100%', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ margin: 0 }}>
                        學生作品牆壁
                    </h2>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => setShowModal(true)}
                        >
                            ＋ 新增作品
                        </button>
                    )}
                </div>

                <div style={{ padding: '0 40px', marginTop: 30 }}>
                    {loading ? <p>載入作品中...</p> : (
                        works.length > 0 ? (
                            <Slider {...settings}>
                                {works.map(work => (
                                    <div key={work.work_id} style={cardStyle}>
                                        <div style={{ margin: '0 10px' }}>
                                            <a href={work.image_url} target="_blank" rel="noopener noreferrer">
                                                <img src={work.image_url} alt={work.caption} style={imageStyle} />
                                            </a>
                                            <div style={captionStyle}>
                                                {work.caption}
                                            </div>
                                            {isAdmin && (
                                                <div style={{ marginTop: 5 }}>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditModal(work);
                                                        }}
                                                        style={{ marginRight: 8 }}
                                                    >
                                                        編輯
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(work.work_id);
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
                        ) : (
                            <p style={{ color: '#999' }}>暫時沒有作品展示</p>
                        )
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>新增學生作品</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>圖片檔案:</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    required 
                                />
                            </div>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>簡介 caption:</label>
                                <textarea 
                                    value={uploadCaption} 
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    style={{ width: '100%', height: 60 }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setShowModal(false)} disabled={uploading} className="btn-secondary">
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

            {/* Edit Modal */}
            {showEditModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>編輯作品資訊</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>簡介 caption:</label>
                                <textarea 
                                    value={editCaption} 
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    style={{ width: '100%', height: 60 }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                                    取消
                                </button>
                                <button type="submit">
                                    儲存更改
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default StudentWorkWall;
