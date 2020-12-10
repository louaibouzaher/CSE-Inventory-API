const jwt = require('jsonwebtoken')

const role = require('./role');
const User = require('../Models/UserModel')

module.exports = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '')
  //const token = tokens
  if (!token) return res.status(401).json({ message: "Auth Error" });
  try {
    const decoded = jwt.verify(token, "secret");
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

/*module.exports = function (req, res, next) {
  const token = req.header('x-auth-header');
  if (!token) return res.status(401).send('Access Denied: No Token Provided!');
  try {
    const decoded = jwt.verify(token, "secretkey"); 
    if (role[decoded.role].find(function (url) { return url == req.baseUrl })) {
      req.user = decoded
      next();
    }
    else
      return res.status(401).send('Access Denied: You dont have correct privilege to perform this operation');
  }
  catch (ex) {
    res.status(401).send('Invalid Token')
  }
}*/