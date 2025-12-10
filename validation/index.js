const Joi = require('joi');

// Order validation schema
module.exports.commonPaginationValidationSchema = Joi.object({
    term: Joi.string(),

    page: Joi.number()
        .default(1),

    pageSize: Joi.number()
        .min(10)
        .max(50)
}).unknown(true);