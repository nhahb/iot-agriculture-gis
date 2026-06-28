const pool = require('../model/db');
const authericateJWT = require('../middlewares/middlewares');

exports.userList = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT id, email, name FROM users");
        res.json(rows);
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}