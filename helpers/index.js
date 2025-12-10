const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ROLES } = require('../constants/common');

module.exports.generatePassword = (password) => {
    return bcrypt.hashSync(password, 8);
}

module.exports.verifyPassword = (password, hashPassword) => {
    return bcrypt.compareSync(password, hashPassword)
}

module.exports.generateToken = (payload) => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtValidity });
}

module.exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (err) {
        console.log('Token is invalid or expired', err.message);
        throw err;
    }
}

// function to get role by id
module.exports.getRoleById = (id) => {
    return Object.keys(ROLES).find(key => ROLES[key] === id);
}

module.exports.getPaginationOptios = (data) => {
return {
    pageSize: data.pageSize || config.pagination.limit,
    offset:(!data.page || data.page === 1) ? 0 : Math.floor((data.page - 1) * limit)
}
}
