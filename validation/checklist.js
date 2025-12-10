const Joi = require('joi');
const { CHECKLIST_QUESTION_TYPE } = require('../constants/common');

// Checklist validation schema
const checklistValidationSchema = Joi.object({
    id: Joi.number(),
    question: Joi.string()
        .max(250)
        .trim()
        .required()
        .messages({
            'string.empty': 'question cannot be an empty field',
            'any.required': 'question is required',
        }),

    questionType: Joi.string()
        .required()
        .valid(...Object.values(CHECKLIST_QUESTION_TYPE))
        .messages({
            'string.empty': 'question cannot be an empty field',
            'any.required': 'question is required',
        }),

    isRequired: Joi.boolean()
        .required()
        .messages({
            'string.empty': 'isRequired cannot be an empty field',
            'any.required': 'isRequired is required',
        }),

    options: Joi.when('questionType', {
        is: Joi.valid(CHECKLIST_QUESTION_TYPE.RADIO, CHECKLIST_QUESTION_TYPE.CHECKBOX, CHECKLIST_QUESTION_TYPE.DROPDOWN),  // If type is dropdown or multichoice
        then: Joi.array().items(
            Joi.object({
                key: Joi.string().required(),  // key in the options should be a string and required
                value: Joi.string().required(),  // value in the options should be a string and required
                isDefault: Joi.boolean()
            })
        ).min(1).required(),  // options array is required and must contain at least one object with key-value
        otherwise: Joi.forbidden()  // For other types (e.g., radio), options should not be provided
    })
})

module.exports.checklistValidationSchema = checklistValidationSchema;

// Checklist validation schema
module.exports.createChecklistValidationSchema = Joi.object({
    clientId: Joi.number()
        .required()
        .messages({
            'any.required': 'clientId is required',
        }),
    title: Joi.string().required(),
    questions: Joi.array().items(
        checklistValidationSchema
    ).min(1).required()
});

// Checklist validation schema
module.exports.updateChecklistValidationSchema = Joi.object({
    title: Joi.string().required(),
    questions: Joi.array().items(
        checklistValidationSchema
    ).min(1).required()
});


