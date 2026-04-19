/**
 * IntakeQuestions.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    question: {
      type: 'string',
    },
    
    text: {
      type: 'string',
    },

    workflow: {
      model: 'workflows',
    },

    index:{
      type:'number'
    },

    options: {
      type: 'json',
    },

    pattern: {
      type: 'string',
    },

    document: {
      type: 'Boolean',
      defaultsTo: false,
    },

    contactType: {
      model: 'contacttype',
    },

    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },
    addedBy: {
      model: 'users',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
    canDrag: {
      type: 'Boolean',
      defaultsTo: true,
    },
    deletedBy: {
      model: 'users',
    },

    updatedBy: {
      model: 'users',
    },

    createdAt: {
      type: 'ref',
      autoCreatedAt: true,
    },

    updatedAt: {
      type: 'ref',
      autoUpdatedAt: true,
    },
  },
};
