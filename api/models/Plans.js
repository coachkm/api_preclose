/**
 * Plans.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
    },
    price: {
      type: 'number',
      defaultsTo: 0,
    },
    stripePlanId: {
      type: 'string',
    },

    emailtemplates: {
      type: 'number',
      defaultsTo: 0,
    },

    features: {
      type: 'json',
    },

    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

    addedBy: {
      model: 'users',
    },

    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },
    addedBy: {
      model: 'users',
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
