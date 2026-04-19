/**
 * Transactions.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    address: {
      type: 'string',
    },
    route: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    zipcode: {
      type: 'string',
    },
    locality: {
      type: 'string',
    },
    lat: {
      type: 'string',
    },
    lng: {
      type: 'string',
    },
    workflow_id: {
      model: 'workflows',
    },
    type:{
      type:'string'
    },

    existingHome:{
      type:'string'
    },
    vacantProperty:{
      type:'string'
    },
    represent:{
      type:'string'
    },
    status: {
      type: 'string',
      defaultsTo: 'active',
    },

    transactionType:{
      type: 'string',
      defaultsTo: 'Buyer',
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

    closingDate:{
      type: 'ref',
      columnType: 'datetime',
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
