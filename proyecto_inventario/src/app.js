const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./interfaces/routes/authRoutes');
const userRoutes = require('./interfaces/routes/userRoutes');
const productRoutes = require('./interfaces/routes/productRoutes');
const saleRoutes = require('./interfaces/routes/saleRoutes');
const { errorHandler, notFoundHandler } = require('./interfaces/middlewares/errorHandler');

const app = express();

// Middlewares globales (morgan solo registra método y URL: nunca el cuerpo ni contraseñas)
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));

// Ruta raíz: la guía Android espera exactamente este mensaje en logcat
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
