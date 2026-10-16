const jwt = require('jsonwebtoken');

// Generates a signed JWT for a given user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Sends token as httpOnly cookie + JSON body (works for both cookie & bearer-token clients)
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const days = parseInt((process.env.JWT_EXPIRE || '7d').replace('d', '')) || 7;
  const options = {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
};

module.exports = { generateToken, sendTokenResponse };
