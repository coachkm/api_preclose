/**
 * DecisionPage.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title:{
      type:"string"
    },

    instruction:{
      type:'string'
    },

    video_url:{
      type:'string'
    },

    providers:{
      type:"json"
    },
    addedBy: {
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
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
  },

};

