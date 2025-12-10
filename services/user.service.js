const { Op } = require('sequelize');
const userModel = require('../models/user');
const { generatePassword, verifyPassword, generateToken, getRoleById } = require('../helpers');
const { ROLES } = require('../constants/common');

/**
* Funtion to validate user by email and phone
* @param {*} email 
* @param {*} phone 
* @returns 
*/
const validateUserExistByEmailAndPhone = async (email, phone) => {
    // check user exist by email
    const exist = await userModel.findOne({
        attributes: ['id'],
        where: {
            [Op.or]: [{
                email: {
                    [Op.iLike]: email,  // Case-insensitive check
                },
            }, {
                phone
            }],
            isDeleted: false
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (exist) {
        throw new Error(`user with email/phone already exist`);
    }
};

/**
 * Function to check is user existby given role e.g. is inspection manager already exist in system
 * @param {*} role 
 * @returns 
 */
const validateUserExistByRoleId = async (roleId) => {
    const exist = await userModel.findOne({
        attributes: ['id'],
        where: {
            roleId,
            isDeleted: false
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (exist) {
        throw new Error(`An Inspection Manager is already present in the system. Please contact the admin for assistance.`);
    }
};

/**
 * Funtion to validate/exist client by id
 * @param {*} clientId
 * @returns 
 */
const validateClientById = async (clientId) => {
    console.log(clientId)
    // check user exist by id
    const exist = await userModel.findOne({
        attributes: ['id'],
        where: {
            id: clientId,
            roleId: ROLES.CLIENT,
            isDeleted: false,
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (!exist) {
        throw new Error('invalid client id provided');
    }
};

/**
 * Funtion to validate/exist role by id
 * @param {*} clientId
 * @returns 
 */
const validateUserByIdAndRoleId = async (id, roleId) => {
    const exist = await userModel.findOne({
        attributes: ['id'],
        where: {
            id,
            roleId,
            isDeleted: false,
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (!exist) {
        throw new Error(`invalid ${getRoleById(roleId)?.toLocaleLowerCase()} id provided`);
    }
};

/**
 * service to register new user (only admin)
 * @param {*} data 
 * @returns 
 */
const register = async (data) => {
    try {
        // check user exist by email
        await validateUserExistByEmailAndPhone(data.email, data.phone);

        const user = {
            ...data,
            password: generatePassword(data.password),
            roleId: ROLES.ADMIN,
            isActive: true,
            isVerified: true
        }

        const createdUser = await userModel.create(user, { raw: true, });

        return {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            phoneCode: createdUser.phoneCode,
            phone: createdUser.phone
        };
    } catch (err) {
        console.error(err)
        console.error('[user.register] error, ', err?.message);
        throw err;
    }

};

/**
 * service to login by cred.
 * @param {*} data 
 * @returns 
 */
const login = async (data) => {
    try {
        // prepare where
        const where = {
            isDeleted: false,
        };

        // for admin, client, rocurement manager
        if (data?.email) {
            where.email = { [Op.iLike]: data.email }  // Case-insensitive check
            where.roleId = { [Op.ne]: ROLES.INSPECTION_MANAGER }
        }

        // for inpection manager
        if (data?.phone) {
            where.phone = data.phone;
            where.roleId = ROLES.INSPECTION_MANAGER;
        }

        // check user exist by email
        const user = await userModel.findOne({
            attributes: ['id', 'name', 'email', 'phone', 'password', 'roleId', 'isDeleted', 'isActive', 'isVerified'],
            where,
            raw: true, // to get plain object instead of sequilise object
        });

        if (!user) {
            throw new Error(`invalid ${data?.email ? 'email' : 'phone'} provided`);
        }

        if (!user.isVerified) {
            throw new Error('user is not verified, please contact administrator');
        }
        if (!user.isActive) {
            throw new Error('user is de-activated, please contact administrator');
        }

        if (!verifyPassword(data.password, user.password)) {
            throw new Error('invalid password provided');
        }

        const token = generateToken({ id: user.id });

        user.role = getRoleById(user.roleId);
        return {
            user,
            token
        }

    } catch (err) {
        console.error(err)
        console.error('[user.login] error, ', err?.message);
        throw err;
    }
}

/**
 * Function to create user
 * @param {*} session 
 * @param {*} data 
 * @returns 
 */
const createUser = async (session, data) => {
    try {

        // check user exist by email
        await validateUserExistByEmailAndPhone(data.email, data.phone);

        // if theinspection manager is already present in the system throw error
        if(data.roleId === ROLES.INSPECTION_MANAGER){
            await validateUserExistByRoleId(data.roleId);
        }

        const user = {
            ...data,
            password: generatePassword(data.password),
            isActive: true,
            isVerified: true,
            createdBy: session.id
        }

        // If a procurement manager or admin creates an inspection manager,
        // auto-assign the new user to them.
        if ([ROLES.PROCUREMENT_MANAGER, ROLES.ADMIN].includes(session.roleId) && data.roleId === ROLES.INSPECTION_MANAGER) {
            user.procurementManagerId = session.id;
        }

        const createdUser = await userModel.create(user, { raw: true, });

        return {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            phoneCode: createdUser.phoneCode,
            phone: createdUser.phone,
            procurementManagerId: user.procurementManagerId
        };

    } catch (err) {
        console.error(err)
        console.error('[user.createUser] error, ', err?.message);
        throw err;
    }
};

/**
 * service to get user list
 * @param {*} session 
 * @param {*} data 
 * @returns 
 */
const getUsers = async (session, data) => {
    try {
        const where = {
            isDeleted: false,
        };

        // Procurement managers can only see inspection managers assigned to them.
        if (session.roleId === ROLES.PROCUREMENT_MANAGER) {
            where.procurementManagerId = session.id;
            where.roleId = ROLES.INSPECTION_MANAGER;
        }

        // Admins can filter by role
        if (session.roleId === ROLES.ADMIN && data.roleId) {
            where.roleId = data.roleId;
        }

        const users = await userModel.findAll({
            attributes: ['id', 'name', 'email', 'phoneCode', 'phone', 'roleId', 'procurementManagerId'],
            where,
            order: [
                ['createdAt', 'DESC'],
            ],
            raw: true
        });

        return users.map(user => ({ ...user, role: getRoleById(user.roleId) }));
    } catch (err) {
        console.error(err)
        console.error('[user.getUsers] error, ', err?.message);
        throw err;
    }
};

/**
 * Assign an Inspection Manager to a Procurement Manager (Admin only)
 * @param {string} userId - The ID of the Inspection Manager
 * @param {string} procurementManagerId - The ID of the Procurement Manager
 */
const assignManager = async (userId, procurementManagerId) => {
    try {
        // Validate that the user is an inspection manager
        await validateUserByIdAndRoleId(userId, ROLES.INSPECTION_MANAGER);

        // Validate that the manager is a procurement manager
        await validateUserByIdAndRoleId(procurementManagerId, ROLES.PROCUREMENT_MANAGER);

        const [updateCount, updatedUser] = await userModel.update(
            { procurementManagerId },
            { where: { id: userId }, returning: true, raw: false }
        );

        if (updateCount === 0) {
            throw new Error('Failed to assign manager.');
        }

        return updatedUser?.[0];
    } catch (err) {
        console.error('[user.assignManager] error, ', err?.message);
        throw err;
    }
};

/**
 * Unassign an Inspection Manager from a Procurement Manager (Admin only)
 * @param {string} userId - The ID of the Inspection Manager
 */
const unassignManager = async (userId) => {
    try {
        // Validate that the user is an inspection manager
        await validateUserByIdAndRoleId(userId, ROLES.INSPECTION_MANAGER);

        const [updateCount, updatedUser] = await userModel.update(
            { procurementManagerId: null },
            { where: { id: userId }, returning: true, raw: false }
        );

        if (updateCount === 0) {
            throw new Error('Failed to unassign manager.');
        }

        return updatedUser?.[0];
    } catch (err) {
        console.error('[user.unassignManager] error, ', err?.message);
        throw err;
    }
};


module.exports = {
    validateUserExistByEmailAndPhone,
    validateUserExistByRoleId,
    validateClientById,
    validateUserByIdAndRoleId,
    register,
    login,
    createUser,
    getUsers,
    assignManager,
    unassignManager
};
