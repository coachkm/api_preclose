/**
 * Reminders.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    day: {
      type: 'string',
      defaultsTo: '0',
    },

    data_id: {
      type: 'string',
    },

    type: {
      type: 'string',
    },

    direction: {
      type: 'string',
    },

    reference_date: {
      type: 'string',
    },

    time: {
      type: 'string',
    },

    recipients: {
      type: 'json',
    },

    date: {
      type: 'ref',
    },

    dateRule: {
      type: 'Boolean',
      defaultsTo: false,
    },

    addedBy: {
      model: 'users',
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

    transactionId: {
      model: 'transactions',
    },
    isEmail: {
      type: 'Boolean',
      defaultsTo: false,
    },
    isText: {
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
