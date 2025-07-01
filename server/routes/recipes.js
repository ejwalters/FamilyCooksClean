const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// POST /recipes/add
router.post('/add', async (req, res) => {
    const { user_id, title, time, tags, ingredients, steps } = req.body;
    if (!user_id || !title || !ingredients || !steps) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabase
        .from('recipes')
        .insert([{ user_id, title, time, tags, ingredients, steps }])
        .select()
        .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /recipes/list
router.get('/list', async (req, res) => {
    let { limit } = req.query;
    limit = Math.min(parseInt(limit) || 20, 100);
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;
