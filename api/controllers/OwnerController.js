/**
 * OwnerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {
  
 addOwner: async (req, res)=>{
     try {
        var data = req.body
        
        if(!data.owner || data.owner == undefined){
            return res.status(200).json({
                success:false,
                error:{code:404, message:constantObj.owner.OWNER_REQUIRED}
            })
        }else{
            data.owner = data.owner.toLowerCase()

            const owner = await Owner.findOne({owner:data.owner})

            if(owner){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:constantObj.owner.ALREADY_EXIST}
                })
            }else{
                data.addedBy = req.identity.id
                create = await Owner.create(data).fetch()
                return res.status(200).json({
                    success:true,
                    message: constantObj.owner.CREATED
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

 getOwner: async (req, res) => {
  try {
      const {id} = req.query
      const detail = await Owner.findOne({id:id})
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
      data.owner = data.owner.toLowerCase()
      const contractType = await Owner.findOne({owner: data.owner,id:{'!=':id}}) 
      if(contractType){
        return res.status(400).json({
            "success":false,
            "error":{
                "code":400,
                "message": constantObj.owner.ALREADY_EXIST
            }
        })
      }else{
          const updated =await Owner.update({id:id},data)
          return res. status(200).json({
              "success":true,
              "message": constantObj.owner.UPDATED
          })
      }
  } catch (err) {
      return res.status(400).json({
          "success": false,
          "error": { "code": 400, "message": "" + err }
      })
  }
},

 getAllOwners: (req, res) => {
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
      query.$or = [{ owner: { $regex: search, $options: 'i' } }];
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
  
    db.collection('owner')
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
            owner: '$owner',         
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
        db.collection('owner')
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
                owner: '$owner',         
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

  deleteOwner: async (req, res)=>{
    try{
        const id = req.param('id')
        var deleted = await Owner.update({id:id},{isDeleted:true})
        return res. status(200).json({
            "success":true,
            "message": constantObj.owner.SOFT_DELETED
        })
    }catch(err){
        return res.status(400).json({
            "success": false,
            "error": { "code": 400, "message": "" + err }
        })
    }
}
};

