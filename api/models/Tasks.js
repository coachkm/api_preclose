/**
 * Tasks.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    task: {
      type: 'string',
    },

    assignTo: {
      model: 'users',
    },

    transaction_id: {
      model: 'transactions',
    },
    type: {
      type: 'string',
      isIn: ['buyer', 'seller', 'dual', 'listing'],
      defaultsTo: 'listing',
    },
    status: {
      type: 'string',
      isIn: ['open', 'skipped', 'completed'],
      defaultsTo: 'open',
    },

    date: {
      type: 'ref',
      columnType: 'datetime',
    },

    time: {
      type: 'string',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

    addedBy: {
      model: 'users',
    },

    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },

    deletedBy: {
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
