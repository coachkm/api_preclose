/**
 * EmailTemplateVariablesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {
  
    addvariables: async (req, res)=>{
        try{
            const data = req.body
            const created = await EmailTemplateVariables.create(data).fetch()
            return res.status(200).json({
                "success":true,
                "message": constantObj.messages.PATTEREN_ADDED
            })
        }catch(err){
            return res.status(200).json({
                "success":false,
                "error":{"code":400,"message":""+err}
            })
        }
    },

    variableDetail: async (req, res)=>{
        try {
            const id = req.param('id');
            const data = await EmailTemplateVariables.findOne({ id: id })            
              .populate('addedBy');
            return res.status(200).json({
              success: true,
              data: data,
            });
          } catch (err) {
            return res.status(400).json({
              success: false,
              error: { code: 400, message: '' + err },
            });
          }
    },

    updateDetail: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
      
                const updated =await EmailTemplateVariables.update({id:id},data)
                return res. status(200).json({
                    "success":true,
                    "message": "Data updated successfully."
                })
         
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getAllVariables: (req, res) => {
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var page = Number(req.param('page'));
        var count = Number(req.param('count'));
      
    
        if (page == undefined || !page) {
          page = 1;
        }
    
        if (count == undefined || !count) {
          count = 10000000;
        }
    
        var skipNo = (page - 1) * count;
        var query = {};
    
        if (sortBy) {
          sortBy = sortBy.toString();
        } else {
          sortBy = 'createdAt desc';
        }
    
        if (search) {
            query.$or = [{ title: { $regex: search, $options: 'i' } }];
          }
          query.isDeleted=false
        var isDeleted = req.param('isDeleted');
        if (isDeleted === true || isDeleted === 'true') {
          query.isDeleted = true;
        } else {
          query.isDeleted = false;
        }
      
        db.collection('emailtemplatevariables')
          .aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'deletedBy',
                foreignField: '_id',
                as: 'deletedBy',
              },
            },
            {
              $unwind: {
                path: '$deletedBy',
                preserveNullAndEmptyArrays: true,
              },
            },
    
            {
              $project: {
                id: '$_id',
                title: '$title',         
                type: '$type',
                createdAt: '$createdAt',
                updatedBy: '$updatedBy',
                isDeleted: '$isDeleted',
                deletedAt: '$deletedAt',
                updatedAt: '$updatedAt',
              },
            },
            {
              $match: query,
            },
          ])
          .toArray((err, totalResult) => {
            db.collection('emailtemplatevariables')
              .aggregate([
                {
                  $lookup: {
                    from: 'users',
                    localField: 'deletedBy',
                    foreignField: '_id',
                    as: 'deletedBy',
                  },
                },
                {
                  $unwind: {
                    path: '$deletedBy',
                    preserveNullAndEmptyArrays: true,
                  },
                },
    
                {
                  $project: {
                    id: '$_id',
                    title: '$title',         
                    type: '$type',
                    createdAt: '$createdAt',
                    updatedBy: '$updatedBy',
                    isDeleted: '$isDeleted',
                    deletedAt: '$deletedAt',
                    updatedAt: '$updatedAt',
                  },
                },
                {
                  $match: query,
                },
                { $sort: { createdAt: -1 } },
    
                {
                  $skip: skipNo,
                },
                {
                  $limit: Number(count),
                },
              ])
              .toArray((err, result) => {
                return res.status(200).json({
                  success: true,
                  code: 200,
                  data: result,
                  total: totalResult.length,
                });
              });
          });
      },
};

