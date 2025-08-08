const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Pollify API Running');
});

// Add routes
// require('./routes/auth.routes')(app);
// require('./routes/form.routes')(app);
//

module.exports = app;
