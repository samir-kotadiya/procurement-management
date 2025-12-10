const express = require('express');
const { orderValidationSchema, orderPatchValidationSchema, orderChecklistAnswerValidationSchema } = require('../../validation/order');
const rolePermissionsMiddleware = require('../../middleware/permission');
const { createOrder, updateOrder, getOrders, saveOrderChecklist, getOrderWithChecklist, getChecklistById } = require('../../services/order.service');
const { commonPaginationValidationSchema } = require('../../validation');
const orderModel = require('../../models/order');
const { getChecklistById: getChecklist } = require('../../services/checklist.service');
const { CHECKLIST_QUESTION_TYPE, ORDER_STATUSES } = require('../../constants/common');
const uploadChecklistImage = require('../../middleware/upload');
const router = express.Router();

/* 
 create order route
*/
router.post('/', rolePermissionsMiddleware('orders', 'canCreate'), async (req, res) => {
    try {
        const { error, value: data } = orderValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const order = await createOrder(req.user, data);

        return res.ok(order);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 attach checklist to order route
*/
router.patch('/:orderId', rolePermissionsMiddleware('orders', 'canUpdate'), async (req, res) => {
    try {
        const { error, value: data } = orderPatchValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const order = await updateOrder(req.user, req.params.orderId, data);

        return res.ok(order);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 get order route
*/
router.get('/', rolePermissionsMiddleware('orders', 'canView'), async (req, res) => {
    try {
        const { error, value: data } = commonPaginationValidationSchema.validate(req.query);

        if (error) {
            return res.badRequest(error?.message);
        }

        const checklists = await getOrders(req.user, data);

        return res.ok(checklists);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 get order with check list route
*/
router.get('/:orderId', rolePermissionsMiddleware('order_checklist_answer', 'canView'), async (req, res) => {
    try {
        const order = await getOrderWithChecklist(req.user, req.params.orderId);

        return res.ok(order);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/* 
 answer check list route
*/
router.post('/:orderId/answer', rolePermissionsMiddleware('order_checklist_answer', 'canUpdate'), async (req, res) => {
    try {
        const { error, value: data } = orderChecklistAnswerValidationSchema.validate(req.body);

        if (error) {
            return res.badRequest(error?.message);
        }

        const order = await saveOrderChecklist(req.user, req.params.orderId, data);

        return res.ok(order);
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

/*
 upload checklist image route
*/
const validateUploadRequest = async (req, res, next) => {
    try {
        const { orderId, questionId } = req.params;

        // 1. Find the order
        const order = await orderModel.findOne({ where: { id: orderId }, raw: true });
        if (!order) {
            return res.badRequest('Invalid order id provided.');
        }

        // 2. Check if the order has a checklist
        if (!order.checklistId) {
            return res.badRequest('This order does not have an associated checklist.');
        }

        if (order.status === ORDER_STATUSES.COMPLETED) {
            return res.badRequest('This order is already mark as completed. can not upload image now.');
        }

        // 3. Fetch the correct version of the checklist
        const checklist = await getChecklist(req.user, order.checklistId, { version: order.checklistVersion });
        if (!checklist || !checklist.questions) {
            return res.badRequest('Checklist not found for this order.');
        }

        // 4. Find the specific question and validate its type
        const question = checklist.questions.find(q => q.id == questionId);
        if (!question) {
            return res.badRequest('Invalid question id for the associated checklist.');
        }

        if (question.questionType !== CHECKLIST_QUESTION_TYPE.IMAGE) {
            return res.badRequest(`This question is not of type IMAGE.`);
        }

        // All validations passed, proceed to the next middleware (the uploader)
        next();
    } catch (err) {
        return res.internalServerError(err?.message);
    }
};

router.post('/:orderId/:questionId/upload', rolePermissionsMiddleware('order_checklist_answer', 'canUpdate'), validateUploadRequest, uploadChecklistImage.single('image'), (req, res) => {
    // At this point, orderId and questionId are validated, and the file is uploaded.
    if (!req.file) {
        return res.badRequest('No image file uploaded.');
    }
    try {
        // Construct the URL for the uploaded file
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/checklist-images/${req.file.filename}`;
        // Return the URL in the response
        return res.ok({ imageUrl: fileUrl });
    } catch (err) {
        return res.internalServerError(err?.message);
    }
});

module.exports = router;
