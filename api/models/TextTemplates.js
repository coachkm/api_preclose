/**
 * TextTemplates.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
    },

    to: {
      type: 'json',
    },

    subject: {
      type: 'string',
    },

    body: {
      type: 'string',
    },

    addedBy: {
      model: 'users',
    },

    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
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
