/**
 * TransactionData.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  schema: false,
  attributes: {
    title: {
      type: 'string',
    },

    template: {
      model: 'transactionstemplates',
    },

    textTemplate: {
      model: 'texttemplates',
    },

    transaction: {
      model: 'transactions',
    },

    documentId: {
      model: 'DocumentDetail',
    },

    rank: {
      type: 'number',
    },

    type: {
      type: 'string',
    },

    mile_stone: {
      type: 'json',
    },
    document: {
      type: 'string',
    },

    status: {
      type: 'string',
      defaultsTo: 'open',
    },
    referenceDate: {
      model: 'TransactionData',
    },

    dateReference: {
      model: 'Reference',
    },
    emailTemplate: {
      model: 'EmailTemplates',
    },

    instructions: {
      type: 'string',
    },
    owner: {
      type: 'string',
    },
    sharing_setting: {
      type: 'json',
    },

    documentUploaded: {
      type: 'Boolean',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

    days: {
      type: 'number',
    },
    dayType: {
      type: 'string',
      allowNull: true,
    },
    timing: {
      type: 'string',
    },

    date: {
      type: 'ref',
      columnType: 'datetime',
    },
    time: {
      type: 'string',
    },

    value: {
      type: 'string',
    },
    addedBy: {
      model: 'users',
    },

    emailTemplate: {
      model: 'EmailTemplates',
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
