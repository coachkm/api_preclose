/**
 * Faq.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {

        question: {
            type: 'string',
        },
        answer: {
            type: 'string',

        },
        isDeleted: {
            type: 'boolean',
            defaultsTo: false
        },
        status: {
            type: 'string',
            isIn: ['active', 'deactive'],
            defaultsTo: 'active'
        },
        addedBy: {
            model: 'Users'
        },
        updatedBy: {
            model: 'Users'
        },
        createdAt: {
            type: 'ref',
            autoCreatedAt: true
        },

        updatedAt: {
            type: 'ref',
            autoUpdatedAt: true
        },
        deletedBy: {
            model: 'users'
          },
          deletedAt: {
            type: 'ref',
            columnType: 'datetime',
          },


    }
};

