const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const aiRoutes = require('./routes/ai');
app.use('/ai', aiRoutes);

const recipesRoutes = require('./routes/recipes');
app.use('/recipes', recipesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
