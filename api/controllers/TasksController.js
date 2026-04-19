/**
 * TasksController
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
      if (!data.transaction_id || data.transaction_id == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 400, message: constantObj.tasks.TRANSACTION_REQUIRED },
        });
      }
      if (!data.date || data.date == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 400, message: constantObj.tasks.DATE_REQUIRED },
        });
      }
      data.addedBy = req.identity.id;
      const createdTAsk = await Tasks.create(data).fetch();

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
      const task = await Tasks.findOne({ id: id });
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

  getTasksListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');

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
          { address: { $regex: search, $options: 'i' } },
          { pattern: { $regex: search, $options: 'i' } },
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

      query.addedById = ObjectId(req.identity.id);
      //console.log(sortquery);
      db.collection('tasks')
        .aggregate([
          {
            $lookup: {
              from: 'transactions',
              localField: 'transaction_id',
              foreignField: '_id',
              as: 'transaction_id',
            },
          },
          {
            $unwind: {
              path: '$transaction_id',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'assignTo',
              foreignField: '_id',
              as: 'assignTo',
            },
          },
          {
            $unwind: {
              path: '$assignTo',
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
              task: '$task',
              assignTo: '$assignTo',
              transaction_id: '$transaction_id',
              type: '$type',
              status: '$status',
              date: '$date',
              time: '$time',

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
          db.collection('tasks')
            .aggregate([
              {
                $lookup: {
                  from: 'transactions',
                  localField: 'transaction_id',
                  foreignField: '_id',
                  as: 'transaction_id',
                },
              },
              {
                $unwind: {
                  path: '$transaction_id',
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: 'users',
                  localField: 'assignTo',
                  foreignField: '_id',
                  as: 'assignTo',
                },
              },
              {
                $unwind: {
                  path: '$assignTo',
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
                  task: '$task',
                  assignTo: '$assignTo',
                  transaction_id: '$transaction_id',
                  type: '$type',
                  status: '$status',
                  date: '$date',
                  time: '$time',

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
      const updatedTask = await Tasks.update({ id: id }, data);
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
      const deletedTask = await Tasks.destroy({ id: id });
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
