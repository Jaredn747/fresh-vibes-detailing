const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
	const { password } = req.body;

	if (!password) {
		return res.status(400).json({ error: 'Password is required.' });
	}

	if (!process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
		console.error('Admin login is not configured.');
		return res.status(500).json({ error: 'Admin login is not configured.' });
	}

	try {
		const passwordMatches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

		if (!passwordMatches) {
			return res.status(401).json({ error: 'Invalid password.' });
		}

		const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
		return res.json({ token });
	} catch (error) {
		console.error('Admin login failed:', error);
		return res.status(500).json({ error: 'Failed to log in.' });
	}
});

module.exports = router;
