const pool = require('./db');

const getFieldsByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `
        SELECT id, name, ST_AsGeoJSON(geometry) AS geometry,ST_Area(geometry) AS area_m2 , address
        FROM fields
        WHERE user_id = ?
        `,
        [userId]
    );
    return rows;
};

const createField = async (userId, name, geometry, address) => {
    const [result] = await pool.execute(
        `
        INSERT INTO fields(user_id, name, geometry, address)
        VALUES (?, ?, ST_GeomFromGeoJSON(?), ?)
        `,
        [userId, name, JSON.stringify(geometry), address]
    );
    return result;
};

const deleteField = async (fieldId) => {
    const [result] = await pool.execute(
        `
        DELETE FROM fields
        WHERE id = ?
        `,
        [fieldId]
    );
    return result;
};

const updateField = async (fieldId, name, geometry, address) => {
    const [result] = await pool.execute(
        `
        UPDATE fields
        SET name = ?,
            geometry = ST_GeomFromGeoJSON(?),
            address = ?
        WHERE id = ?
        `,
        [name, JSON.stringify(geometry), address, fieldId]
    );
    return result;
};

module.exports = {
    getFieldsByUserId,
    createField,
    deleteField,
    updateField
};
