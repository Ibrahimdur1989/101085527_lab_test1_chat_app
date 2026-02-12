const express = require('express');
const router = express.Router();
const User = require('../models/User');

function getNow() {
    const d = new Date();

    return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString()
        .padStart(2,'0')}-${d.getFullYear()} ${d.toLocaleTimeString()}`;
}

router.post('/signup', async (req, res) => {
    try {
        const { username, firstname, lastname, password } = req.body;

        if (!username || !firstname || !lastname || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already exists'});

        const newUser = new User({
            username,
            firstname,
            lastname,
            password,
            createdon: getNow()
        });

        await newUser.save();
        res.json({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid username/password'});

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid username/password' });
        }

        res.json({
            message: 'Login successful',
            user: { username: user.username, firstname: user.firstname, lastname: user.lastname }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;