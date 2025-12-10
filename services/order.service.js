const { Op, col } = require('sequelize');
const { ROLES, ORDER_STATUSES, ACTIVITY_TYPES } = require('../constants/common');
const sequelize = require('../config/db');
const { getPaginationOptios } = require('../helpers');
const orderModel = require('../models/order');
const OrderChecklistAnswer = require('../models/order_checklist_answer');
const checklistModel = require('../models/checklist');
const checklistVersionModel = require('../models/checklist_version');
const orderChecklistAnswerModel = require('../models/order_checklist_answer');
const OrderActivityModel = require('../models/order_activities');
const { validateChecklistByClientIdAndChecklistId, getChecklistById } = require('./checklist.service');
const { validateUserByIdAndRoleId, validateClientById } = require('./user.service');

/**
 * Logs an activity for an order.
 * @param {number} orderId - The ID of the order.
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} activityType - The type of activity.
 * @param {object} details - Additional details about the activity.
 * @param {object} transaction - Sequelize transaction object.
 */
const logActivity = async (orderId, userId, activityType, details = {}, data = null) => {
    // This is an async fire-and-forget call, so we don't await it in the main flow
    // to avoid blocking the response. We handle errors internally.

    if (data && typeof data === "object") {
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            activityType = activityType.replace(new RegExp(placeholder, 'g'), data[key]);
        });
    }

    OrderActivityModel.create({
        orderId,
        userId,
        activityType,
        details,
    }).catch(err => {
        console.error(`[logActivity] Failed to log activity: ${activityType} for orderId: ${orderId}`, err);
    });
};

