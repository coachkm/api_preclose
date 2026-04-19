/**
 * Email.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {


    to:{
      type:'json'
    },
    from:{
      type:"string"
    },
    subject:{
      type:"string"
    },
    message:{
      type:"string"
    },
    cc:{
      type:'json'
    },

    bcc:{
      type:'json'
    },
    attachments:{
      type:'json'
    },
    transactionId:{
      model:'Transactions'
    },
    sendBy: {
      model: 'users',
    },
    parentEmailId:{
      model:"email"
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

