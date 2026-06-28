const pool = require ('./db');

const findUserByEmail = async (email) => {
    const [row] = await pool.execute(
        `
        SELECT id, name, password, role
        FROM users
        WHERE email = ?
        `,
        [email]
    );
    return row;
};

const findUserById = async (id) => {
    const [rows] = await pool.execute(
        `
        SELECT id, role, name, email
        FROM users
        WHERE id = ?
        `,
        [id]
    );
    return rows;
};

const createUser = async (email, name, password, role) => {
    const [result] = await pool.execute(
        `
        INSERT INTO users(email, name, password, role)
        VALUES(?, ?, ?, ?)
        `,
        [email, name, password, role]
    );
    return result;
};

const updateUser = async (id, data) => {

    const [result] = await pool.execute(
        `
        UPDATE users
        SET name = ?, email = ?, phone = ?
        WHERE id = ?
        `,
        [data.name, data.email, data.phone, id]
    );

    return result;
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    updateUser
};
