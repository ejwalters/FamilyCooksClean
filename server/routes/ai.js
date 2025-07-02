const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// Setup Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Setup OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
        // Add a system prompt to instruct the AI to return recipe details in a structured JSON format if the user is asking about a recipe
        const systemPrompt = {
            role: 'system',
            content: `
You are an AI chef assistant. If the user asks for a recipe, always respond with a JSON object containing the following fields:
- name (string)
- time (string, e.g. "30 min")
- tags (array of strings, e.g. ["Kid Friendly", "Vegan"])
- ingredients (array of strings, e.g. ["1 cup flour", "2 eggs"])
- steps (array of strings, e.g. ["Mix the flour and eggs.", "Bake for 20 minutes."])
- is_recipe (boolean, true if this is a recipe, false otherwise)

IMPORTANT:
- For the "ingredients" and "steps" fields, ALWAYS return a JSON array of strings. Each string should be a single ingredient or a single step. DO NOT join multiple items in a single string using commas, pipes, or any other delimiter. DO NOT return a single string with embedded newlines or delimiters.
- Example: "ingredients": ["1 cup flour", "2 eggs"], NOT "ingredients": "1 cup flour, 2 eggs" or "1 cup flour||2 eggs" or "1 cup flour\\n2 eggs".
- Example: "steps": ["Mix the flour and eggs.", "Bake for 20 minutes."], NOT "steps": "Mix the flour and eggs. Bake for 20 minutes." or "Mix the flour and eggs.||Bake for 20 minutes."
- Do not include any text outside the JSON object if returning a recipe.

For non-recipe responses, respond as normal but include "is_recipe": false.
`
        };
        const openaiMessages = [systemPrompt, ...messages.map(m => ({ role: m.role, content: m.content }))];
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: openaiMessages,
        });
        const aiResponse = completion.choices[0].message.content;

        // Debug: Log the raw AI response
        console.log('Raw AI Response:', aiResponse);

        // Try to parse and log the recipe object if possible
        try {
            const parsed = JSON.parse(aiResponse);
            if (parsed && parsed.is_recipe) {
                console.log('Parsed Recipe Object:', parsed);
            }
        } catch (e) {
            console.log('AI response is not valid JSON:', e.message);
        }

        // 5. Store AI response
        let normalizedContent = aiResponse;
        try {
            const parsed = JSON.parse(aiResponse);
            if (parsed && parsed.is_recipe) {
                function toArray(val) {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string') {
                        if (val.includes('||')) return val.split('||').map(s => s.trim());
                        if (val.includes('\\n')) return val.split('\\n').map(s => s.trim());
                        if (val.includes('\n')) return val.split('\n').map(s => s.trim());
                        if (val.split(',').length > 1) return val.split(',').map(s => s.trim());
                        return [val];
                    }
                    return [];
                }
                parsed.tags = toArray(parsed.tags);
                parsed.ingredients = toArray(parsed.ingredients);
                parsed.steps = toArray(parsed.steps);
                normalizedContent = JSON.stringify(parsed, null, 2);
            }
        } catch (e) {
            // Not valid JSON, leave as is
        }

        await supabase
            .from('messages')
            .insert([{ chat_id: chatId, user_id, role: 'assistant', content: normalizedContent }]);

        // 6. Fetch all messages for this chat
        const { data: allMessages, error: fetchAllError } = await supabase
            .from('messages')
            .select('role,content')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (!fetchAllError && allMessages) {
            // 7. Generate summary
            const summary = await generateChatSummary(allMessages);

            // 8. Update the chats table with the new summary
            await supabase
                .from('chats')
                .update({ summary })
                .eq('id', chatId);
        }

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

async function generateChatSummary(messages) {
    const prompt = `
Summarize the following conversation in a few keywords for a chat history list. Focus on the main topic, recipe, or user request. If the chat is mostly casual or contains no recipe, summarize the general theme.

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
    `;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: prompt }
        ],
        max_tokens: 60,
        temperature: 0.7,
    });
    return completion.choices[0].message.content.trim();
}

module.exports = router;
