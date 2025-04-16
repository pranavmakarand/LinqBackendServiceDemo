const bcrypt = require('bcrypt');
const User = require('../models/user');

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt');

exports.register = async (req, res) => {

  const { email, password } = req.body;

  try {

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ email, password: hashed });

    res.json({ user: { id: user.id, email: user.email } });

  } catch (err) {

    console.log(err);

    res.status(400).json({ error: 'User already exists or invalid input' });

  }
};

exports.login = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  // Save refresh token in DB
  await user.update({ refreshToken });

  res.json({ accessToken, refreshToken });
};

exports.refreshToken = async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = signAccessToken(user.id);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(403).json({ error: 'Token expired or invalid' });
  }
};