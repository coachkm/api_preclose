/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user_id: {
      model: 'users',
    },
    addedBy: {
      model: 'users',
    },

    transaction:{
      model:'transactions'
    },

    user_access:{
      type: 'Boolean',
      defaultsTo: false,
    },

    status: {
      type: 'string',
      isIn: ['accepted', 'rejected'],
      defaultsTo: 'pending',
    },

    roles:{
      type:'json',
      defaultsTo:[]
    },

    createdAt: {
      type: 'ref',
      autoCreatedAt: true,
    },

    updatedAt: {
      type: 'ref',
      autoUpdatedAt: true,
    },

    teamMember: {
      type: 'Boolean',
      defaultsTo: false,
    },


    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
  },
};
