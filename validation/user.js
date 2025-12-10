const Joi = require('joi');
const { ROLES } = require('../constants/common');

// User validation schema
module.exports.userValidationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.base': 'Name should be a type of string',
            'string.empty': 'Name cannot be an empty field',
            'string.min': 'Name should have a minimum length of 3 characters',
            'string.max': 'Name should have a maximum length of 50 characters',
            'any.required': 'Name is required',
        }),

    email: Joi.string()
        .email()
        .max(100)
        .trim()
        .required()
        .messages({
            'string.base': 'Email should be a type of string',
            'string.empty': 'Email cannot be an empty field',
            'string.email': 'Email must be a valid email',
            'any.required': 'Email is required',
        }),

    phoneCode: Joi.string()
        .min(1) // Assuming a 3-digit phone code, adjust as necessary
        .max(3)
        .required()
        .messages({
            'string.base': 'Phone code should be a type of string',
            'string.empty': 'Phone code cannot be an empty field',
            'string.length': 'Phone code should be exactly 3 characters long',
            'any.required': 'Phone code is required',
        }),

    phone: Joi.string()
        .pattern(/^\d{10}$/)  // Ensures the phone number is exactly 10 digits
        .required()
        .messages({
            'string.base': 'Phone should be a type of string',
            'string.empty': 'Phone cannot be an empty field',
            'string.pattern.base': 'Phone should be a valid 10-digit number',
            'any.required': 'Phone number is required',
        }),

    password: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.base': 'Password should be a type of string',
            'string.empty': 'Password cannot be an empty field',
            'string.min': 'Password should have a minimum length of 8 characters',
            'any.required': 'Password is required',
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))  // Ensures confirmPassword matches password
        .required()
        .messages({
            'string.base': 'Confirm password should be a type of string',
            'string.empty': 'Confirm password cannot be an empty field',
            'any.required': 'Confirm password is required',
            'string.valid': 'Confirm password must match password',
        }),

    roleId: Joi.string().valid(ROLES.CLIENT,ROLES.INSPECTION_MANAGER, ROLES.PROCUREMENT_MANAGER)
});

// User Login validation schema
module.exports.userLoginValidationSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(100)
        .trim()
        .optional()  // Email is optional, but can be provided
        .messages({
            'string.base': 'Email should be a type of string',
            'string.empty': 'Email cannot be an empty field',
            'string.email': 'Email must be a valid email',
        }),

    phone: Joi.string()
        .pattern(/^\d{10}$/)  // Ensures the phone number is exactly 10 digits
        .optional()  // Phone is optional, but can be provided
        .messages({
            'string.base': 'Phone should be a type of string',
            'string.empty': 'Phone cannot be an empty field',
            'string.pattern.base': 'Phone should be a valid 10-digit number',
        }),

    password: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.base': 'Password should be a type of string',
            'string.empty': 'Password cannot be an empty field',
            'string.min': 'Password should have a minimum length of 8 characters',
            'any.required': 'Password is required',
        }),
})
    .xor('email', 'phone')  // Ensure at least one of email or phone is provided
    .messages({
        'object.xor': 'You must provide either an email or a phone number, but not both.',
    });

// Assign manager validation schema
module.exports.assignManagerValidationSchema = Joi.object({
    procurementManagerId: Joi.string().guid({ version: 'uuidv4' }).required()
        .messages({
            'any.required': 'procurementManagerId is required',
        }),
});