/**
 * Discount.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

 module.exports = {
  // autocreatedAt : true,
  // autoupdatedAt : true,
  attributes: {
      title: {
          type: 'string',
          minLength: 4,
          maxLength: 100,
      },
      description:{
          type: 'string',
          minLength: 4,

      },
      meta_title: {
          type: 'string',
      },
      meta_description:{
          type: 'string',

      },
      meta_keyword:{
          type: 'string',
      },
      status: {
          type: 'string',
          isIn: ['active', 'deactive'],
          defaultsTo: 'active'
      },
      updatedBy: {
          model: 'Users'
      },
      deletedBy:{
        model:'users'
      },
      deletedAt:{
        type: 'ref',
        columnType: 'datetime'
      },
      createdAt: {
        type: 'ref',
        autoCreatedAt: true
      },
        updatedAt: {
          type: 'ref',
          autoUpdatedAt: true
      },

  }
};

