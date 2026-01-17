"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const index_1 = require("../index");
const router = express_1.default.Router();
// Passport Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await index_1.prisma.user.findUnique({
            where: { googleId: profile.id },
        });
        if (!user) {
            user = await index_1.prisma.user.create({
                data: {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value || '',
                    avatarUrl: profile.photos?.[0]?.value,
                },
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error, false);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await index_1.prisma.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
// Routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000/dashboard');
});
router.get('/user', (req, res) => {
    if (req.user) {
        res.json(req.user);
    }
    else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out' });
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map