const express = require('express');
const { userValidationSchema, userLoginValidationSchema, assignManagerValidationSchema } = require('../../validation/user');
const { register, login, createUser, getUsers, assignManager, unassignManager } = require('../../services/user.service');
const rolePermissionsMiddleware = require('../../middleware/permission');
const router = express.Router();

/* 
 register user route
*/
router.post('/register', async (req, res) => {
    try {
        const { error, value: data } = userValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const registerUser = await register(data);

        return res.ok(registerUser);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
})

/* 
 login user route
*/
router.post('/login', async (req, res) => {
    try {
        const { error, value: data } = userLoginValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const user = await login(data);

        return res.ok(user);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
})

/* 
 create user route
*/
router.post('/', rolePermissionsMiddleware('users', 'canCreate', { field: 'roleId', from: 'body', operator: 'in', permission: 'allowedRoles' }), async (req, res) => {
    try {
        const { error, value: data } = userValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const user = await createUser(req.user, data);

        return res.ok(user);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
})

/* 
 get users route
*/
router.get('/', rolePermissionsMiddleware('users', 'canView'), async (req, res) => {
    try {
        // Note: You might want to add pagination validation here later
        const users = await getUsers(req.user, req.query);

        return res.ok(users);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
})

/* 
 assign inspection manager to procurement manager route (Admin only)
*/
router.post('/:userId/assign-manager', rolePermissionsMiddleware('users', 'canUpdate'), async (req, res) => {
    try {
        const { error, value: data } = assignManagerValidationSchema.validate(req.body);
        if (error) {
            return res.badRequest(error?.message);
        }

        const user = await assignManager(req.params.userId, data.procurementManagerId);

        return res.ok(user);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 unassign inspection manager from procurement manager route (Admin only)
*/
router.post('/:userId/unassign-manager', rolePermissionsMiddleware('users', 'canUpdate'), async (req, res) => {
    try {
        const user = await unassignManager(req.params.userId);

        return res.ok(user);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

module.exports = router;
