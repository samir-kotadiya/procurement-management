const { Op } = require('sequelize');
const checklistModel = require('../models/checklist');
const checklistVersionModel = require('../models/checklist_version');
const { validateUserByIdAndRoleId } = require('../services/user.service');
const { ROLES } = require('../constants/common');
const { getPaginationOptios } = require('../helpers');

/**
 * finction to check checklist exist by id
 * @param {*} id 
 * @returns {chllstExist}
 */
const isChecklistExistById = async (id) => {
    const chllstExist = await checklistModel.findOne({
        where: {
            id,
            isDeleted: false
        },
        raw: true
    });

    if (!chllstExist) {
        throw new Error('invalid checklist provided');
    }

    return chllstExist;
}

/**
 * service to create checklist
 * @param {*} data 
 * @returns 
 */
const createChecklist = async (session, data) => {
    try {
        // check client id
        await validateUserByIdAndRoleId(data.clientId, ROLES.CLIENT);

        // check check exist by same question
        //await validateChecklistExistByClientIdAndQuestion(data.clientId, data.question);

        const checklistRecord = {
            ...data,
            questions: data.questions.reduce((acc, item, inx) => {
                acc.push({ ...item, id: ++inx });
                return acc;
            }, []),
            createdBy: session.id
        };

        const createdChecklist = await checklistModel.create(checklistRecord, { raw: true });

        return createdChecklist;
    } catch (err) {
        console.error(err)
        console.error('[checklist.createChecklist] error, ', err?.message);
        throw err;
    }

};

/**
 * service to update checklist
 * @param {*} session 
 * @param {*} checklistId 
 * @param {*} data 
 * @returns 
 */
const updateChecklist = async (session, checklistId, data) => {
    try {
        // check is checklist exist by id
        const checklist = await isChecklistExistById(checklistId);

        const checklistRecords = {
            ...data,
            version: checklist.version + 1,
            createdBy: session.id
        };

        const updatedChklist = await checklistModel.update(checklistRecords, {
            where: { id: checklistId },
            returning: true, // This will return the updated records
            raw: false
        });

        await checklistVersionModel.create({
            checklistId: checklist.id,
            version: checklist.version,
            questions: checklist.questions,
            createdBy: session.id
        }, {
            raw: false
        });


        return updatedChklist?.[1]?.pop();
    } catch (err) {
        console.error(err)
        console.error('[checklist.updateChecklist] error, ', err?.message);
        throw err;
    }

};

/**
 * service to create checklist
 * @param {*} data 
 * @returns 
 */
const getChecklist = async (session, data) => {
    try {
        // check client id
        if (data?.clientId) {
            await validateUserByIdAndRoleId(data.clientId, ROLES.CLIENT);
        }

        const where = {
            isDeleted: false,
        };

        if (data?.clientId) {
            where.clientId = data.clientId;
        }

        if (data?.term) {
            where.questions = {
                [Op.iLike]: `%${data.term}%`,  // Case-insensitive check
            }
        }

        const { pageSize, offset } = getPaginationOptios(data);
        const createdChecklist = await checklistModel.findAll({
            where,
            order: [
                ['createdAt', 'desc'],
            ],
            offset,
            limit: pageSize,
            raw: true
        });

        return createdChecklist;
    } catch (err) {
        console.error(err)
        console.error('[checklist.getChecklist] error, ', err?.message);
        throw err;
    }

};

/**
 * service to create checklist by id
 * @param {*} data 
 * @returns 
 */
const getChecklistById = async (session, id, data) => {
    try {
        const checklist = await checklistModel.findOne({
            where: {
                id,
                isDeleted: false,
            },
            raw: true, // to get plain object instead of sequilise object
        });

        if (!checklist) {
            throw new Error(`checklist not found.`);
        }

        if (data?.version && data?.version != checklist?.version) {
            const checklistVersion = await checklistVersionModel.findOne({
                where: {
                    checklistId: id,
                    version: data.version,
                },
                raw: true, // to get plain object instead of sequilise object
            });

            return {
                ...checklist,
                ...checklistVersion
            }
        }

        return checklist;
    } catch (err) {
        console.error(err)
        console.error('[checklist.getChecklist] error, ', err?.message);
        throw err;
    }

};

/**
 * Funtion to validate/exist checklist by client and question
 * @param {*} clientId 
 * @param {*} question 
 * @returns 
 */
const validateChecklistExistByClientIdAndQuestion = async (clientId, question) => {
    // check user exist by email
    const exist = await checklistModel.findOne({
        attributes: ['id'],
        where: {
            clientId,
            question: {
                [Op.iLike]: question,  // Case-insensitive check
            },
            isDeleted: false,
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (exist) {
        throw new Error(`same checklist already exist`);
    }
}

/**
 * function to validate checklist by client id and checklist ids
 * @param {*} clientId 
 * @param {*} checklistIds 
 */
const validateChecklistByClientIdAndChecklistId = async (clientId, checklistId) => {

    const checklist = await checklistModel.findOne({
        attributes: ['id'],
        where: {
            id: checklistId,
            clientId,
            isDeleted: false,
        },
        raw: true, // to get plain object instead of sequilise object
    });

    if (!checklist) {
        throw new Error(`invalid checklist id provided`);
    }
};

module.exports = {
    createChecklist,
    updateChecklist,
    getChecklist,
    validateChecklistExistByClientIdAndQuestion,
    validateChecklistByClientIdAndChecklistId,
    getChecklistById
}