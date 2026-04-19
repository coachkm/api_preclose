/**
 * Signatures.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{
      type:"string"
    },

    signature:{
      type:"string"
    },

    createdBy:{
      model:'users'
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

