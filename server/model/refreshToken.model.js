const pool = require('./db');

const findRefreshToken = async (token) => {
    const [rows] = await pool.execute(
        `
        SELECT user_id
        FROM refresh_tokens
        WHERE token = ?
        `,
        [token]
    );
    return rows;
};

const findValidRefreshToken = async (token) => {
    const [rows] = await pool.execute(
        `
        SELECT user_id
        FROM refresh_tokens
        WHERE token = ?
        AND expires_at > NOW()
        `,
        [token]
    );
    return rows;
};

const saveRefreshToken = async (userId, token, expireAt) => {
    const [result] = await pool.execute(
        `
        INSERT INTO refresh_tokens(user_id, token, expires_at)
        VALUES (?, ?, ?)
        `,
        [userId, token, expireAt]
    );
    return result;
};

const deleteRefreshToken = async (token) => {
    const [result] = await pool.execute(
        `
        DELETE FROM refresh_tokens
        WHERE token = ?
        `,
        [token]
    );
    return result;
};

const deleteUserRefreshToken = async (userId) => {
    const [result] = await pool.execute(
        `
        DELETE FROM refresh_tokens
        WHERE user_id = ?
        `,
        [userId]
    );
    return result;
};

module.exports = {
    findRefreshToken,
    findValidRefreshToken,
    saveRefreshToken,
    deleteRefreshToken,
    deleteUserRefreshToken,
};
