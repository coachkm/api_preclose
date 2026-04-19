/**
 * Roles.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
    },
    permission: {
      type: 'json',
    },
    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
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