module.exports = {

    /**
     * service to create order
     * @param {*} data 
     * @returns order
     */
    createOrder: async (session, data) => {
        try {
            // check client id
            await validateUserByIdAndRoleId(data.clientId, ROLES.CLIENT);

            if (data?.inspectionManagerId) {
                await validateUserByIdAndRoleId(data.inspectionManagerId, ROLES.INSPECTION_MANAGER);
            }

            // check checklist exist by client id and checklist ids
            if (data?.checklistId) {
                await validateChecklistByClientIdAndChecklistId(data.clientId, data.checklistId);
            }

            const orderRecord = {
                ...data,
                createdBy: session.id
            }
            if (session.roleId === ROLES.PROCUREMENT_MANAGER) {
                orderRecord.procurmentManagerId = session.id;
            }

            let order = await orderModel.create(orderRecord, { raw: true });
            // Log activity without blocking the response
            logActivity(order.id, session.id, ACTIVITY_TYPES.ORDER_CREATED, data);
            return order;
        } catch (err) {
            console.error(err)
            console.error('[order.createOrder] error, ', err?.message);
            throw err;
        }

    },

    /**
     * service to create order list
     * @param {*} data
     * @returns 
     */
    getOrders: async (session, data) => {
        try {
            // check client id
            if (data?.clientId) {
                await validateClientById(clientId);
            }

            let clientId = session.roleId === ROLES.CLIENT ? session.id : data.clientId ? data.clientId : null;

            const where = {

            };
            if (clientId) {
                where.clientId = clientId;
            }

            const { pageSize, offset } = getPaginationOptios(data);
            const orders = await orderModel.findAll({
                where,
                // include: {
                //     model: checklistModel
                // },
                order: [
                    ['createdAt', 'DESC'],
                ],
                offset,
                limit: pageSize,
                raw: true
            });

            return orders;
        } catch (err) {
            console.error(err)
            console.error('[order.getOrders] error, ', err?.message);
            throw err;
        }

    },

    /**
     * service to attached check list to order
     * @param {*} data 
     * @returns order
     */
    updateOrder: async (session, orderId, data) => {
        try {
            const order = await orderModel.findOne({ where: { id: orderId }, raw: true });
            if (!order) {
                throw new Error('invalid order id provided');
            }

            // check checklist exist by client id and checklist ids
            if (data?.checklistId) {
                await validateChecklistByClientIdAndChecklistId(order.clientId, data.checklistId);
            }

            if (data?.status && data.status === ORDER_STATUSES.COMPLETED) {
                const checklist = await OrderChecklistAnswer.findOne({ where: { orderId: order.id }, raw: true });
                if (!checklist) {
                    throw new Error('order checklist not done yet');
                }
            }

            await orderModel.update(data, { where: { id: order.id } }, { raw: true });

            logActivity(orderId, session.id, ACTIVITY_TYPES.ORDER_UPDATED, data, { key: data?.checklistId ? 'checklist' : 'status', value: data.checklist || data.status });
        } catch (err) {
            console.error(err)
            console.error('[order.updateOrder] error, ', err?.message);
            throw err;
        }

    },

    /**
     * service to save order checklist answer
     * @param {*} data
     * @returns order
     */
    saveOrderChecklist: async (session, orderId, data) => {
        try {
            const result = await sequelize.transaction(async (t) => {
                const order = await orderModel.findOne({
                    attributes: ['id', 'status', 'checklistId', 'checklistVersion'],
                    where: { id: orderId },
                    transaction: t,
                    raw: true
                });
                if (!order) {
                    throw new Error('invalid order id provided');
                }

                if (order.status === ORDER_STATUSES.COMPLETED) {
                    throw new Error('can not update completed order');
                }

                // Fetch the specific version of the checklist to validate against
                const checklist = await getChecklistById(session, order.checklistId, { version: order.checklistVersion });

                if (!checklist || !checklist.questions) {
                    throw new Error('Checklist questions not found for this order.');
                }

                // Validate payload answers against the checklist questions
                const checklistQuestionMap = new Map(checklist.questions.map(q => [q.id, q]));
                const submittedAnswerMap = new Map(data.questions.map(a => [a.id, a]));

                // 1. Check if any submitted answers are for questions that don't exist in the checklist.
                for (const submittedId of submittedAnswerMap.keys()) {
                    if (!checklistQuestionMap.has(submittedId)) {
                        throw new Error(`Invalid questionId provided: ${submittedId}. It does not exist in the checklist.`);
                    }
                }

                // 2. Check if all required questions from the checklist have been answered.
                for (const [id, question] of checklistQuestionMap.entries()) {
                    if (question.isRequired && !submittedAnswerMap.has(id)) {
                        throw new Error(`Missing answer for required question: "${question.question}"`);
                    }
                }

                // 3. Check if submitted answers with options are valid.
                for (const [id, answer] of submittedAnswerMap.entries()) {
                    const question = checklistQuestionMap.get(id);
                    // Check only for questions that have options and have been answered.
                    if (question && question.options && question.options.length > 0 && answer.answer) {
                        const validOptionKeys = new Set(question.options.map(opt => opt.key));
                        if (!validOptionKeys.has(answer.answer)) {
                            throw new Error(`Invalid answer "${answer.answer}" for question "${question.question}". Please provide one of the valid options.`);
                        }
                    }
                }

                const answerRecord = {
                    orderId: order.id,
                    checklistId: order.checklistId,
                    checklistVersion: order.checklistVersion,
                    answers: data.questions,
                    createdBy: session.id
                };

                await Promise.all([
                    orderChecklistAnswerModel.upsert(answerRecord, { transaction: t }),
                    orderModel.update({ status: ORDER_STATUSES.DONE }, { where: { id: order.id }, transaction: t })
                ]);

                // Log activity without blocking the response
                logActivity(orderId, session.id, ACTIVITY_TYPES.CHECKLIST_SUBMITTED, data);

                return orderChecklistAnswerModel.findOne({ where: { orderId: order.id }, transaction: t });
            });
            return result;
        } catch (err) {
            console.error(err)
            console.error('[order.saveOrderChecklist] error, ', err?.message);
            throw err;
        }

    },

    /**
     * service to get order with checklist
     * @param {*} orderId 
     * @returns order
     */
    getOrderWithChecklist: async (session, orderId) => {
        try {
            // Fetch order, its answers, the checklist, and the specific checklist version in a single query
            const orderData = await orderModel.findOne({
                where: { id: orderId },
                include: [
                    {
                        model: orderChecklistAnswerModel,
                        as: 'checklistAnswer',
                        required: false // LEFT JOIN
                    },
                    {
                        model: checklistModel,
                        as: 'checklist',
                        required: false, // LEFT JOIN
                        include: {
                            model: checklistVersionModel,
                            as: 'versions',
                            required: false, // LEFT JOIN
                            // This condition ensures we only join the specific version associated with the order
                            on: {
                                version: { [Op.eq]: col('Order.checklistVersion') }
                            }
                        }
                    }
                ],
                nest: true
            });

            if (!orderData) {
                throw new Error('invalid order id provided');
            }

            const order = orderData.get({ plain: true });
            const checklistAnswer = order.checklistAnswer;
            let checklist = null;

            if (order.checklist) {
                checklist = order.checklist;
                // If a specific version was found (i.e., it's not the latest),
                // its questions should override the main checklist's questions.
                if (checklist.versions && checklist.versions.length > 0) {
                    checklist.questions = checklist.versions[0].questions;
                    checklist.version = checklist.versions[0].version;
                }
            }

            if (checklist && checklist.questions && checklistAnswer && checklistAnswer.answers) {
                const answerMap = new Map(checklistAnswer.answers.map(a => [a.id, a.answer]));
                checklist.questions.forEach(question => {
                    if (answerMap.has(question.id)) {
                        question.answer = answerMap.get(question.id);
                    }
                });
            }

            // Clean up the response object
            delete order.checklist;
            delete order.checklistAnswer;
            if (checklist) delete checklist.versions;

            return { ...order, checklist };

        } catch (err) {
            console.error(err)
            console.error('[order.getOrderWithChecklist] error, ', err?.message);
            throw err;
        }

    },

    /**
     * Service to get activity logs for a specific order with pagination.
     * @param {number} orderId - The ID of the order.
     * @param {object} data - Pagination data { page, pageSize }.
     * @returns {Promise<object>} - A promise that resolves to the paginated activities.
     */
    getOrderActivities: async (session, orderId, data) => {
        try {
            const { pageSize, offset } = getPaginationOptios(data);

            const { count, rows } = await OrderActivityModel.findAndCountAll({
                where: { orderId },
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
                raw: true,
            });

            return {
                totalItems: count,
                activities: rows,
                totalPages: Math.ceil(count / pageSize),
                currentPage: data.page || 1,
            };
        } catch (err) {
            console.error('[order.getOrderActivities] error, ', err.message);
            throw err;
        }
    },
}