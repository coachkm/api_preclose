/**
 * Reference.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title:{
      type:'string'
    },
    addedBy: {
      model: 'users',
    },

    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },

    deletedBy: {
      model: 'users',
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

