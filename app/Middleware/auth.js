const jwt = require('jsonwebtoken')
const role = require('./role');
const User = require('../Models/UserModel')

const {secretToken} = require('../Configs/config')

module.exports = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: "Auth Error" });
  try {
    const decoded = jwt.verify(token, secretToken);
    const user = await User.findById(decoded.user.id)
    if (role[user.role].find(function (url) { return url == req.baseUrl + req.url })) {
      req.user = decoded
      next();
    }
    else
      return res.status(401).send('Access Denied: You dont have correct privilege to perform this operation');
    } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Invalid Token" });
  }
};
