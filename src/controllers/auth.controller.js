const httpStatus = require('../utils/httpStatus');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  if (!req.body || !req.body.refreshToken) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Refresh token is required' });
  }
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  if (!req.body || !req.body.refreshToken) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Refresh token is required' });
  }
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  if (!req.body || !req.body.email) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Email is required' });
  }
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  if (!req.body || !req.body.password) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'New password is required' });
  }
  if (!req.query || !req.query.token) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Password reset token is required' });
  }
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  if (!req.query || !req.query.token) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Verify email token is required' });
  }
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
