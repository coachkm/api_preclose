/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    schema: false,
    name: {
      type: 'string',
      required: true,
    },

    type: {
      type: 'string',
    },

    image: {
      type: 'string',
    },

    parentCategory: {
      model: 'category',
    },

    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
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
    deletedBy: {
      model: 'users',
    },
    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },
  },
};
