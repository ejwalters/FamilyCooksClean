const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');

// Setup Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Setup OpenAI
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

// POST /ai/chat
router.post('/chat', async (req, res) => {
    const { user_id, chat_id, message } = req.body;

    if (!user_id || !message) {
        return res.status(400).json({ error: 'Missing user_id or message' });
    }

    let chatId = chat_id;

    // 1. If no chat_id, create a new chat
    if (!chatId) {
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .insert([{ user_id }])
            .select()
            .single();
        if (chatError) return res.status(500).json({ error: chatError.message });
        chatId = chat.id;
    }

    // 2. Insert user message
    const { error: userMsgError } = await supabase
        .from('messages')
        .insert([{ chat_id: chatId, user_id, role: 'user', content: message }]);
    if (userMsgError) return res.status(500).json({ error: userMsgError.message });

    // 3. Fetch previous messages for this chat
    const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('role,content')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
    if (fetchError) return res.status(500).json({ error: fetchError.message });

    // 4. Call OpenAI API
    try {
        const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        const aiResponse = completion.data.choices[0].message.content;

        // 5. Store AI response
        await supabase
            .from('messages')
            .insert([{ chat_id: chatId, user_id, role: 'assistant', content: aiResponse }]);

        res.json({ chat_id: chatId, ai_response: aiResponse });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /ai/chats?user_id=...
router.get('/chats', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /ai/messages?chat_id=...
router.get('/messages', async (req, res) => {
    const { chat_id } = req.query;
    if (!chat_id) return res.status(400).json({ error: 'Missing chat_id' });

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;
