/**
 * Expense.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    amount:{
      type:'number'
    },

    who:{
      type:'string'
    },

    note:{
      type:'string'
    },

    payment:{
      type: 'Boolean',
      defaultsTo: false,
    },

    addedBy: {
      model: 'users',
    },

    date: {
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

