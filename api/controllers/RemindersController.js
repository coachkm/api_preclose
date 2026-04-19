/**
 * RemindersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;

module.exports = {
  addReminder: async (req, res) => {
    try {
      const data = req.body;
      data.addedBy = req.identity.id;
      if (data.date) {
        var today = new Date();
        utcHours = today.getUTCHours();
        utcMinutes = today.getUTCMinutes();

        var d = new Date(data.date);
        // d.setDate(d.getDate() + 1);
        d.setUTCHours(utcHours);
        d.setUTCMinutes(utcMinutes);
        data.date = d;
      }
      const createdReminder = await Reminders.create(data).fetch();
      return res.status(200).json({
        success: true,
        message: constantObj.reminder.ADDED,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + error },
      });
    }
  },

  getReminderDetail: async (req, res) => {
    try {
      const { id } = req.query;
      const detail = await Reminders.findOne({ id: id });
      return res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  updateReminder: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      if (data.date) {
        var today = new Date();
        utcHours = today.getUTCHours();
        utcMinutes = today.getUTCMinutes();

        var d = new Date(data.date);
        // d.setDate(d.getDate() + 1);
        d.setUTCHours(utcHours);
        d.setUTCMinutes(utcMinutes);
        data.date = d;
      }

      const updated = await Reminders.update({ id: id }, data);
      return res.status(200).json({
        success: true,
        message: constantObj.reminder.UPDATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getAllReminders: (req, res) => {
    var search = req.param('search');
    var sortBy = req.param('sortBy');
    var page = Number(req.param('page'));
    var count = Number(req.param('count'));
    var data_id = req.param('data_id');

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

    var isDeleted = req.param('isDeleted');
    if (isDeleted === true || isDeleted === 'true') {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }
    query.data_id = data_id;
    //console.log(query)
    db.collection('reminders')
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
            day: '$day',
            data_id: '$data_id',
            type: '$type',
            direction: '$direction',
            reference_date: '$reference_date',
            time: '$time',
            date: '$date',
            recipients: '$recipients',
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
        db.collection('reminders')
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
                day: '$day',
                data_id: '$data_id',
                type: '$type',
                direction: '$direction',
                reference_date: '$reference_date',
                time: '$time',
                date: '$date',
                recipients: '$recipients',
                createdAt: '$createdAt',
                updatedBy: '$updatedBy',
                isDeleted: '$isDeleted',
                deletedAt: '$deletedAt',
                updatedAt: '$updatedAt',
                dateRule: '$dateRule',
                isEmail: '$isEmail',
                isText: '$isText',
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
