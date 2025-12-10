const express = require('express');
const { createChecklist, updateChecklist, getChecklist, getChecklistById } = require('../../services/checklist.service');
const rolePermissionsMiddleware = require('../../middleware/permission');
const { createChecklistValidationSchema, updateChecklistValidationSchema } = require('../../validation/checklist');
const { commonPaginationValidationSchema } = require('../../validation');
const router = express.Router();

/* 
 create checklist route
*/
router.post('/', rolePermissionsMiddleware('checklist', 'canCreate'), async (req, res) => {
    try {
        const { error, value: data } = createChecklistValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const registerUser = await createChecklist(req.user, data);

        return res.ok(registerUser);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 update checklist route
*/
router.put('/:id', rolePermissionsMiddleware('checklist', 'canCreate'), async (req, res) => {
    try {
        const { error, value: data } = updateChecklistValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const registerUser = await updateChecklist(req.user, req.params.id, data);

        return res.ok(registerUser);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 get checklist by client id route
*/
router.get('/', rolePermissionsMiddleware('checklist', 'canView'), async (req, res) => {
    try {
        const { error, value: data } = commonPaginationValidationSchema.validate(req.query);

        if (error) {
            return res.badRequest(error?.message);
        }

        const checklists = await getChecklist(req.user, data);

        return res.ok(checklists);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 get checklist by id route
*/
router.get('/:id', rolePermissionsMiddleware('checklist', 'canView'), async (req, res) => {
    try {
        const checklists = await getChecklistById(req.user, req.params.id, req.query);

        return res.ok(checklists);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

module.exports = router;
