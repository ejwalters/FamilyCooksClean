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
    let { limit, q } = req.query;
    limit = Math.min(parseInt(limit) || 20, 100);
    let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (q) {
        query = query.ilike('title', `%${q}%`);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /recipes/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing recipe id' });
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Recipe not found' });
    res.json(data);
});

module.exports = router;
