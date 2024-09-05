const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const bodyParser = require('body-parser');

// Middleware
app.use(bodyParser.json());

// MongoDB-Verbindung
mongoose.connect('mongodb://localhost:27017/urlshortener')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// MongoDB Schema und Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const linkSchema = new mongoose.Schema({
    shortLink: { type: String, required: true, unique: true },
    destinationLink: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const clickSchema = new mongoose.Schema({
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link' },
    timestamp: { type: Date, default: Date.now },
    referrer: String
});

const User = mongoose.model('User', userSchema);
const Link = mongoose.model('Link', linkSchema);
const Click = mongoose.model('Click', clickSchema);

// Secret Key for JWT
const JWT_SECRET = '5b6a93c1186511ad8fc60f47498075fd3616c65cfc5f660a97b86137216e40ba996e8636a5beda981378d3fd557fb2a5e80202d34e0c34f616758b184e771d9d481b3d569831218966c0dc947733218cf17d0e09d4ae225895d6ae1f70f0480f0b0218c0292c07942bab0bb3c7c59063013c048a18b9c6c9666a87905e88221ab1073a5798ab8825e05a7991f5bf3bfc371d2671aa5a2ba5252cb5e8ffd12b7798364b620c01bafd3b3bdfbc9de549948dd983afa661a52fcc62bca9b4bb723471c6da8177d2ae8c9023b1b1891ac582251fdf99d168f9c0758760e7875190e462ac5279af07ee9092233d4d6f0e3c81631bfae0b05357b6b19b5c09c32f4e43';  // Replace this with a secure key in production

// Auth Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

// Registrierung
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (err) {
        res.status(500).send('Error registering user.');
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).send('Invalid username or password.');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid username or password.');

        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET);
        res.send({ token });
    } catch (err) {
        res.status(500).send('Error logging in.');
    }
});

// Route zum Hinzufügen eines neuen Kurzlinks (nur für authentifizierte Benutzer)
app.post('/add', auth, async (req, res) => {
    const { shortLink, destinationLink } = req.body;

    try {
        const newLink = new Link({ shortLink, destinationLink, userId: req.user._id });
        await newLink.save();
        res.status(201).send(`Link added: /${shortLink} -> ${destinationLink}`);
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).send('Short link already exists.');
        } else {
            res.status(500).send('Error adding the link.');
        }
    }
});

// Route zur Weiterleitung auf das Ziel
app.get('/:shortLink', async (req, res) => {
    const shortLink = req.params.shortLink;

    try {
        const link = await Link.findOne({ shortLink });

        if (!link) {
            return res.status(404).send('Link not found.');
        }

        // Klicks und Referrer speichern
        const referrer = req.get('Referrer') || '';
        const click = new Click({ linkId: link._id, referrer });
        await click.save();

        link.clicks += 1;
        await link.save();

        // Weiterleitung zur Ziel-URL (externe Seite)
        res.redirect(link.destinationLink);
    } catch (err) {
        res.status(500).send('Error processing the request.');
    }
});

// Route für Statistiken (nur für authentifizierte Benutzer)
app.get('/stats/:shortLink', auth, async (req, res) => {
    const shortLink = req.params.shortLink;

    try {
        const link = await Link.findOne({ shortLink, userId: req.user._id });
        if (!link) {
            return res.status(404).send('Link not found.');
        }

        const clicks = await Click.find({ linkId: link._id }).sort('-timestamp');
        res.json({ destinationLink: link.destinationLink, clicks: link.clicks, clickDetails: clicks });
    } catch (err) {
        res.status(500).send('Error retrieving stats.');
    }
});

// Server starten
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
