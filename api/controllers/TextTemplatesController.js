/**
 * TextTemplatesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;

const safeCreds = require('../../config/local');
const db = sails.getDatastore().manager;
const accountSid = safeCreds.TWILLIO_ACCOUNT_SID;
const authToken = safeCreds.TWILLIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
module.exports = {
  addTextTemplate: async (req, res) => {
    var data = req.body;
    try {
      data.name = data.name.toLowerCase();

      data.addedBy = req.identity.id;
      const createdTemplate = await TextTemplates.create(data).fetch();
      return res.status(200).json({
        success: true,
        message: constantObj.TEXTTEMPLATES.CREATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getDetail: async (req, res) => {
    try {
      const { id } = req.query;
      const detail = await TextTemplates.findOne({ id: id });
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

  updateDetail: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      data.name = data.name.toLowerCase();

      const updated = await TextTemplates.update({ id: id }, data);
      return res.status(200).json({
        success: true,
        message: constantObj.TEXTTEMPLATES.UPDATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');

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
        query.$or = [{ name: { $regex: search, $options: 'i' } }];
      }

      query.isDeleted = false;

      const contacts = await Users.find({
        addedBy: req.identity.id,
        isDeleted: false,
      });
      var user_ids = [];
      user_ids.push(ObjectId(req.identity.id));
      if (contacts && contacts.length > 0) {
        for await (let user of contacts) {
          user_ids.push(ObjectId(user.id));
        }
      }
      query.addedBy = { $in: user_ids };

      db.collection('texttemplates')
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
              name: '$name',
              addedBy: '$addedBy',
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
          if (err) {
            return res.status(400).json({
              success: false,
              error: { code: 400, message: '' + err },
            });
          }
          db.collection('texttemplates')
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
                  name: '$name',
                  addedBy: '$addedBy',
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
                $sort: {
                  createdAt: -1,
                },
              },

              {
                $skip: Number(skipNo),
              },
              {
                $limit: Number(count),
              },
            ])
            .toArray((err, result) => {
              if (err) {
                return res.status(400).json({
                  success: false,
                  error: { code: 400, message: '' + err },
                });
              }

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

  deleteTextTemplate: async (req, res) => {
    try {
      const id = req.param('id');
      var deleted = await TextTemplates.destroy({ id: id });
      return res.status(200).json({
        success: true,
        message: constantObj.TEXTTEMPLATES.SOFT_DELETED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  sendTextMessage: async (req, res) => {
    try {
      const data = req.body;

      data.to = req.body.to;
      data.subject = req.body.subject;
      data.message = req.body.message;
      data.sendBy = req.identity.id;

      const fromNumber = safeCreds.TWILLIO_NUMBER;
      if (data.to && data.to.length > 0) {
        for await (const toNumber of data.to) {
          try {
            const sentSMS = await client.messages.create({
              body: data.message,
              from: fromNumber,
              to: toNumber,
            });
          } catch (err) {
            console.log(err);
          }
        }
      }
      const savedSms = await SMS.create(data).fetch();

      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully.',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};
