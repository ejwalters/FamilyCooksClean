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
    let { limit, q, user_id } = req.query;
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
    
    // If user_id is provided, check which recipes are favorited
    if (user_id && data.length > 0) {
        const recipeIds = data.map(r => r.id);
        const { data: favs, error: favsError } = await supabase
            .from('favorites')
            .select('recipe_id')
            .eq('user_id', user_id)
            .in('recipe_id', recipeIds);
        
        if (!favsError) {
            const favoritedIds = new Set(favs.map(f => f.recipe_id));
            data.forEach(recipe => {
                recipe.is_favorited = favoritedIds.has(recipe.id);
            });
        }
    }
    
    res.json(data);
});

// GET /recipes/favorites?user_id=...
router.get('/favorites', async (req, res) => {
    const { user_id } = req.query;
    console.log('Favorites endpoint called with user_id:', user_id);
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    // Get all favorite recipe_ids for this user
    const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', user_id);

    console.log('Favorites query result:', { favs, favsError });
    if (favsError) return res.status(500).json({ error: favsError.message });

    const recipeIds = favs.map(f => f.recipe_id);
    console.log('Recipe IDs found:', recipeIds);
    if (recipeIds.length === 0) {
        console.log('No favorites found, returning empty array');
        return res.json([]); // No favorites
    }

    // Get the full recipe details for these IDs
    const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);

    console.log('Recipes query result:', { recipes, recipesError });
    if (recipesError) return res.status(500).json({ error: recipesError.message });

    console.log('Returning recipes:', recipes);
    res.json(recipes);
});

// GET /recipes/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing recipe id' });
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Recipe not found' });
    
    // If user_id is provided, check if this recipe is favorited
    if (user_id) {
        const { data: fav, error: favError } = await supabase
            .from('favorites')
            .select('recipe_id')
            .eq('user_id', user_id)
            .eq('recipe_id', id)
            .single();
        
        if (!favError && fav) {
            data.is_favorited = true;
        } else {
            data.is_favorited = false;
        }
    }
    
    res.json(data);
});

// POST /recipes/favorite
router.post('/favorite', async (req, res) => {
    const { user_id, recipe_id } = req.body;
    if (!user_id || !recipe_id) return res.status(400).json({ error: 'Missing user_id or recipe_id' });

    // Insert or ignore if already exists
    const { error } = await supabase
        .from('favorites')
        .insert([{ user_id, recipe_id }], { upsert: true, onConflict: ['user_id', 'recipe_id'] });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// DELETE /recipes/favorite
router.delete('/favorite', async (req, res) => {
    const { user_id, recipe_id } = req.body;
    if (!user_id || !recipe_id) return res.status(400).json({ error: 'Missing user_id or recipe_id' });

    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user_id)
        .eq('recipe_id', recipe_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// POST /recipes/start-cooking
router.post('/start-cooking', async (req, res) => {
    const { user_id, recipe_id } = req.body;
    if (!user_id || !recipe_id) return res.status(400).json({ error: 'Missing user_id or recipe_id' });

    // Insert or update the recently_cooked record
    const { error } = await supabase
        .from('recently_cooked')
        .upsert([{ 
            user_id, 
            recipe_id, 
            cooked_at: new Date().toISOString() 
        }], { 
            onConflict: 'user_id,recipe_id',
            ignoreDuplicates: false 
        });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// GET /recipes/recently-cooked?user_id=...
router.get('/recently-cooked', async (req, res) => {
    const { user_id, limit = 10 } = req.query;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    // Get recently cooked recipes for this user
    const { data: recent, error: recentError } = await supabase
        .from('recently_cooked')
        .select('recipe_id, cooked_at')
        .eq('user_id', user_id)
        .order('cooked_at', { ascending: false })
        .limit(parseInt(limit));

    if (recentError) return res.status(500).json({ error: recentError.message });

    if (recent.length === 0) return res.json([]);

    // Get the full recipe details for these IDs
    const recipeIds = recent.map(r => r.recipe_id);
    const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);

    if (recipesError) return res.status(500).json({ error: recipesError.message });

    // Merge recipe data with cooked_at timestamps
    const recipesWithTimestamps = recipes.map(recipe => {
        const recentRecord = recent.find(r => r.recipe_id === recipe.id);
        return {
            ...recipe,
            cooked_at: recentRecord?.cooked_at
        };
    });

    // Sort by cooked_at (most recent first)
    recipesWithTimestamps.sort((a, b) => 
        new Date(b.cooked_at).getTime() - new Date(a.cooked_at).getTime()
    );

    res.json(recipesWithTimestamps);
});

module.exports = router;
