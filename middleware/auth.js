const { verifyAccessToken } = require('../utils/jwt');

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;

    console.log(authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyAccessToken(token);
        req.userId = payload.userId; //available to next handlers
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};