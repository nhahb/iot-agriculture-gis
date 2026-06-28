const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const deviceRoutes = require('./deviceRoutes');
const fieldRoutes = require('./fieldRoutes');
const notificationRoutes = require('./notificationRoutes');

function route(app) {
    app.use('/admin', adminRoutes);
    app.use('/user', userRoutes);
    app.use('/', authRoutes);
    app.use('/device', deviceRoutes);
    app.use('/field', fieldRoutes);
    app.use('/notification', notificationRoutes);
}

module.exports = route;