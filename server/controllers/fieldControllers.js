const fieldModel = require('../model/field.model');
const jwt = require('jsonwebtoken');

exports.fields = async (req, res) => {
    try {
        const result = await fieldModel.getFieldsByUserId(req.id);
        console.log('Fields fetched:', result);
        res.json({ fields: result });
    } catch (error) {
        console.error('Error fetching fields:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createField = async (req, res) => {
    const { name, geometry, address } = req.body;
    try {
        const result = await fieldModel.createField(req.id, name, geometry, address);
        console.log('Field created:', result);
        res.json({ field: { id: result.insertId, name, geometry, address } });
    } catch (error) {
        console.error('Error creating field:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteField = async (req, res) => {
    const fieldId = req.params.id;
    try {
        const result = await fieldModel.deleteField(fieldId);
        console.log('Field deleted:', result);
        res.json({ message: "Field deleted successfully" });
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ error: 'Internal server error' }
        )
    }
};

exports.updateField = async (req, res) => {
    const fieldId = req.params.id;
    const { name, geometry, address } = req.body;
    try{
        const result = await fieldModel.updateField(fieldId, name, geometry, address);
        console.log('Field updated:', result);
        res.json({ field: { id: fieldId , name, geometry, address } });
    } catch (error) {
        console.error('Error updating field:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
