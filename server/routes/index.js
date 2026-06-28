const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const deviceRoutes = require('./deviceRoutes');
const fieldRoutes = require('./fieldRoutes');

function route(app) {
    app.use('/admin', adminRoutes);
    app.use('/user', userRoutes);
    app.use('/', authRoutes);
    app.use('/device', deviceRoutes);
    app.use('/field', fieldRoutes);
}

module.exports = route;