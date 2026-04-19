/**
 * Channels.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    channel:{
      type:'string'
    },

    transactionId:{
      model:'Transactions'
    },
    createdAt: {
      type: 'ref',
      autoCreatedAt: true,
    },
    addedBy: {
      model: 'users',
    },

    updatedAt: {
      type: 'ref',
      autoUpdatedAt: true,
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

  },

};

