require('dotenv').config();

const express = require('express');

const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

const contactRoutes = require('./routes/contacts');

const noteRoutes = require('./routes/notes');

const sequelize = require('./models/db'); //the actual Sequelize instance

require('./models/user'); //ensures model is registered

require('./models/contact');

require('./models/notes');

require('./db/assosiations');

const app = express();

app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.use('/contacts', contactRoutes);

app.listen(3000, async () => {
  try {
    await sequelize.sync({alter : true}); //sync all registered models
  } catch (err) {
    console.error('DB sync failed:', err);
  }
});

module.exports = app;