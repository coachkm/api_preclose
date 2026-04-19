/**
 * TemplateTemplateTasksController
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
  addTask: async (req, res) => {
    try {
      const data = req.body;

      data.addedBy = req.identity.id;
      const createdTAsk = await TemplateTasks.create(data).fetch();

      const reference = await Reference.findOne({
        title: data.title,
        addedBy: req.identity.id,
      });
      //console.log(reference)
      if (!reference) {
        //console.log("Creating ref")
        let refData = {};
        refData.title = data.title;
        refData.addedBy = req.identity.id;
        // const CreatedRef = await Reference.create(refData).fetch()
        // updatedData = await TemplateTasks.update({id:createdTAsk.id},{referenceId:CreatedRef.id})
        //console.log("Reference Created")
      } else {
        updatedData = await TemplateTasks.update(
          { id: createdTAsk.id },
          { referenceId: reference.id }
        );
      }

      return res.status(200).json({
        success: true,
        message: constantObj.tasks.CREATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  viewTask: async (req, res) => {
    try {
      const id = req.param('id');
      const task = await TemplateTasks.findOne({ id: id });
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

  getTemplateTasksListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      var templateId = req.param('templateId');

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

      query.templateId = ObjectId(templateId);
      //console.log(sortquery);
      db.collection('templatetasks')
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
            $lookup: {
              from: 'emailtemplates',
              localField: 'emailTemplate',
              foreignField: '_id',
              as: 'emailTemplate',
            },
          },
          {
            $unwind: {
              path: '$emailTemplate',
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
            $project: {
              title: '$title',
              mile_stone: '$mile_stone',
              document: '$document',
              instructions: '$instructions',
              owner: '$owner',
              template: '$template',
              templateId: '$template._id',
              sharing_setting: '$sharing_setting',
              days: '$days',
              dayType: '$dayType',
              referenceDate: '$referenceDate',
              timing: '$timing',
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
        ])
        .toArray((err, totalResult) => {
          db.collection('templatetasks')
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
                  from: 'texttemplates',
                  localField: 'textTemplate',
                  foreignField: '_id',
                  as: 'textTemplate',
                },
              },
              {
                $unwind: {
                  path: '$textTemplate',
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
                $lookup: {
                  from: 'emailtemplates',
                  localField: 'emailTemplate',
                  foreignField: '_id',
                  as: 'emailTemplate',
                },
              },
              {
                $unwind: {
                  path: '$emailTemplate',
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
              // Converting id to string as in remider table there is no referencing for key as it belongs to many collection
              { $addFields: { taskid: { $toString: '$_id' } } },

              {
                $lookup: {
                  from: 'reminders',
                  localField: 'taskid',
                  foreignField: 'data_id',
                  as: 'tasksCount',
                },
              },
              {
                $addFields: {
                  tasksCount: { $size: '$tasksCount' }, // Calculating total of reminders of particular task
                },
              },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  template: '$template',
                  templateId: '$template._id',
                  textTemplate: '$textTemplate',
                  textTemplateId: '$textTemplate._id',
                  instructions: '$instructions',
                  owner: '$owner',
                  sharing_setting: '$sharing_setting',
                  referenceDate: '$referenceDate',
                  emailTemplate: '$emailTemplate',
                  days: '$days',
                  dayType: '$dayType',
                  timing: '$timing',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount: '$tasksCount',
                },
              },
              {
                $match: query,
              },
              {
                $sort: sortquery,
              },

              {
                $skip: Number(skipNo),
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

  updateTask: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      const updatedTask = await TemplateTasks.update({ id: id }, data);
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
      const deletedTask = await TemplateTasks.destroy({ id: id });
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
