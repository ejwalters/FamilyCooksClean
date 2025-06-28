const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: prompt }],
        });

        res.json({ result: response.choices[0].message.content });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error with AI request');
    }
});

module.exports = router;
