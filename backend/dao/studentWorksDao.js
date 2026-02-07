const db = require('../db/pool');

const createStudentWork = async (imageUrl, caption, createdBy) => {
    const query = `
        INSERT INTO STUDENT_WORKS (image_url, caption, created_by)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [imageUrl, caption, createdBy];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const getAllStudentWorks = async () => {
    const query = `
        SELECT sw.*, u.name as created_by_name
        FROM STUDENT_WORKS sw
        LEFT JOIN USERS u ON sw.created_by = u.user_id
        ORDER BY sw.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
};

const deleteStudentWork = async (workId) => {
    const query = `DELETE FROM STUDENT_WORKS WHERE work_id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [workId]);
    return rows[0];
};

module.exports = {
    createStudentWork,
    getAllStudentWorks,
    deleteStudentWork
};
