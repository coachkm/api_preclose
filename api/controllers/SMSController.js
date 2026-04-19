/**
 * SMSController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var ObjectId = require('mongodb').ObjectID;
const db = sails.getDatastore().manager;
module.exports = {
  getSentSMS: async (req, res) => {
    try {
      const { page, count, transactionId } = req.query;
      var query = {};
      query.transactionId = ObjectId(transactionId);
      db.collection('sms')
        .aggregate([
          {
            $match: query,
          },

          {
            $project: {
              transactionId: '$transactionId',
              to: '$to',
              sendBy: '$sendBy',
              from: '$from',
              subject: '$subject',
              message: '$message',
              createdAt: '$createdAt',
            },
          },
        ])
        .toArray((err, totalResult) => {
          if (err) {
            console.log(err);
            return res.status(400).json({
              success: false,
              error: { code: 400, message: '' + err },
            });
          }
          db.collection('sms')
            .aggregate([
              {
                $match: query,
              },

              {
                $project: {
                  transactionId: '$transactionId',
                  to: '$to',
                  sendBy: '$sendBy',
                  from: '$from',
                  subject: '$subject',
                  message: '$message',
                  createdAt: '$createdAt',
                },
              },

              {
                $sort: { createdAt: -1 },
              },
            ])
            .toArray(async (err, result) => {
              if (err) {
                console.log(err);
                return res.status(400).json({
                  success: false,
                  error: { code: 400, message: '' + err },
                });
              }
              return res.status(200).json({
                success: true,
                data: result,
                total: totalResult.length,
              });
            });
        });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};
