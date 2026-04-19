/**
 * MyViews.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{
      type:"string",

    },

    fields:{
      type:'json'
    },
    addedBy:{
      model:'users'
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

  beforeCreate: function (view, next) {
    if(!view.fields){
      view.fields = [{"label":"Property","key":"address"},{"label":"Buyer","key":"buyer"},
      {"label":"Status","key":"status"},{"label":"Seller","key":"seller"}]
    }
     
      next(false, view);
  
  },

};

