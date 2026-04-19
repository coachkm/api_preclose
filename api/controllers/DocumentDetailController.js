/**
 * DocumentDetailController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
module.exports = {
  /**
   * USed to add task on calendar
   */
  addDetail: async (req, res) => {
    try {
      const data = req.body;

      data.addedBy = req.identity.id;
      const createdTAsk = await DocumentDetail.create(data).fetch();

      if(data.type == 'Dates'){
        const reference = await Reference.findOne({title:data.title,addedBy:req.identity.id})
      //console.log(reference)
      if(!reference){
        let refData = {}
        refData.title = data.title
        refData.addedBy = req.identity.id

        const CreatedRef = await Reference.create(refData).fetch()
        updatedData = await DocumentDetail.update({id:createdTAsk.id},{referenceId:CreatedRef.id})
        //console.log("Reference Created")
      }else{
        updatedData = await DocumentDetail.update({id:createdTAsk.id},{referenceId:reference.id})
      }
      }

      return res.status(200).json({
        success: true,
        message: constantObj.tasks.CREATED,
      });
    } catch (err) {
      console.log(err)
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  viewDetail: async (req, res) => {
    try {
      const id = req.param('id');
      const task = await DocumentDetail.findOne({ id: id });
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getDocumentDetailListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      var templateId = req.param('templateId');
      var type = req.param('type');

      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 10;
      }
      var skipNo = (page - 1) * count;
      var query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { owner: { $regex: search, $options: 'i' } },
        ];
      }

      query.isDeleted = false;
      var sortquery = {};

      if (type) {
        query.type = type;
      }

      if (sortBy) {
        var typeArr = new Array();
        typeArr = sortBy.split(' ');
        var sortType = typeArr[1];
        var field = typeArr[0];
        sortquery[field ? field : 'createdAt'] = sortType
          ? sortType == 'desc'
            ? -1
            : 1
          : -1;
      } else {
        sortquery = { createdAt: -1 };
      }

      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }
      if(templateId){
        query.templateId = ObjectId(templateId);
      }
      
      // console.log(query);
      db.collection('documentdetail')
        .aggregate([
          {
            $lookup: {
              from: 'transactionstemplates',
              localField: 'template',
              foreignField: '_id',
              as: 'template',
            },
          },
          {
            $unwind: {
              path: '$template',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'addedBy',
              foreignField: '_id',
              as: 'addedBy',
            },
          },
          {
            $unwind: {
              path: '$addedBy',
              preserveNullAndEmptyArrays: true,
            },
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
            $lookup: {
              from: 'reference',
              localField: 'referenceDate',
              foreignField: '_id',
              as: 'referenceDate',
            },
          },
          {
            $unwind: {
              path: '$referenceDate',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              title: '$title',
              mile_stone: '$mile_stone',
              document: '$document',
              instructions: '$instructions',
              owner: '$owner',
              template: '$template',
              type: '$type',
              templateId: '$template._id',
              sharing_setting: '$sharing_setting',
              days: '$days',
              dayType: '$dayType',
              timing: '$timing',
              referenceDate:"$referenceDate",
              addedBy: '$addedBy',
              addedById: '$addedBy._id',
              createdAt: '$createdAt',
              isDeleted: '$isDeleted',
              deletedBy: '$deletedBy.fullName',
              deletedAt: '$deletedAt',
            },
          },
          {
            $match: query,
          },
          {
            $group: {
              _id:"$_id",
              // _id: '$title',
              id: { $first: "$_id" },
              tags: { $first: "$tag" },
              title: { $first: '$title'},
              mile_stone: { $first: '$mile_stone'},
              document: { $first: '$document'},
              type: { $first: '$type'},
              template: { $first: '$template'},
              templateId: { $first: '$template._id'},
              instructions: { $first: '$instructions'},
              owner: { $first: '$owner'},
              sharing_setting: { $first: '$sharing_setting'},
              days: { $first: '$days'},
              dayType: { $first: '$dayType'},
              timing: { $first: '$timing'},
              referenceDate:{ $first: "$referenceDate"},
              addedBy: { $first: '$addedBy'},
              addedById: { $first: '$addedBy._id'},
              createdAt: { $first: '$createdAt'},
              isDeleted: { $first: '$isDeleted'},
              deletedBy: { $first: '$deletedBy.fullName'},
              deletedAt: { $first: '$deletedAt'},
              reminderCount:{ $first: '$reminderCount'},
            },
          },
        ])
        .toArray((err, totalResult) => {
          db.collection('documentdetail')
            .aggregate([
              {
                $lookup: {
                  from: 'transactionstemplates',
                  localField: 'template',
                  foreignField: '_id',
                  as: 'template',
                },
              },
              {
                $unwind: {
                  path: '$template',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'addedBy',
                  foreignField: '_id',
                  as: 'addedBy',
                },
              },
              {
                $unwind: {
                  path: '$addedBy',
                  preserveNullAndEmptyArrays: true,
                },
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
                $lookup: {
                  from: 'reference',
                  localField: 'referenceDate',
                  foreignField: '_id',
                  as: 'referenceDate',
                },
              },
              {
                $unwind: {
                  path: '$referenceDate',
                  preserveNullAndEmptyArrays: true,
                },
              },
                // Converting id to string as in remider table there is no referencing for key as it belongs to many collection
                { "$addFields": { "taskid": { "$toString": "$_id" }}},

                { $lookup: {
                  from: "reminders",
                  localField: "taskid",
                  foreignField: "data_id",
                  as: "reminderCount"
              } },
              { $addFields: { 
                reminderCount: { $size: "$reminderCount" } // Calculating total of reminders of particular task
              } },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  type: '$type',
                  template: '$template',
                  templateId: '$template._id',
                  instructions: '$instructions',
                  owner: '$owner',
                  sharing_setting: '$sharing_setting',
                  days: '$days',
                  dayType: '$dayType',
                  timing: '$timing',
                  referenceDate:"$referenceDate",
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount:'$reminderCount'
                },
              },
              {
                $match: query,
              },
              {
                $group: {
                  _id:"$_id",
                  // _id: '$title',
                  id: { $first: "$_id" },
                  tags: { $first: "$tag" },
                  title: { $first: '$title'},
                  mile_stone: { $first: '$mile_stone'},
                  document: { $first: '$document'},
                  type: { $first: '$type'},
                  template: { $first: '$template'},
                  templateId: { $first: '$template._id'},
                  instructions: { $first: '$instructions'},
                  owner: { $first: '$owner'},
                  sharing_setting: { $first: '$sharing_setting'},
                  days: { $first: '$days'},
                  dayType: { $first: '$dayType'},
                  timing: { $first: '$timing'},
                  referenceDate:{ $first: "$referenceDate"},
                  addedBy: { $first: '$addedBy'},
                  addedById: { $first: '$addedBy._id'},
                  createdAt: { $first: '$createdAt'},
                  isDeleted: { $first: '$isDeleted'},
                  deletedBy: { $first: '$deletedBy.fullName'},
                  deletedAt: { $first: '$deletedAt'},
                  reminderCount:{ $first: '$reminderCount'},
                },
              },
              {
                $sort: sortquery,
              },

              // {
              //   $skip: Number(skipNo),
              // },
              // {
              //   $limit: Number(count),
              // },
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
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          error: '' + error,
        },
      });
    }
  },

  updateDetail: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      const updatedTask = await DocumentDetail.update({ id: id }, data);
      return res.status(200).json({
        success: true,
        message: constantObj.tasks.UPDATED,
      });
    } catch (err) {
      return res.status(400).json({
        suucess: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },

  removeTask: async (req, res) => {
    try {
      const id = req.param('id');
      const deletedTask = await DocumentDetail.destroy({ id: id });
      return res.status(200).json({
        success: true,
        message: constantObj.task.REMOVED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};
