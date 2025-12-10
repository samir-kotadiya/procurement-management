const config = require('../config');
const { verifyToken } = require('../helpers');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {

    // ignor for while listed api e.g. register
    if (config.whiteListApi.includes(`${req.baseUrl}${req.url}`)) {
        return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    // if token not exist than return 401
    if (!token) {
        return res.unauthorized('Access denied');
    }
    
    try {
        const payload = verifyToken(token);
        const user = await User.findOne({
            attributes: ['id', 'name', 'email', 'phoneCode', 'phone', 'roleId'],
            where: { 
                id: payload?.id,
                isVerified: true,
                isActive: true,
                isDeleted: false
            },
            raw: true
        });
        
        if (!user) {
            return res.unauthorized('User not found');
        }
        req.user = user;
        return next();
    } catch (error) {
        console.log(error)
        return res.unauthorized('Invalid token');
    }
};

module.exports = authMiddleware;
