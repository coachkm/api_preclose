/**
 * EmailController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var ObjectId = require('mongodb').ObjectID;
const db = sails.getDatastore().manager;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
module.exports = {
  getSentEmail: async (req, res) => {
    try {
      const { page, count, transactionId } = req.query;
      var query = {};
      query.transactionId = ObjectId(transactionId);
      // query.parentEmailId={ $exists: false }
      // query.sendBy = ObjectId(req.identity.id)

      // console.log(query)
      db.collection('email')
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
              date_time: '$messages.date_time',
              message: '$message',
              attachments: '$attachments',
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
          db.collection('email')
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
                  date_time: '$messages.date_time',
                  message: '$message',
                  attachments: '$attachments',
                  createdAt: '$createdAt',
                },
              },

              {
                $sort: { createdAt: -1 },
              },

              //   {
              //     $skip: Number(skipNo),
              //   },
              //   {
              //     $limit: Number(count),
              //   },
            ])
            .toArray(async (err, result) => {
              // if (result.length > 0) {
              //     for (let i = 0; i < result.length; i++) {

              //         var exist = await Email.find({ parentEmailId: result[i].id });

              //         //console.log(exist)
              //         return res.status(200).json({
              //             success: true,
              //             data: exist,
              //             total: totalResult.length,
              //         });
              //     }
              // }
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

  getTransactionInbox: async (req, res) => {
    const { page, count, transactionId } = req.query;
    var query = {};
    query.transactionId = ObjectId(transactionId);
    query.to = { $elemMatch: { $eq: req.identity.imapEmail } };
    // query.sendBy = ObjectId(req.identity.id)
    // query.parentEmailId={ $exists: false }

    db.collection('email')
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
            date_time: '$messages.date_time',
            message: '$message',
            attachments: '$attachments',
            createdAt: '$createdAt',
          },
        },
      ])
      .toArray((err, totalResult) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: '' + err },
          });
        }
        db.collection('email')
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
                date_time: '$messages.date_time',
                message: '$message',
                attachments: '$attachments',
                createdAt: '$createdAt',
              },
            },

            {
              $sort: { createdAt: -1 },
            },

            //   {
            //     $skip: Number(skipNo),
            //   },
            //   {
            //     $limit: Number(count),
            //   },
          ])
          .toArray(async (err, result) => {
            if (err) {
              return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
              });
            }
            // if (result.length > 0) {
            //     for (let i = 0; i < result.length; i++) {

            //         var exist = await Email.find({ parentEmailId: result[i].id });

            //         // console.log(exist)
            //         return res.status(200).json({
            //             success: true,
            //             data: exist,
            //             total: totalResult.length,
            //         });
            //     }
            // }
            return res.status(200).json({
              success: true,
              data: result,
              total: totalResult.length,
            });
          });
      });
  },

  saveSentEmail: async (req, res) => {
    try {
      const data = req.body;

      data.to = req.body.to;
      data.from = req.identity.imapEmail;
      data.subject = req.body.subject;
      data.message = req.body.message;
      data.attachments = req.body.attachments;
      data.transactionId = req.body.transactionId;
      data.sendBy = req.identity.id;
      data.cc = req.body.cc;
      data.bcc = req.body.bcc;

      //   const sentEmail = await Email.create(data);

      transport = nodemailer.createTransport(
        smtpTransport({
          host: req.identity.imapHost,
          port: 587,
          debug: true,
          sendmail: true,
          requiresAuth: true,
          auth: {
            user: req.identity.imapEmail,
            pass: req.identity.imap,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })
      );

      var from = `${req.identity.fullName} < ${req.identity.imapEmail} >`;
      transport.sendMail(
        {
          from: from,
          to: req.body.to,
          subject: removeTags(req.body.subject),
          html: req.body.message,
          cc: req.body.cc,
          bcc: req.body.bcc,
          parentEmailId: req.body.parentEmailId,

          attachments: req.body.attachments,
        },
        async (err, info) => {
          console.log(err, info);
        }
      );
      const sentEmail = await Email.create(data);
      console.log(sentEmail, '------');
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully.',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};

function removeTags(str) {
  if (str === null || str === '' || str == undefined) return false;
  else str = str.toString();

  // Regular expression to identify HTML tags in
  // the input string. Replacing the identified
  // HTML tag with a null string.
  var newStr = str.replace(/\&nbsp;/g, '');
  return newStr.replace(/(<([^>]+)>)/gi, '');
}
