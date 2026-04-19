/**
 * SMS.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    to: {
      type: 'json',
    },
    from: {
      type: 'string',
    },
    subject: {
      type: 'string',
    },
    message: {
      type: 'string',
    },
    transactionId: {
      model: 'Transactions',
    },
    sendBy: {
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
