module.exports = {
    ROLES: {
        ADMIN: 1,
        INSPECTION_MANAGER: 2,
        PROCUREMENT_MANAGER: 3,
        CLIENT: 4
    },
    CHECKLIST_QUESTION_TYPE: {
        RADIO: 'radio', // yes/no, radio/chekbox etc
        DROPDOWN: 'dropdown', // single choice
        CHECKBOX: 'checkbox', // multi choice
        TEXT: 'text',
        IMAGE: 'image'
    },
    ORDER_STATUSES: {
        PENDING:'pending', 
        IN_PROGRESS: 'in_progress',
        DONE: 'done', // once inspection manager done with all checklist
        COMPLETED: 'completed'
    },
    ACTIVITY_TYPES: {
        ORDER_CREATED: 'Order created',
        ORDER_UPDATED: 'Order {key} updated to {value}',
        CHECKLIST_SUBMITTED: 'Checklist Submitted'
    }
};