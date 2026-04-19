/**
 * ContentManagmentController
 *
 * @description :: Server-side logic for managing categories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 var ObjectId = require('mongodb').ObjectID;
 const db = sails.getDatastore().manager;
 module.exports = {

     update: function (req, res) {
         API(ContentManagmentService.updateContent, req, res);
     },

     /*
     *For List getAllContentList
     */
     getAllContentList: function (req, res, next) {
       // //console.log("In feedback");
       var search = req.param('search');
       var status = req.param('status');
       var isDeleted = req.param('isDeleted');
       let query = {}
       if (status) {
           query.status = status;
       }
       if (search) {
           query.$or = [
             { title:{$regex: search, '$options' : 'i'}},
           ]
         }
       
         if (isDeleted) {
           if(isDeleted === 'true'){
             isDeleted = true;
           }else{
             isDeleted = false;
           }
           query.isDeleted =isDeleted;
         }
           db.collection('contentmanagment').aggregate([
             {
               '$lookup': {
                   'from': 'users', //other table name
                   'localField': 'deletedBy',//name of car table field
                   'foreignField': '_id',//name of cardetails table field
                   'as': 'deletedBy' //alias for cardetails table
               }
             },{
               '$unwind': {
                   'path': '$deletedBy',
                   "preserveNullAndEmptyArrays": true
               }
             },
             {
                   $project: {
                     id:'$_id',
                     isDeleted: "$isDeleted",
                     slug: "$slug",
                     createdAt: "$createdAt",
                     updatedAt:"$updatedAt",
                     title:"$title",
                     description:"$description",
                     deletedBy:{
                       fullName: "$deletedBy.fullName",
                     },
                     meta_title:"$meta_title",
                     meta_description:"$meta_description",
                     meta_keyword:"$meta_keyword",
                     status:"$status",
                     updatedBy:"$updatedBy",
                 }
             },{
               $match: query
             },
             ]).toArray((err, result) => {
               return res.status(200).json({
                 "success": true,
                 "code": 200,
                 "data": result,
                 "total": result.length,
               });
             })
    },

    /*
     *For List getAllContentList
     */
     getSingleContent: (req,res)=>{
      //  //console.log("in getSingleContent");
         var slug = req.param('slug')
         var status = req.param('status')
         query ={}
         query.slug = slug
         if(status){
             query.status = status
         }

         ContentManagment.findOne(query).then(content=>{
             if(content){
                 return res.json({
                     success : true,
                     code : 200,
                     data:content
                 })
             }else{
                 return res.status(404).json({
                     success:false,
                     data:{},
                     error:{
                         code:404,
                         message:"Content not found"
                     }
                 })
             }

         });
     }



 };
