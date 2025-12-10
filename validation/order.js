const Joi = require('joi');
const { ORDER_STATUSES } = require('../constants/common');

// Order validation schema
module.exports.orderValidationSchema = Joi.object({
    clientId: Joi.number()
        .required()
        .messages({
            'any.required': 'clientId is required',
        }),
    checklistId: Joi.number(),
    inspectionManagerId: Joi.number(),
    checklistIds: Joi.array().items(Joi.string()),
    status: Joi.string().valid(...Object.values(ORDER_STATUSES))
});

// Order validation schema
module.exports.orderPatchValidationSchema = Joi.object({
    checklistId: Joi.number(),
    status: Joi.string().valid(...Object.values(ORDER_STATUSES))
});

// Order check list answer schema
module.exports.orderChecklistAnswerValidationSchema = Joi.object({
    questions: Joi.array().items(
        Joi.object({
            id: Joi.number()
                .required()
                .messages({
                    'any.required': 'clientId is required',
                }),
            answer: Joi.any().required(),
        })
    ).min(1).required()
});