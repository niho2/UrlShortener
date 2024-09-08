const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config()

//cors
app.use(cors())

// Secret Key for JWT
const JWT_SECRET = process.env.JWT_SECRET;  // Replace this with a secure key in production

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
app.post('/api/register', async (req, res) => {
    if(process.env.REGISTRATION_DISABLED) return res.status(403).send("Registration is currently disabled");
    const { username, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        console.log("Benutzername: ",username)
        console.log("Passwort: ",password)
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (err) {
        console.log(err)
        res.status(500).send('Error registering user.');
    }
});

// Login
app.post('/api/login', async (req, res) => {
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
app.post('/api/add', auth, async (req, res) => {
    const { shortLink, destinationLink } = req.body;

    if(shortLink == "api") return res.status(400).send('Short link already exists.');
    if(shortLink.includes("/")) return res.status(400).send('Short link is not allowed to contain /');

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
app.get('/api/stats/:shortLink', auth, async (req, res) => {
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

// Route zum Entfernen eines bestehenden Links (nur für authentifizierte Benutzer)
app.delete('/api/delete/:linkId', auth, async (req, res) => {
    const shortLinkId = req.params.linkId;

    try{
        const link = await Link.findOneAndDelete({_id: shortLinkId, userId: req.user._id});
        if(!link){
            return res.status(404).send("Link not found.")
        }
        await Click.deleteMany({linkId: link._id})
        res.status(200).send("Link deleted successfully.")
    } catch(err) {
        console.log(err)
        res.status(500).send('Error deleting ShortLink.');
    }
});

app.get('/api/links', auth, async (req, res) => {
    try{
        const links = await Link.find({ userId: req.user._id})
        res.json(links);
    } catch(err) {
        console.log(err)
        res.status(500).send('Error requesting links');
    }
});

app.get('/api/username', auth, async (req, res) => {
    try{
        const user = await User.findOne({_id: req.user._id})
        if(!user){
            return res.status(404).send("User not found.");
        }
        
        res.json(user.username);
    } catch(err){
        console.log(err)
        res.status(500).send('Error retrieving username.');
    }
});

// Server starten
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
