/**
 * ReferenceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {
  
 addReference: async (req, res)=>{
     try {
        var data = req.body
        
        if(!data.title || data.title == undefined){
            return res.status(200).json({
                success:false,
                error:{code:404, message:constantObj.reference.TITLE_REQUIRED}
            })
        }else{
            data.title = data.title.toLowerCase()

            const reference = await Reference.findOne({title:data.title})

            if(reference){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:constantObj.reference.ALREADY_EXIST}
                })
            }else{
                data.addedBy = req.identity.id
                create = await Reference.create(data).fetch()
                return res.status(200).json({
                    success:true,
                    message: constantObj.reference.CREATED
                })
            }
        }
     } catch (error) {
         return res.status(400).json({
             success:false,
             error:{code:400,message:""+error}
         })
     }
 },

 getAllReferences: (req, res) => {
    var search = req.param('search');
    var sortBy = req.param('sortBy');
    var page = Number(req.param('page'));
    var count = Number(req.param('count'));
    var status = req.param('status');

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

    var isDeleted = req.param('isDeleted');
    if (isDeleted === true || isDeleted === 'true') {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }
    if (status) {
      query.status = status;
    }
    query.addedBy = ObjectId(req.identity.id)
  
    db.collection('reference')
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
            status: '$status',
            addedBy: '$addedBy',
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
        query.addedBy = {$exists:false}

        // console.log(query)
        delete query.isDeleted
        delete query.status
        db.collection('reference')
          .aggregate([
            {
              $match: query,
            },
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
                status: '$status',
                addedBy: '$addedBy',
                createdAt: '$createdAt',
                updatedBy: '$updatedBy',
                isDeleted: '$isDeleted',
                deletedAt: '$deletedAt',
                updatedAt: '$updatedAt',
              },
            },
            
            { $sort: { createdAt: -1 } },

            // {
            //   $skip: skipNo,
            // },
            // {
            //   $limit: Number(count),
            // },
          ])
          .toArray((err, result) => {

            const response = totalResult.concat(result);
           const sorted =  response.sort((a,b) => a.title - b.title);
            return res.status(200).json({
              success: true,
              data: sorted,
              total: response.length,
            });
          });
      });
  },
};

