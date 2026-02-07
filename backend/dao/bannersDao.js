const db = require('../db/pool');

const createBanner = async (imageUrl, caption, createdBy) => {
    const query = `
        INSERT INTO BANNERS (image_url, caption, created_by)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [imageUrl, caption, createdBy];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getAllBanners = async () => {
    const query = `
        SELECT b.*, u.name as created_by_name
        FROM BANNERS b
        LEFT JOIN USERS u ON b.created_by = u.user_id
        ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
};

const deleteBanner = async (bannerId) => {
    const query = `DELETE FROM BANNERS WHERE banner_id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [bannerId]);
    return rows[0];
};

const updateBannerCaption = async (bannerId, caption) => {
    const query = `
        UPDATE BANNERS 
        SET caption = $2 
        WHERE banner_id = $1 
        RETURNING *;
    `;
    const { rows } = await db.query(query, [bannerId, caption]);
    return rows[0];
};

const getBannerByUrl = async (imageUrl) => {
    const query = `SELECT * FROM BANNERS WHERE image_url = $1;`;
    const { rows } = await db.query(query, [imageUrl]);
    return rows[0];
};

module.exports = {
    createBanner,
    getAllBanners,
    deleteBanner,
    updateBannerCaption,
    getBannerByUrl
};
