/**
 * Workflows.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    title: {
      type: 'string',
    },

    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

    invitedTemplate:{
      type:'string',
      defaultsTo:'no'
    },

    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },
    addedBy: {
      model: 'users',
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
