const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

db.sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced.");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
