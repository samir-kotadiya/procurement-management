const { ROLES } = require("../constants/common");

const permissions = {
    1: { // admin role
        users: {
            canCreate: true,
            canUpdate: true,
            canView: true,
            allowedRoles: [ROLES.PROCUREMENT_MANAGER, ROLES.INSPECTION_MANAGER, ROLES.CLIENT],
        },
        checklist: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
        orders: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
        order_checklist_answer: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
    },
    2: { // inspection manager role
        users: {
            canCreate: true,
            canUpdate: true,
            canView: true,
            allowedRoles: [ROLES.PROCUREMENT_MANAGER, ROLES.INSPECTION_MANAGER, ROLES.CLIENT],
        },
        checklist: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
        orders: {
            canCreate: false,
            canUpdate: true,
            canView: true,
        },
        order_checklist_answer: {
            canCreate: true,
            canUpdate: true,
            canView: true,
        },
    },
    3: { // procurement manageer role
        users: {
            canCreate: true,
            canUpdate: true,
            canView: true,
            allowedRoles: [ROLES.INSPECTION_MANAGER, ROLES.CLIENT],
        },
        checklist: {
            canCreate: true,
            canUpdate: true,
            canView: true,
        },
        orders: {
            canCreate: true,
            canUpdate: true,
            canView: true,
        },
        order_checklist_answer: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
    },
    4: { // client role
        users: {
            canCreate: false,
            canUpdate: false,
            canView: false,
            allowedRoles: [],
        },
        checklist: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
        orders: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
        order_checklist_answer: {
            canCreate: false,
            canUpdate: false,
            canView: true,
        },
    }
}

// Role-based permissions middleware
module.exports = rolePermissionsMiddleware = (action, permission, additionalChecks = null) => async (req, res, next) => {
    const { user } = req;

    if (user) {
        try {
            const { roleId } = user;

            const roleBasePermissions = permissions?.[roleId]?.[action];
            // Check if the user has the required permissions for the action
            if (
                action
                && permission
                && roleBasePermissions
                && roleBasePermissions?.[permission]
            ) {
                //check additional permission id required
                if (additionalChecks?.field && additionalChecks?.from, additionalChecks?.permission) {
                    switch (additionalChecks?.operator) {
                        case 'in':
                            if (!roleBasePermissions?.[additionalChecks?.permission]?.includes(req[additionalChecks?.from]?.[additionalChecks?.field])) {
                                return res.forbidden('Forbidden');
                            }

                        // can add extra case as needed

                        default:
                            break;
                    }
                }
                return next(); // Role is allowed, continue to the next middleware
            }
        } catch (err) {
            console.error('[permission] Error: ', err?.message);
            throw err;
        }
    }

    // User is forbidden, send a 403 Forbidden response
    return res.forbidden('Forbidden');
};