/**
 * ContactTypeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {

    saveType: async (req, res) => {
        var data = req.body
        try {
            data.name = data.name.toLowerCase()
            const contractType = await ContactType.findOne({name:data.name})
            if(contractType){
                return res.status(400).json({
                    "success":false,
                    "error":{
                        "code":400,
                        "message": constantObj.contractType.ALREADY_EXIST
                    }
                })
            }else{
                data.addedBy = req.identity.id
                const contractType = await ContactType.create(data).fetch()
                return res.status(200).json({
                    "success":true,
                    "message":constantObj.contractType.CREATED
                })
            }
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getDetail: async (req, res) => {
        try {
            const {id} = req.query
            const detail = await ContactType.findOne({id:id})
            return res.status(200).json({
                "success":true,
                "data":detail
            })
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    updateDetail: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
            data.name = data.name.toLowerCase()
            const contractType = await ContactType.findOne({name: data.name,id:{'!=':id}}) 
            if(contractType){
              return res.status(400).json({
                  "success":false,
                  "error":{
                      "code":400,
                      "message": constantObj.contractType.ALREADY_EXIST
                  }
              })
            }else{
                const updated =await ContactType.update({id:id},data)
                return res. status(200).json({
                    "success":true,
                    "message": constantObj.contractType.UPDATED
                })
            }
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },


    getListing: async (req, res) => {
        try {
            var search = req.param('search');
            var page = req.param('page');
         
            var isDeleted = req.param('isDeleted')
            
            if (!page) {
                page = 1
            }
            var count = parseInt(req.param('count'));
            if (!count) {
                count = 10
            }
            var skipNo = (page - 1) * count;
            var query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, '$options': 'i' } },
                  
                   
                ]
            }
                 
            query.isDeleted = false;

            if (isDeleted) {
                if (isDeleted === 'true') {
                  isDeleted = true;
                } else {
                  isDeleted = false;
                }
                query.isDeleted = isDeleted;
              }
         
            db.collection('contacttype').aggregate([
                {
                    $lookup: {
                      from: 'users',
                      localField: 'deletedBy',
                      foreignField: '_id',
                      as: "deletedBy"
                    }
                  },
                  {
                    $unwind: {
                      path: '$deletedBy',
                      preserveNullAndEmptyArrays: true
                    }
                  },


                {
                    $project: {
                        name: "$name",  
                        status:"$status",                    
                        createdAt: "$createdAt",
                        isDeleted: "$isDeleted",                      
                        deletedBy: "$deletedBy.fullName",
                        deletedAt: '$deletedAt'

                    }
                },
                {
                    $match: query
                },
            ]).toArray((err, totalResult) => {

                db.collection('contacttype').aggregate([
                    {
                        $lookup: {
                          from: 'users',
                          localField: 'deletedBy',
                          foreignField: '_id',
                          as: "deletedBy"
                        }
                      },
                      {
                        $unwind: {
                          path: '$deletedBy',
                          preserveNullAndEmptyArrays: true
                        }
                      },

                    {
                        $project: {
                            name: "$name",   
                            status:"$status",                          
                            createdAt: "$createdAt",
                            isDeleted: "$isDeleted",                      
                            deletedBy: "$deletedBy.fullName",
                            deletedAt: '$deletedAt'
    
                        }
                    },
                    {
                        $match: query
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },

                    {
                        $skip: Number(skipNo)
                    },
                    {
                        $limit: Number(count)
                    }
                ]).toArray((err, result) => {
                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "data": result,
                        "total": totalResult.length,
                    });
                })

            })
        } catch (error) {
           
            return res.status(400).json({
                "success": false,
                "error":{
                    "code": 400,
                    "error": ""+error,
                }
               
            });
        }
    },

    deleteContactType: async (req, res)=>{
        try{
            const id = req.param('id')
            var deleted = await ContactType.update({id:id},{isDeleted:true})
            return res. status(200).json({
                "success":true,
                "message": constantObj.contractType.SOFT_DELETED
            })
        }catch(err){
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    }
    
};

