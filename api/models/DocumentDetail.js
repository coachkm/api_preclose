/**
 * DocumentDetail.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    title: {
      type: 'string',
    },
    mile_stone: {
      type: 'json',
    },
    template: {
      model: 'transactionstemplates',
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

    type: {
      type: 'string',
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

    referenceId:{
      model:'reference'
    },


    updatedBy: {
      model: 'users',
    },

    createdAt: {
      type: 'ref',
      autoCreatedAt: true,
    },

    referenceDate:{
      model:'TransactionData'
    },

    updatedAt: {
      type: 'ref',
      autoUpdatedAt: true,
    },
  },
};
