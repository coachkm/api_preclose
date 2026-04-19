/**
 * TemplateTasks.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    title: {
      type: 'string',
    },

    template: {
      model: 'transactionstemplates',
    },

    textTemplate: {
      model: 'texttemplates',
    },

    mile_stone: {
      type: 'json',
    },
    document: {
      type: 'string',
    },

    instructions: {
      type: 'string',
    },
    owner: {
      type: 'string',
    },
    sharing_setting: {
      type: 'json',
    },
    isDeleted: {
      type: 'Boolean',
    },
    days: {
      type: 'string',
    },
    dayType: {
      type: 'string',
      allowNull: true,
    },
    timing: {
      type: 'string',
      allowNull: true,
    },

    addedBy: {
      model: 'users',
    },

    deletedAt: {
      type: 'ref',
      columnType: 'datetime',
    },
    referenceDate: {
      model: 'reference',
    },

    emailTemplate: {
      model: 'EmailTemplates',
    },
    deletedBy: {
      model: 'users',
    },

    referenceId: {
      model: 'reference',
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
