const userModel = require('../model/user.model');
const jwt = require('jsonwebtoken');

exports.account = async (req, res) => {
    try {
        const userRows = await userModel.findUserById(req.id);
        console.log('Account data fetched:', userRows);
        res.json({ message: "Account information", user: userRows[0] });
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateAccount = async (req, res) => {
    const userData = req.body;
    try {
        const result = await userModel(req.id, userData);
        res.json({ message: "Account updated successfully" });
    } catch (error) {
        console.error('Error updating account data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

