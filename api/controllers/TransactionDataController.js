/**
 * TransactionDataController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
const SmtpController = require('../controllers/SmtpController');
var constant = require('../../config/local.js');

module.exports = {
  addTransactionData: async (req, res) => {
    try {
      const data = req.body;
      data.addedBy = req.identity.id;
      // if(data.type == )
      if (req.body.id) {
        updateData = await TransactionData.update(
          { id: data.id },
          { documentUploaded: true }
        );
      }
      delete data.id;

      if (data.transaction) {
        const contact = await Contacts.findOne({
          user_id: req.identity.id,
          transaction: data.transaction,
          isDeleted: false,
        });

        if (contact) {
          data.sharing_setting = contact.roles;
        }
      }
      const created = await TransactionData.create(data).fetch();

      return res.status(200).json({
        success: true,
        message: constantObj.tasks.CREATED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },

  updateTransactionData: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      const transactionData = await TransactionData.findOne({ id: id });
      const updatedData = await TransactionData.update({ id: id }, data);
      if (transactionData.type == 'Dates' && data.date && data.date != '') {
        if (
          transactionData.referenceId &&
          transactionData.referenceId != undefined
        ) {
          const referencedChecklist = await TransactionData.find({
            referenceDate: transactionData.referenceId,
            transaction: transactionData.transaction,
          });
          if (referencedChecklist && referencedChecklist.length > 0) {
            for await (let itm of referencedChecklist) {
              let date = new Date(data.date);
              daysToAddOrSubtract = itm.days;
              if (itm.timing == 'After') {
                date.setDate(date.getDate() + daysToAddOrSubtract);
              } else {
                date.setDate(date.getDate() - daysToAddOrSubtract);
              }
              dateToUpdate =
                String(date.getUTCFullYear()) +
                '-' +
                String(date.getUTCMonth() + 1) +
                '-' +
                String(date.getUTCDate());
              console.log(dateToUpdate, date.getUTCFullYear());
              const updatedData = await TransactionData.update(
                { id: itm.id },
                { date: dateToUpdate }
              );
            }
          }
        }
      }

      if (req.body.dateReference) {
        const reference = await Reference.findOne({
          id: String(req.body.dateReference),
        });
        // console.log(reference,"-------------------reference")
        if (reference) {
          var referencedChecklist = await TransactionData.find({
            title: reference.title,
            transaction: String(transactionData.transaction),
          });
          // console.log()
          if (
            referencedChecklist &&
            referencedChecklist.length > 0 &&
            referencedChecklist[0].date &&
            referencedChecklist[0].date != ''
          ) {
            console.log(referencedChecklist[0].date);
            let date = new Date(referencedChecklist[0].date);
            daysToAddOrSubtract = req.body.days;
            if (transactionData.timing == 'After') {
              date.setDate(date.getDate() + daysToAddOrSubtract);
            } else {
              date.setDate(date.getDate() - daysToAddOrSubtract);
            }
            console.log(date, 'date to update', daysToAddOrSubtract);
            const updatedData = await TransactionData.update(
              { id: id },
              { date: date }
            );
          }
        }
      }
      return res.status(200).json({
        success: true,
        message: 'Updated successfully.',
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },

  getDetail: async (req, res) => {
    try {
      const id = req.param('id');

      const data = await TransactionData.findOne({ id: id }).populate(
        'emailTemplate'
      );
      return res.status(200).json({
        success: true,
        data: data,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },

  getCalenderData: async (req, res) => {
    try {
      var search = req.param('search');
      var sortBy = req.param('sortBy');

      var transactionId = req.param('transactionId');
      var status = req.param('status');
      var type = req.param('type');
      var addedBy = req.param('user_id');

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

      if (type) {
        query.type = type;
      } else {
        query.type = { $in: ['task', 'dates', 'Dates', 'Tasks'] };
      }
      if (status) {
        query.status = status;
      }
      if (addedBy) {
        // query.addedById = ObjectId(addedBy);

        var transactionArray = [];
        var contacts = await Contacts.find({
          user_id: req.identity.id,
          isDeleted: false,
        });
        if (contacts) {
          for await (var val of contacts) {
            transactionArray.push(ObjectId(val.transaction));
          }
        }

        const myUsers = await Users.find({
          addedBy: req.identity.id,
          isDeleted: false,
        });
        var transUsers = [req.identity.id];
        if (myUsers && myUsers.length > 0) {
          for await (let user of myUsers) {
            transUsers.push(user.id);
          }
        }
        const myTransactions = await Transactions.find({
          addedBy: { in: transUsers },
        });
        if (myTransactions && myTransactions.length > 0) {
          for await (var transaction of myTransactions) {
            transactionArray.push(ObjectId(transaction.id));
          }
        }
        query.transactionId = { $in: transactionArray };
      }
      if (transactionId) {
        query.transactionId = ObjectId(transactionId);
      }
      query.transactionStatus = { $in: ['active', 'progress'] };
      query.transactionDeleteStatus = false;

      // console.log(query)
      db.collection('transactiondata')
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
              from: 'transactions',
              localField: 'transaction',
              foreignField: '_id',
              as: 'transactions',
            },
          },
          {
            $unwind: {
              path: '$transactions',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              title: '$title',
              mile_stone: '$mile_stone',
              document: '$document',
              template: '$template',
              transactionId: '$transaction',
              transactionStatus: '$transactions.status',
              transactionDeleteStatus: '$transactions.isDeleted',
              instructions: '$instructions',
              owner: '$owner',
              sharing_setting: '$sharing_setting',
              date: '$date',
              days: '$days',
              dayType: '$dayType',
              timing: '$timing',
              addedBy: '$addedBy',
              addedById: '$addedBy._id',
              type: '$type',
              status: '$status',
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
        ])
        .toArray((err, result) => {
          return res.status(200).json({
            success: true,
            code: 200,
            data: result,
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

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to get listing of transaction data On behalf of data type
   */
  fetchTransactionData: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');
      var status = req.param('status');
      var isDeleted = req.param('isDeleted');
      var transactionId = req.param('transactionId');
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

        if (type == 'Checklist' || type == 'Dates') {
          sortquery = { date: 1 };
        } else if (type == 'Documents') {
          sortquery = { documentSort: 1 };
        }
      }

      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }

      if (status) {
        query.status = status;
      }
      if (type) {
        query.type = type;
      }
      query.transactionId = ObjectId(transactionId);

      const transaction = await Transactions.findOne({ id: transactionId });
      // console.log({user_id:req.identity.id,transaction:transactionId,isDeleted:false})
      const contact = await Contacts.find({
        user_id: req.identity.id,
        transaction: transactionId,
        isDeleted: false,
      });
      //  console.log(contact);
      if (
        contact &&
        contact.length > 0 &&
        transaction.addedBy != req.identity.id
      ) {
        contactRole = [];
        teamMember = false;
        userAccess = false;
        for await (let itm of contact) {
          // console.log(itm)
          contactRole = contactRole.concat(itm.roles);
          if (itm.teamMember == true) {
            teamMember = true;
          }
          if (itm.user_access == true) {
            userAccess = true;
          }
        }
        // console.log(contactRole)
        // if(contactRole.includes("Buyer's Coordinator") == false){

        // }

        // if(userAccess == false && contactRole.includes("Buyer's Coordinator") == false && req.identity.teamMember == false ){
        console.log(req.identity);

        if (
          userAccess == false &&
          contactRole.includes("Buyer's Coordinator") == false
        ) {
          if (req.identity.teamMember == true) {
            contactRole.push('My Team');
          }
          query.sharing_setting = { $in: contactRole };
          // query.key = true
        }

        if (userAccess == true) {
          if (req.identity.teamMember == false) {
            contactRole;
          }
          if (req.identity.teamMember == true) {
            contactRole.push('My Team');
          }
          query.sharing_setting = { $in: contactRole };
        }
      }
      console.log(query.sharing_setting);
      // console.log(query)
      db.collection('transactiondata')
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
              from: 'transactiondata',
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
            $project: {
              title: '$title',
              mile_stone: '$mile_stone',
              document: '$document',
              instructions: '$instructions',
              owner: '$owner',
              template: '$template',
              transactionId: '$transaction',
              sharing_setting: '$sharing_setting',
              days: '$days',
              date: '$date',
              time: '$time',
              transactions: '$transactions',
              routes: '$transactions.route',
              value: '$value',
              emailTemplate: '$emailTemplate',
              status: '$status',
              dayType: '$dayType',
              timing: '$timing',
              addedBy: '$addedBy',
              referenceDate: '$referenceDate',
              addedById: '$addedBy._id',
              type: '$type',
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
          db.collection('transactiondata')
            .aggregate([
              {
                $addFields: {
                  sortId: {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$status', 'open'] }, then: 0 },
                        { case: { $eq: ['$status', 'skipped'] }, then: 1 },
                      ],
                      default: 2,
                    },
                  },
                },
              },

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
                  from: 'users',
                  localField: 'addedBy',
                  foreignField: '_id',
                  as: 'addedBy',
                },
              },
              {
                $lookup: {
                  from: 'notes',
                  localField: '_id',
                  foreignField: 'transactionData',
                  as: 'notes',
                },
              },

              {
                $lookup: {
                  from: 'transactiondata',
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
                  from: 'reference',
                  localField: 'dateReference',
                  foreignField: '_id',
                  as: 'dateReference',
                },
              },
              {
                $unwind: {
                  path: '$dateReference',
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
                  as: 'reminderCount',
                },
              },
              {
                $addFields: {
                  reminderCount: { $size: '$reminderCount' }, // Calculating total of reminders of particular task
                },
              },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  template: '$template',
                  textTemplate: '$textTemplate',
                  transactionId: '$transaction',
                  instructions: '$instructions',
                  owner: '$owner',
                  days: '$days',
                  date: '$date',
                  time: '$time',
                  transactions: '$transactions',
                  routes: '$transactions.route',
                  value: '$value',
                  emailTemplate: '$emailTemplate',
                  notes: '$notes',
                  status: '$status',
                  dayType: '$dayType',
                  timing: '$timing',
                  referenceDate: '$referenceDate',
                  dateReference: '$dateReference',
                  documentUploaded: '$documentUploaded',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  type: '$type',
                  sharing_setting: '$sharing_setting',
                  sortId: '$sortId',
                  documentSort: {
                    $cond: {
                      if: { $eq: ['$value', ''] },
                      then: 1,
                      else: 0,
                    },
                  },
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount: '$reminderCount',
                },
              },
              {
                $match: query,
              },
              {
                $sort: sortquery,
              },

              //   {
              //     $skip: Number(skipNo),
              //   },
              //   {
              //     $limit: Number(count),
              //   },
            ])
            .toArray(async (err, result) => {
              if (result && result.length > 0) {
                for (let data of result) {
                  if (data.notes && data.notes.length > 0) {
                    for (let itm of data.notes) {
                      const user = await Users.findOne({
                        id: String(itm.addedBy),
                      });
                      itm.addedBy = user;
                    }
                  }
                  if (data.date && data.date != '') {
                    data.newDateDate = new Date(data.date);
                  }

                  // if (type == 'Checklist') {
                  // if (data.date && data.date != "") {
                  //   data.newDateDate = new Date(data.date)
                  //   data.sort = 0
                  // } else {
                  //   data.sort = 1
                  // }
                  // }
                }
              }
              sortedResult = result.sort((a, b) =>
                a.newDateDate > b.newDateDate
                  ? 1
                  : b.newDateDate > a.newDateDate
                  ? -1
                  : 0
              );
              if (!sortBy || sortBy == undefined) {
                for (let data of result) {
                  // if (data.date && data.date != "") {
                  //   data.newDateDate = new Date(data.date)

                  //   // data.sort = 0
                  // }
                  //  else {
                  //   data.sort = 2
                  // }
                  if (data.status == 'open' && data.date) {
                    data.sort = 1;
                  }
                  if (data.status == 'open' && !data.date) {
                    data.sort = 2;
                  }
                  if (data.status == 'skipped' && data.date) {
                    data.sort = 3;
                  }
                  if (data.status == 'skipped' && !data.date) {
                    data.sort = 4;
                  }

                  if (data.status == 'complete' && data.date) {
                    data.sort = 5;
                  }

                  if (data.status == 'complete' && !data.date) {
                    data.sort = 6;
                  }
                }
                sortedResult.sort((a, b) =>
                  a.sort > b.sort ? 1 : b.sort > a.sort ? -1 : 0
                );
                // result.sort((a, b) => (a.newDateDate > b.newDateDate) ? 1 : ((b.newDateDate > a.newDateDate) ? -1 : 0))
              }
              return res.status(200).json({
                success: true,
                code: 200,
                data: sortedResult,
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

  getChecklists: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      // var transactionId = req.param('transactionId')
      // var type = req.param('type')

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

      query.type = 'Checklist';

      query.addedById = ObjectId(req.identity.id);
      db.collection('transactiondata')
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
              from: 'transactions',
              localField: 'transaction',
              foreignField: '_id',
              as: 'transactions',
            },
          },
          {
            $unwind: {
              path: '$transactions',
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
              transactionId: '$transaction',
              sharing_setting: '$sharing_setting',
              days: '$days',
              date: '$date',
              time: '$time',
              value: '$value',
              dayType: '$dayType',
              timing: '$timing',
              addedBy: '$addedBy',
              referenceDate: '$referenceDate',
              addedById: '$addedBy._id',
              type: '$type',
              status: '$status',
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
          db.collection('transactiondata')
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
                  from: 'transactions',
                  localField: 'transaction',
                  foreignField: '_id',
                  as: 'transactions',
                },
              },
              {
                $unwind: {
                  path: '$transactions',
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
                  as: 'reminderCount',
                },
              },
              {
                $addFields: {
                  reminderCount: { $size: '$reminderCount' }, // Calculating total of reminders of particular task
                },
              },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  template: '$template',
                  transactionId: '$transaction',
                  instructions: '$instructions',
                  owner: '$owner',
                  sharing_setting: '$sharing_setting',
                  days: '$days',
                  date: '$date',
                  time: '$time',
                  value: '$value',
                  dayType: '$dayType',
                  timing: '$timing',
                  referenceDate: '$referenceDate',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  type: '$type',
                  status: '$status',
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount: '$reminderCount',
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

  getAllChecklists: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      var myTransaction = req.param('myTransaction');

      var open = req.param('open');
      // var transactionId = req.param('transactionId')
      // var type = req.param('type')
      var query = {};

      if (myTransaction == true || myTransaction == 'true') {
        query.addedBy = req.identity.id;
      } else {
        var transactionArray = [];
        var contacts = await Contacts.find({
          user_id: req.identity.id,
          isDeleted: false,
        });
        if (contacts) {
          for await (var val of contacts) {
            transactionArray.push(ObjectId(val.transaction));
          }
        }

        const myUsers = await Users.find({
          addedBy: req.identity.id,
          isDeleted: false,
        });
        var transUsers = [req.identity.id];
        if (myUsers && myUsers.length > 0) {
          for await (let user of myUsers) {
            transUsers.push(user.id);
          }
        }
        const myTransactions = await Transactions.find({
          addedBy: { in: transUsers },
        });
        if (myTransactions && myTransactions.length > 0) {
          for await (var transaction of myTransactions) {
            transactionArray.push(ObjectId(transaction.id));
          }
        }
        query.transactionId = { $in: transactionArray };
      }

      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 100000000000;
      }
      var skipNo = (page - 1) * count;
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
        sortquery = { date: 1 };
      }

      // if (isDeleted) {
      //   if (isDeleted === 'true') {
      //     isDeleted = true;
      //   } else {
      //     isDeleted = false;
      //   }
      //   query.isDeleted = isDeleted;
      // }

      query.isDeleted = false;

      query.type = 'Checklist';

      if (open && (open == true || open == 'true')) {
        query.status = 'open';
      }

      query.transactionStatus = { $in: ['active', 'progress'] };
      query.transactionDeleteStatus = false;
      //query.addedById = ObjectId(req.identity.id)

      // console.log(query)
      db.collection('transactiondata')
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
              from: 'transactions',
              localField: 'transaction',
              foreignField: '_id',
              as: 'transactions',
            },
          },
          {
            $unwind: {
              path: '$transactions',
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
              transactionId: '$transaction',
              sharing_setting: '$sharing_setting',
              days: '$days',
              date: '$date',
              emailTemplate: '$emailTemplate',
              transactions: '$transactions',
              transactionStatus: '$transactions.status',
              transactionDeleteStatus: '$transactions.isDeleted',
              routes: '$transactions.route',

              time: '$time',
              value: '$value',
              dayType: '$dayType',
              timing: '$timing',
              addedBy: '$addedBy',
              referenceDate: '$referenceDate',
              addedById: '$addedBy._id',
              type: '$type',
              status: '$status',
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
          // return res.send(totalResult)
          if (err) {
            console.log(err);
            return res.status(400).json({
              success: false,
              error: {
                code: 400,
                error: '' + err,
              },
            });
          }
          db.collection('transactiondata')
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
                  from: 'transactions',
                  localField: 'transaction',
                  foreignField: '_id',
                  as: 'transactions',
                },
              },
              {
                $unwind: {
                  path: '$transactions',
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
                  as: 'reminderCount',
                },
              },
              {
                $addFields: {
                  reminderCount: { $size: '$reminderCount' }, // Calculating total of reminders of particular task
                },
              },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  template: '$template',
                  transactionId: '$transaction',
                  instructions: '$instructions',
                  owner: '$owner',
                  sharing_setting: '$sharing_setting',
                  days: '$days',

                  date: {
                    $dateFromString: {
                      dateString: '$date',
                      onError: 'null',
                    },
                  },
                  emailTemplate: '$emailTemplate',
                  transactions: '$transactions',
                  transactionStatus: '$transactions.status',
                  transactionDeleteStatus: '$transactions.isDeleted',
                  routes: '$transactions.route',

                  time: '$time',
                  value: '$value',
                  dayType: '$dayType',
                  timing: '$timing',
                  referenceDate: '$referenceDate',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  type: '$type',
                  status: '$status',
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount: '$reminderCount',
                },
              },
              {
                $match: query,
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
            .toArray(async (err, result) => {
              if (err) {
                console.log(err);
                return res.status(400).json({
                  success: false,
                  error: {
                    code: 400,
                    error: '' + err,
                  },
                });
              }
              if (result && result.length > 0 && !sortBy) {
                for await (let data of result) {
                  if (data.date === 'null') {
                    data.date = null;
                  }
                  if (
                    data.date &&
                    data.date != '' &&
                    data.date != null &&
                    data.date != 'null'
                  ) {
                    data.newDateDate = new Date(data.date);
                    data.sort = 0;
                  }
                }
                result.sort((a, b) =>
                  a.newDateDate > b.newDateDate
                    ? 1
                    : b.newDateDate > a.newDateDate
                    ? -1
                    : 0
                );
                for (let data of result) {
                  if (
                    data.status == 'open' &&
                    data.date &&
                    data.date != 'null' &&
                    data.date != null
                  ) {
                    data.sort = 1;
                  }
                  // console.log((data.date == "null"),data.date)
                  if (
                    data.status == 'open' &&
                    (data.date == 'null' || data.date == null)
                  ) {
                    data.sort = 2;
                  }
                  if (
                    data.status == 'skipped' &&
                    data.date &&
                    data.date != 'null' &&
                    data.date != null
                  ) {
                    data.sort = 3;
                  }
                  if (
                    data.status == 'skipped' &&
                    (data.date == 'null' || data.date == null)
                  ) {
                    data.sort = 4;
                  }

                  if (
                    data.status == 'complete' &&
                    data.date &&
                    data.date != 'null' &&
                    data.date != null
                  ) {
                    data.sort = 5;
                  }

                  if (
                    data.status == 'complete' &&
                    (data.date == 'null' || data.date == null)
                  ) {
                    data.sort = 6;
                  }
                }
                result.sort((a, b) =>
                  a.sort > b.sort ? 1 : b.sort > a.sort ? -1 : 0
                );
                slicedArray = result.slice((page - 1) * count, page * count);
                return res.status(200).json({
                  success: true,
                  code: 200,
                  data: slicedArray,
                  total: totalResult.length,
                });
              } else {
                slicedArray = result.slice((page - 1) * count, page * count);
                return res.status(200).json({
                  success: true,
                  code: 200,
                  data: slicedArray,
                  total: totalResult.length,
                });
              }
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

  fetchlistingtype: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      var transactionId = req.param('transactionId');
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
      query.type = { $in: ['Details', 'Dates'] };

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

      // if (isDeleted) {
      //   if (isDeleted === 'true') {
      //     isDeleted = true;
      //   } else {
      //     isDeleted = false;
      //   }
      //   query.isDeleted = isDeleted;
      // }
      // if (type) {
      //   query.type = type
      // }
      // query.transactionId = ObjectId(transactionId);
      // let roles = [{ title: "Admin" },
      // { title: "All Cash Appraiser" },
      // { title: "Appraiser" },
      // { title: "Asbestos Inspector" },
      // { title: "Buyer" },
      // { title: "Buyer Attorney" },
      // { title: "Buyer's Agent" },
      // { title: "Buyer's Coordinator" },
      // { title: "Buying Broker" },
      // { title: "Chimney Inspector" },
      // { title: "Closer" },
      // { title: "Closing Attorney" },
      // { title: "Co-List agent" },
      // { title: "Coastal Feature Inspector" },
      // { title: "Crawl Space Inspector" },
      // { title: "Deeds Restrictions and Zoning Inspector" },
      // { title: "Drywall Inspector" },
      // { title: "Electric Inspector" },
      // { title: "Environmental Site Assessor" },
      // { title: "Escrow Agent" },
      // { title: "Escrow Title Rep" },
      // { title: "Escrowee" },
      // { title: "Flood Insurance Provider" },
      // { title: "Flood Plain Zone Determination Inspector" },
      // { title: "Gas Inspector" },
      // { title: "Ground Water Inspector" },
      // { title: "Hazardous Substance Inspector" },
      // { title: "HOA" },
      // { title: "Home Improvement Provider" },
      // { title: "Home Inspector" },
      // { title: "Home Inspector Company" },
      // { title: "Home Insurance Provider" },
      // { title: "Home Security Provider" },
      // { title: "Home Warranty Provider" },
      // { title: "HVAC Inspector" },
      // { title: "Inspector" },
      // { title: "Land Insurance Provider" },
      // { title: "Landlord" },
      // { title: "Lawn Care/Landscape Provider" },
      // { title: "Lawn Irrigation System Provider" },
      // { title: "Lead Contamination Inspector" },
      // { title: "Lead Inspector" },
      // { title: "Lender" },
      // { title: "Lender First Name" },
      // { title: "Lender Full Name" },
      // { title: "Lender Company" },
      // { title: "Lender Phone" },
      // { title: "Lender Email" },

      // { title: "Property Full Address" },
      // { title: "Listing Agent Assistant" },
      // { title: "Listing Agent Office Manager" },
      // { title: "Listing Broker" },
      // { title: "Listing Broker First Name" },
      // { title: "Listing Broker Full Name" },
      // { title: "Loan Officer" },
      // { title: "Loan Officer Assistant" },
      // { title: "Loans Processor" },
      // { title: "Locksmith" },
      // { title: "Managing Broker" },
      // { title: "Mechanical Inspector" },
      // { title: "Meth Inspector" },
      // { title: "Mold Inspector" },
      // { title: "Moving and Storage" },
      // { title: "Municipality Building Inspector" },
      // { title: "Nonrefundable Deposit" },
      // { title: "Operations Manager" },
      // { title: "Other" },
      // { title: "OWTS Design Approval" },
      // { title: "Paralegal" },
      // { title: "Percolation Inspector" },
      // { title: "Pest Inspector" },
      // { title: "Photographer" },
      // { title: "Pool Inspector" },
      // { title: "Pre-Closer" },
      // { title: "Production assistant" },
      // { title: "Property Manager" },
      // { title: "Radon Inspector" },
      // { title: "Ribbon Representative" },
      // { title: "Roof Inspector" },
      // { title: "Seller" },
      // { title: "Seller Attorney" },
      // { title: "Seller's Agent" },
      // { title: "Seller First Name" },
      // { title: "Seller's Agent Full Name " },
      // { title: "Seller's Agent First Name" },
      // { title: "Seller's Coordinator Full Name" },
      // { title: "Seller's Coordinator" },
      // { title: "Septic Inspector" },
      // { title: "Service Provider" },
      // { title: "Settlement" },
      // { title: "Sewer Lateral Inspector" },
      // { title: "Sewer Scope Inspector" },
      // { title: "Sewer System Inspector" },
      // { title: "Smoke Detector Compliance" },
      // { title: "Structural Inspector" },
      // { title: "Stucco Inspector" },
      // { title: "Surveyor" },
      // { title: "Tenant" },
      // { title: "Tenant Agent" },
      // { title: "Termite Inspector" },
      // { title: "Third Part Requirements" },
      // { title: "Title Agent" },
      // { title: "Transaction Coordinator" },
      // { title: "Utilities Provider" },
      // { title: "Water Inspector" },
      // { title: "Well Inspector" },
      // { title: "Well Water Inspector" },
      // { title: "Wetlands Determination Inspector" },
      // { title: "Wind Mitigation Inspector" },
      // { title: "Wood Destroying Insects Inspector" },
      // { "title": "WoodPecker Surveyor" },

      // { "title": "1st Mortgage Balance" },
      // { "title": "2nd Mortgage Balance" },
      // { "title": "4 Point Inspector Company" },
      // { "title": "4 Point Inspector Email" },
      // { "title": "4 Point Inspector First Name" },
      // { "title": "4 Point Inspector Full Name" },
      // { "title": "4 Point Inspector Last Name" },
      // { "title": "4 Point Inspector Phone" },
      // { "title": "Acceptance Date (date)" },
      // { "title": "Acceptance Date (time)" },
      // { "title": "Actual Closing Date (date)" },
      // { "title": "Actual Closing Date (time)" },
      // // { "title": "add Company" },
      // // { "title": "add Email" },
      // // { "title": "add First Name" },
      // // { "title": "add Full Name" },
      // // { "title": "add Last Name" },
      // // { "title": "add Phone" },
      // { "title": "Addition" },
      // { "title": "Additional Binder Deposit Due Date (date)" },
      // { "title": "Additional Binder Deposit Due Date (time)" },
      // { "title": "Additional Deposit Due Date (date)" },
      // { "title": "Additional Deposit Due Date (time)" },
      // { "title": "Admin Company" },
      // { "title": "Admin Email" },
      // { "title": "Admin First Name" },
      // { "title": "Admin Full Name" },
      // { "title": "Admin Last Name" },
      // { "title": "Admin Phone" },
      // { "title": "All Cash Appraiser Company" },
      // { "title": "All Cash Appraiser Email" },
      // { "title": "All Cash Appraiser First Name" },
      // { "title": "All Cash Appraiser Full Name" },
      // { "title": "All Cash Appraiser Last Name" },
      // { "title": "All Cash Appraiser Phone" },
      // { "title": "Anticipated Close Date (date)" },
      // { "title": "Anticipated Close Date (time)" },
      // { "title": "Appraisal Contingency Due Date (date)" },
      // { "title": "Appraisal Contingency Due Date (time)" },
      // { "title": "Appraisal Contingency Removal (date)" },
      // { "title": "Appraisal Contingency Removal (time)" },
      // { "title": "Appraisal Date (date)" },
      // { "title": "Appraisal Date (time)" },
      // { "title": "Appraisal Deadline (date)" },
      // { "title": "Appraisal Deadline (time)" },
      // { "title": "Appraisal Due Date (date)" },
      // { "title": "Appraisal Due Date (time)" },
      // { "title": "Appraisal Negotiation Period Due Date (date)" },
      // { "title": "Appraisal Negotiation Period Due Date (time)" },
      // { "title": "Appraisal Objection Deadline (date)" },
      // { "title": "Appraisal Objection Deadline (time)" },
      // { "title": "Appraisal Report Due Date (date)" },
      // { "title": "Appraisal Report Due Date (time)" },
      // { "title": "Appraisal Resolution Deadline (date)" },
      // { "title": "Appraisal Resolution Deadline (time)" },
      // { "title": "Appraiser Company" },
      // { "title": "Appraiser Email" },
      // { "title": "Appraiser First Name" },
      // { "title": "Appraiser Full Name" },
      // { "title": "Appraiser Last Name" },
      // { "title": "Appraiser Phone" },
      // { "title": "Approval of Financing Due Date (date)" },
      // { "title": "Approval of Financing Due Date (time)" },
      // { "title": "Asbestos Inspection Due Date (date)" },
      // { "title": "Asbestos Inspection Due Date (time)" },
      // { "title": "Asbestos Inspector Company" },
      // { "title": "Asbestos Inspector Email" },
      // { "title": "Asbestos Inspector First Name" },
      // { "title": "Asbestos Inspector Full Name" },
      // { "title": "Asbestos Inspector Last Name" },
      // { "title": "Asbestos Inspector Phone" },
      // { "title": "Association Documents Deadline (date)" },
      // { "title": "Association Documents Deadline (time)" },
      // { "title": "Association Documents Objection Deadline (date)" },
      // { "title": "Association Documents Objection Deadline (time)" },
      // { "title": "Association Transfer Package Due Date (date)" },
      // { "title": "Association Transfer Package Due Date (time)" },
      // { "title": "Attorney Approval Period End Date (date)" },
      // { "title": "Attorney Approval Period End Date (time)" },
      // { "title": "Bathrooms" },
      // { "title": "Bedrooms" },
      // { "title": "Binder Deposit Due Date (date)" },
      // { "title": "Binder Deposit Due Date (time)" },
      // { "title": "Binding Agreement Date (date)" },
      // { "title": "Binding Agreement Date (time)" },
      // { "title": "Block" },
      // { "title": "Brochures in Sign Box (date)" },
      // { "title": "Brochures in Sign Box (time)" },
      // { "title": "Buyer Attorney Company" },
      // { "title": "Buyer Attorney Email" },
      // { "title": "Buyer Attorney First Name" },
      // { "title": "Buyer Attorney Full Name" },
      // { "title": "Buyer Attorney Last Name" },
      // { "title": "Buyer Attorney Phone" },
      // { "title": "Buyer Company" },
      // { "title": "Buyer Email" },
      // { "title": "Buyer First Name" },
      // { "title": "Buyer Full Name" },
      // { "title": "Buyer Last Name" },
      // { "title": "Buyer Phone" },
      // { "title": "Buyer Repairs Acceptance Deadline (date)" },
      // { "title": "Buyer Repairs Acceptance Deadline (time)" },
      // { "title": "Buyer Termination Due Date (date)" },
      // { "title": "Buyer Termination Due Date (time)" },
      // { "title": "Buyer to Approve Income and Expense Docs (date)" },
      // { "title": "Buyer to Approve Income and Expense Docs (time)" },
      // { "title": "Buyer to Deliver Signed Seller Disclosure (date)" },
      // { "title": "Buyer to Deliver Signed Seller Disclosure (time)" },
      // { "title": "Buyer to Order Preliminary Title Report (date)" },
      // { "title": "Buyer to Order Preliminary Title Report (time)" },
      // { "title": "Buyer to Remove Rental Contingency (date)" },
      // { "title": "Buyer to Remove Rental Contingency (time)" },
      // { "title": "Buyer to Review HOA Docs (date)" },
      // { "title": "Buyer to Review HOA Docs (time)" },
      // { "title": "Buyer to Review Seller Disclosures (date)" },
      // { "title": "Buyer to Review Seller Disclosures (time)" },
      // { "title": "Buyer's Agent Company" },
      // { "title": "Buyer's Agent Email" },
      // { "title": "Buyer's Agent First Name" },
      // { "title": "Buyer's Agent Full Name" },
      // { "title": "Buyer's Agent Last Name" },
      // { "title": "Buyer's Agent Phone" },
      // { "title": "Buyer's Coordinator Company" },
      // { "title": "Buyer's Coordinator Email" },
      // { "title": "Buyer's Coordinator First Name" },
      // { "title": "Buyer's Coordinator Full Name" },
      // { "title": "Buyer's Coordinator Last Name" },
      // { "title": "Buyer's Coordinator Phone" },
      // { "title": "Buyer's Investigation Period (date)" },
      // { "title": "Buyer's Investigation Period (time)" },
      // { "title": "Buyer's Lead Based Paint Inspection Due Date (date)" },
      // { "title": "Buyer's Lead Based Paint Inspection Due Date (time)" },
      // { "title": "Buyer's Response to Seller's Delivery of Proposal (date)" },
      // { "title": "Buyer's Response to Seller's Delivery of Proposal (time)" },
      // { "title": "Buyers Notice to Seller of Appraised Value (date)" },
      // { "title": "Buyers Notice to Seller of Appraised Value (time)" },
      // { "title": "Buyers Repair Acceptance Due Date (date)" },
      // { "title": "Buyers Repair Acceptance Due Date (time)" },
      // { "title": "Buyers Response To Request For Loan Information (date)" },
      // { "title": "Buyers Response To Request For Loan Information (time)" },
      // { "title": "Buying Broker Company" },
      // { "title": "Buying Broker Email" },
      // { "title": "Buying Broker First Name" },
      // { "title": "Buying Broker Full Name" },
      // { "title": "Buying Broker Last Name" },
      // { "title": "Buying Broker Phone" },
      // { "title": "Carolina Inspectors" },
      // { "title": "CCRs Delivery Deadline (date)" },
      // { "title": "CCRs Delivery Deadline (time)" },
      // { "title": "CCRs Objection Deadline (date)" },
      // { "title": "CCRs Objection Deadline (time)" },
      // { "title": "CCRs Resolution Deadline (date)" },
      // { "title": "CCRs Resolution Deadline (time)" },
      // // { "title": "check (date)" },
      // // { "title": "check (time)" },
      // { "title": "Checklist detail" },
      // { "title": "Chimney Inspection Due Date (date)" },
      // { "title": "Chimney Inspection Due Date (time)" },
      // { "title": "Chimney Inspector Company" },
      // { "title": "Chimney Inspector Email" },
      // { "title": "Chimney Inspector First Name" },
      // { "title": "Chimney Inspector Full Name" },
      // { "title": "Chimney Inspector Last Name" },
      // { "title": "Chimney Inspector Phone" },
      // { "title": "CL100 Due Date (date)" },
      // { "title": "CL100 Due Date (time)" },
      // // { "title": "Class" },
      // { "title": "Close Of Escrow (date)" },
      // { "title": "Close Of Escrow (time)" },
      // { "title": "Closer Company" },
      // { "title": "Closer Email" },
      // { "title": "Closer First Name" },
      // { "title": "Closer Full Name" },
      // { "title": "Closer Last Name" },
      // { "title": "Closer Phone" },
      // { "title": "Closing Attorney" },
      // { "title": "Closing Attorney Address" },
      // { "title": "Closing Attorney Company" },
      // { "title": "Closing Attorney Email" },
      // { "title": "Closing Attorney First Name" },
      // { "title": "Closing Attorney Full Name" },
      // { "title": "Closing Attorney Last Name" },
      // { "title": "Closing Attorney Phone" },
      // { "title": "Closing Date (date)" },
      // { "title": "Closing Date (time)" },
      // { "title": "Closing Notice Date (date)" },
      // { "title": "Closing Notice Date (time)" },
      // { "title": "Co-List agent Company" },
      // { "title": "Co-List agent Email" },
      // { "title": "Co-List agent First Name" },
      // { "title": "Co-List agent Full Name" },
      // { "title": "Co-List agent Last Name" },
      // { "title": "Co-List agent Phone" },
      // { "title": "Coastal Feature Inspection Due Date (date)" },
      // { "title": "Coastal Feature Inspection Due Date (time)" },
      // { "title": "Coastal Feature Inspector Company" },
      // { "title": "Coastal Feature Inspector Email" },
      // { "title": "Coastal Feature Inspector First Name" },
      // { "title": "Coastal Feature Inspector Full Name" },
      // { "title": "Coastal Feature Inspector Last Name" },
      // { "title": "Coastal Feature Inspector Phone" },
      // { "title": "Commission" },
      // { "title": "Commission - Buy Side" },
      // { "title": "Commission - Sell Side" },
      // { "title": "Common Interest Document Due Date (date)" },
      // { "title": "Common Interest Document Due Date (time)" },
      // { "title": "Completion Date (Estimated until Finalized) (date)" },
      // { "title": "Completion Date (Estimated until Finalized) (time)" },
      // { "title": "Conditional Sale Deadline (date)" },
      // { "title": "Conditional Sale Deadline (time)" },
      // { "title": "Construction Type" },
      // { "title": "Contingent on Financing Due Date (date)" },
      // { "title": "Contingent on Financing Due Date (time)" },
      // { "title": "Contingent on Inspection (date)" },
      // { "title": "Contingent on Inspection (time)" },
      // { "title": "Contingent on Sale Due Date (date)" },
      // { "title": "Contingent on Sale Due Date (time)" },
      // { "title": "Contract Acceptance Date (date)" },
      // { "title": "Contract Acceptance Date (time)" },
      // { "title": "Contract Type" },
      // { "title": "Coordination Transaction Fee" },
      // { "title": "County" },
      // { "title": "Crawl Space Inspection (date)" },
      // { "title": "Crawl Space Inspection (time)" },
      // { "title": "Crawl Space Inspector Company" },
      // { "title": "Crawl Space Inspector Email" },
      // { "title": "Crawl Space Inspector First Name" },
      // { "title": "Crawl Space Inspector Full Name" },
      // { "title": "Crawl Space Inspector Last Name" },
      // { "title": "Crawl Space Inspector Phone" },
      // { "title": "Current Price" },
      // { "title": "Current Year" },
      // { "title": "Date of Possession (date)" },
      // { "title": "Date of Possession (time)" },
      // { "title": "date queston (date)" },
      // { "title": "date queston (time)" },
      // { "title": "Days to Apply for Mortgage (date)" },
      // { "title": "Days to Apply for Mortgage (time)" },
      // { "title": "Deadline for Buyer's Review of CC&Rs (date)" },
      // { "title": "Deadline for Buyer's Review of CC&Rs (time)" },
      // { "title": "Deed Book" },
      // { "title": "Deed Page" },
      // { "title": "Deeds Restrictions and Zoning Inspector Company" },
      // { "title": "Deeds Restrictions and Zoning Inspector Email" },
      // { "title": "Deeds Restrictions and Zoning Inspector First Name" },
      // { "title": "Deeds Restrictions and Zoning Inspector Full Name" },
      // { "title": "Deeds Restrictions and Zoning Inspector Last Name" },
      // { "title": "Deeds Restrictions and Zoning Inspector Phone" },
      // { "title": "Description of Other Liens" },
      // { "title": "Detail Question" },
      // { "title": "Drywall Inspection Due Date (date)" },
      // { "title": "Drywall Inspection Due Date (time)" },
      // { "title": "Drywall Inspector Company" },
      // { "title": "Drywall Inspector Email" },
      // { "title": "Drywall Inspector First Name" },
      // { "title": "Drywall Inspector Full Name" },
      // { "title": "Drywall Inspector Last Name" },
      // { "title": "Drywall Inspector Phone" },
      // { "title": "Due Diligence Documents Delivery Deadline (date)" },
      // { "title": "Due Diligence Documents Delivery Deadline (time)" },
      // { "title": "Due Diligence Documents Delivery Objection Deadline (date)" },
      // { "title": "Due Diligence Documents Delivery Objection Deadline (time)" },
      // { "title": "Due Diligence Documents Resolution Deadline (date)" },
      // { "title": "Due Diligence Documents Resolution Deadline (time)" },
      // { "title": "Due Diligence End Date (date)" },
      // { "title": "Due Diligence End Date (time)" },
      // { "title": "Due Diligence Money Amount" },
      // { "title": "Due Diligence Money Due Date (date)" },
      // { "title": "Due Diligence Money Due Date (time)" },
      // { "title": "Earnest Money Amount" },
      // { "title": "Earnest Money Deposited Due Date (date)" },
      // { "title": "Earnest Money Deposited Due Date (time)" },
      // { "title": "Earnest Money Due Date (date)" },
      // { "title": "Earnest Money Due Date (time)" },
      // { "title": "Earnest Money Holder" },
      // { "title": "Earnest Money/ Due Diligence Due Date (date)" },
      // { "title": "Earnest Money/ Due Diligence Due Date (time)" },
      // { "title": "Effective Date (date)" },
      // { "title": "Effective Date (time)" },
      // { "title": "Electric Inspector Company" },
      // { "title": "Electric Inspector Email" },
      // { "title": "Electric Inspector First Name" },
      // { "title": "Electric Inspector Full Name" },
      // { "title": "Electric Inspector Last Name" },
      // { "title": "Electric Inspector Phone" },
      // { "title": "Environmental Site Assessment Due Date (date)" },
      // { "title": "Environmental Site Assessment Due Date (time)" },
      // { "title": "Environmental Site Assessor Company" },
      // { "title": "Environmental Site Assessor Email" },
      // { "title": "Environmental Site Assessor First Name" },
      // { "title": "Environmental Site Assessor Full Name" },
      // { "title": "Environmental Site Assessor Last Name" },
      // { "title": "Environmental Site Assessor Phone" },
      // { "title": "Escrow Agent Company" },
      // { "title": "Escrow Agent Email" },
      // { "title": "Escrow Agent First Name" },
      // { "title": "Escrow Agent Full Name" },
      // { "title": "Escrow Agent Last Name" },
      // { "title": "Escrow Agent Phone" },
      // { "title": "Escrow Closing Date (date)" },
      // { "title": "Escrow Closing Date (time)" },
      // { "title": "Escrow Due Date (date)" },
      // { "title": "Escrow Due Date (time)" },
      // { "title": "Escrow Instructions Due Date (date)" },
      // { "title": "Escrow Instructions Due Date (time)" },
      // { "title": "Escrow Number" },
      // { "title": "Escrow Title Rep Company" },
      // { "title": "Escrow Title Rep Email" },
      // { "title": "Escrow Title Rep First Name" },
      // { "title": "Escrow Title Rep Full Name" },
      // { "title": "Escrow Title Rep Last Name" },
      // { "title": "Escrow Title Rep Phone" },
      // { "title": "Escrowee Company" },
      // { "title": "Escrowee Email" },
      // { "title": "Escrowee First Name" },
      // { "title": "Escrowee Full Name" },
      // { "title": "Escrowee Last Name" },
      // { "title": "Escrowee Phone" },
      // { "title": "Executed Contract Date (date)" },
      // { "title": "Executed Contract Date (time)" },
      // { "title": "Execution Date (date)" },
      // { "title": "Execution Date (time)" },
      // { "title": "Existing Loan Documents Deadline (date)" },
      // { "title": "Existing Loan Documents Deadline (time)" },
      // { "title": "Existing Loan Documents Objection Deadline (date)" },
      // { "title": "Existing Loan Documents Objection Deadline (time)" },
      // { "title": "fdf (date)" },
      // { "title": "fdf (time)" },
      // { "title": "Feasibility Study Deadline (date)" },
      // { "title": "Feasibility Study Deadline (time)" },
      // { "title": "FHA Inspection Delivery Deadline (date)" },
      // { "title": "FHA Inspection Delivery Deadline (time)" },
      // { "title": "FHA Inspection Objection Deadline (date)" },
      // { "title": "FHA Inspection Objection Deadline (time)" },
      // { "title": "FHA Inspection Resolution Deadline (date)" },
      // { "title": "FHA Inspection Resolution Deadline (time)" },
      // { "title": "Final Earnest Money Due Date (date)" },
      // { "title": "Final Earnest Money Due Date (time)" },
      // { "title": "Final Walkthrough Date (date)" },
      // { "title": "Final Walkthrough Date (time)" },
      // { "title": "Financing and Appraisal Due Date (date)" },
      // { "title": "Financing and Appraisal Due Date (time)" },
      // { "title": "Financing Contingency (date)" },
      // { "title": "Financing Contingency (time)" },
      // { "title": "Financing Deadline (date)" },
      // { "title": "Financing Deadline (time)" },
      // { "title": "First Commitment Date (date)" },
      // { "title": "First Commitment Date (time)" },
      // { "title": "First Earnest Money Deposit Due Date (date)" },
      // { "title": "First Earnest Money Deposit Due Date (time)" },
      // { "title": "First Walkthrough Deadline (date)" },
      // { "title": "First Walkthrough Deadline (time)" },
      // { "title": "Flood Insurance Provider Company" },
      // { "title": "Flood Insurance Provider Email" },
      // { "title": "Flood Insurance Provider First Name" },
      // { "title": "Flood Insurance Provider Full Name" },
      // { "title": "Flood Insurance Provider Last Name" },
      // { "title": "Flood Insurance Provider Phone" },
      // { "title": "Flood Plain Zone Determination Inspector Company" },
      // { "title": "Flood Plain Zone Determination Inspector Email" },
      // { "title": "Flood Plain Zone Determination Inspector First Name" },
      // { "title": "Flood Plain Zone Determination Inspector Full Name" },
      // { "title": "Flood Plain Zone Determination Inspector Last Name" },
      // { "title": "Flood Plain Zone Determination Inspector Phone" },
      // { "title": "Flood Plain/Zone Determination Inspection Due Date (date)" },
      // { "title": "Flood Plain/Zone Determination Inspection Due Date (time)" },
      // { "title": "Flood Zone/Elevation Determination Deadline (date)" },
      // { "title": "Flood Zone/Elevation Determination Deadline (time)" },
      // // {"title":"for checking Company"},
      // // {"title":"for checking Email"},
      // // {"title":"for checking First Name"},
      // // {"title":"for checking Full Name"},
      // // {"title":"for checking Last Name"},
      // // {"title":"for checking Phone"},
      // { "title": "Foundation Installation Delivery Deadline (date)" },
      // { "title": "Foundation Installation Delivery Deadline (time)" },
      // { "title": "Foundation Installation Delivery Objection Deadline (date)" },
      // { "title": "Foundation Installation Delivery Objection Deadline (time)" },
      // { "title": "Foundation Installation Resolution Deadline (date)" },
      // { "title": "Foundation Installation Resolution Deadline (time)" },
      // { "title": "Funding Date (date)" },
      // { "title": "Funding Date (time)" },
      // { "title": "Gas Inspection Due Date (date)" },
      // { "title": "Gas Inspection Due Date (time)" },
      // { "title": "Gas Inspector Company" },
      // { "title": "Gas Inspector Email" },
      // { "title": "Gas Inspector First Name" },
      // { "title": "Gas Inspector Full Name" },
      // { "title": "Gas Inspector Last Name" },
      // { "title": "Gas Inspector Phone" },
      // // {"title":"gggg (date)"},
      // // {"title":"gggg (time)"},
      // { "title": "Governmental/Occupancy Inspections Deadline (date)" },
      // { "title": "Governmental/Occupancy Inspections Deadline (time)" },
      // { "title": "Ground Water Inspection Due Date (date)" },
      // { "title": "Ground Water Inspection Due Date (time)" },
      // { "title": "Ground Water Inspector Company" },
      // { "title": "Ground Water Inspector Email" },
      // { "title": "Ground Water Inspector First Name" },
      // { "title": "Ground Water Inspector Full Name" },
      // { "title": "Ground Water Inspector Last Name" },
      // { "title": "Ground Water Inspector Phone" },
      // { "title": "Hazardous Substance Inspector Company" },
      // { "title": "Hazardous Substance Inspector Email" },
      // { "title": "Hazardous Substance Inspector First Name" },
      // { "title": "Hazardous Substance Inspector Full Name" },
      // { "title": "Hazardous Substance Inspector Last Name" },
      // { "title": "Hazardous Substance Inspector Phone" },
      // { "title": "Hazardous Substances Inspection Due Date (date)" },
      // { "title": "Hazardous Substances Inspection Due Date (time)" },
      // { "title": "HOA Company" },
      // { "title": "HOA Disapproval Due Date (date)" },
      // { "title": "HOA Disapproval Due Date (time)" },
      // { "title": "HOA Disclosure Delivery Deadline (date)" },
      // { "title": "HOA Disclosure Delivery Deadline (time)" },
      // { "title": "HOA Disclosure Objection Deadline (date)" },
      // { "title": "HOA Disclosure Objection Deadline (time)" },
      // { "title": "HOA Disclosure Resolution Deadline (date)" },
      // { "title": "HOA Disclosure Resolution Deadline (time)" },
      // { "title": "HOA Docs Due Date (date)" },
      // { "title": "HOA Docs Due Date (time)" },
      // { "title": "HOA Documents Delivery Deadline (date)" },
      // { "title": "HOA Documents Delivery Deadline (time)" },
      // { "title": "HOA Documents Objection Deadline (date)" },
      // { "title": "HOA Documents Objection Deadline (time)" },
      // { "title": "HOA Documents Resolution Deadline (date)" },
      // { "title": "HOA Documents Resolution Deadline (time)" },
      // { "title": "HOA Email" },
      // { "title": "HOA First Name" },
      // { "title": "HOA Full Name" },
      // { "title": "HOA Last Name" },
      // { "title": "HOA Phone" },
      // { "title": "HOA Required" },
      // { "title": "HOA Review Period (date)" },
      // { "title": "HOA Review Period (time)" },
      // { "title": "Holding Deposit Check Deadline (date)" },
      // { "title": "Holding Deposit Check Deadline (time)" },
      // { "title": "Home Improvement Provider Company" },
      // { "title": "Home Improvement Provider Email" },
      // { "title": "Home Improvement Provider First Name" },
      // { "title": "Home Improvement Provider Full Name" },
      // { "title": "Home Improvement Provider Last Name" },
      // { "title": "Home Improvement Provider Phone" },
      // { "title": "Home Inspection Company" },
      // { "title": "Home Inspection Date (date)" },
      // { "title": "Home Inspection Date (time)" },
      // { "title": "Home Inspection Due Date (date)" },
      // { "title": "Home Inspection Due Date (time)" },
      // { "title": "Home Inspector" },
      // { "title": "Home Inspection" },

      // { "title": "Home Inspector Company" },
      // { "title": "Home Inspector Company Company" },
      // { "title": "Home Inspector Company Email" },
      // { "title": "Home Inspector Company First Name" },
      // { "title": "Home Inspector Company Full Name" },
      // { "title": "Home Inspector Company Last Name" },
      // { "title": "Home Inspector Company Phone" },
      // { "title": "Home Inspector Email" },
      // { "title": "Home Inspector First Name" },
      // { "title": "Home Inspector Full Name" },
      // { "title": "Home Inspector Last Name" },
      // { "title": "Home Inspector Phone" },
      // { "title": "Home Insurance Commitment Deadline (date)" },
      // { "title": "Home Insurance Commitment Deadline (time)" },
      // { "title": "Home Insurance Provider Company" },
      // { "title": "Home Insurance Provider Email" },
      // { "title": "Home Insurance Provider First Name" },
      // { "title": "Home Insurance Provider Full Name" },
      // { "title": "Home Insurance Provider Last Name" },
      // { "title": "Home Insurance Provider Phone" },
      // { "title": "Home Security Provider Company" },
      // { "title": "Home Security Provider Email" },
      // { "title": "Home Security Provider First Name" },
      // { "title": "Home Security Provider Full Name" },
      // { "title": "Home Security Provider Last Name" },
      // { "title": "Home Security Provider Phone" },
      // { "title": "Home Warranty Due Date (date)" },
      // { "title": "Home Warranty Due Date (time)" },
      // { "title": "Home Warranty Provider Company" },
      // { "title": "Home Warranty Provider Email" },
      // { "title": "Home Warranty Provider First Name" },
      // { "title": "Home Warranty Provider Full Name" },
      // { "title": "Home Warranty Provider Last Name" },
      // { "title": "Home Warranty Provider Phone" },
      // { "title": "Homeowner's Association" },
      // { "title": "Homeowner's Association Dues" },
      // { "title": "HVAC Inspection Due Date (date)" },
      // { "title": "HVAC Inspection Due Date (time)" },
      // { "title": "HVAC Inspector Company" },
      // { "title": "HVAC Inspector Email" },
      // { "title": "HVAC Inspector First Name" },
      // { "title": "HVAC Inspector Full Name" },
      // { "title": "HVAC Inspector Last Name" },
      // { "title": "HVAC Inspector Phone" },
      // { "title": "Initial Deposit Due Date (date)" },
      // { "title": "Initial Deposit Due Date (time)" },
      // { "title": "Initial Earnest Money Deposit Due Date (date)" },
      // { "title": "Initial Earnest Money Deposit Due Date (time)" },
      // { "title": "Initial Inspection Period (date)" },
      // { "title": "Initial Inspection Period (time)" },
      // { "title": "Inspection Contingency Date (date)" },
      // { "title": "Inspection Contingency Date (time)" },
      // { "title": "Inspection Deadline (date)" },
      // { "title": "Inspection Deadline (time)" },
      // { "title": "Inspection Due Date (date)" },
      // { "title": "Inspection Due Date (time)" },
      // { "title": "Inspection Objection Deadline (21.F.ii) (date)" },
      // { "title": "Inspection Objection Deadline (21.F.ii) (time)" },
      // { "title": "Inspection Period Due Date (date)" },
      // { "title": "Inspection Period Due Date (time)" },
      // { "title": "Inspection Resolution Deadline (21.F.iii) (date)" },
      // { "title": "Inspection Resolution Deadline (21.F.iii) (time)" },
      // { "title": "Inspections Contingency Deadline (date)" },
      // { "title": "Inspections Contingency Deadline (time)" },
      // { "title": "Inspector Company" },
      // { "title": "Inspector Email" },
      // { "title": "Inspector First Name" },
      // { "title": "Inspector Full Name" },
      // { "title": "Inspector Last Name" },
      // { "title": "Inspector Phone" },
      // { "title": "Insurability Notification Deadline (date)" },
      // { "title": "Insurability Notification Deadline (time)" },
      // { "title": "Insurance Application Deadline (date)" },
      // { "title": "Insurance Application Deadline (time)" },
      // { "title": "intro (date)" },
      // { "title": "intro (time)" },
      // { "title": "Kids Birthday (date)" },
      // { "title": "Kids Birthday (time)" },
      // { "title": "Kids Name" },
      // { "title": "Kitsap County Maintenance Records Due Date (date)" },
      // { "title": "Kitsap County Maintenance Records Due Date (time)" },
      // { "title": "Land Insurance Provider Company" },
      // { "title": "Land Insurance Provider Email" },
      // { "title": "Land Insurance Provider First Name" },
      // { "title": "Land Insurance Provider Full Name" },
      // { "title": "Land Insurance Provider Last Name" },
      // { "title": "Land Insurance Provider Phone" },
      // { "title": "Landlord Company" },
      // { "title": "Landlord Email" },
      // { "title": "Landlord First Name" },
      // { "title": "Landlord Full Name" },
      // { "title": "Landlord Last Name" },
      // { "title": "Landlord Phone" },
      // { "title": "Lawn Care/Landscape Provider Company" },
      // { "title": "Lawn Care/Landscape Provider Email" },
      // { "title": "Lawn Care/Landscape Provider First Name" },
      // { "title": "Lawn Care/Landscape Provider Full Name" },
      // { "title": "Lawn Care/Landscape Provider Last Name" },
      // { "title": "Lawn Care/Landscape Provider Phone" },
      // { "title": "Lawn Irrigation System Provider Company" },
      // { "title": "Lawn Irrigation System Provider Email" },
      // { "title": "Lawn Irrigation System Provider First Name" },
      // { "title": "Lawn Irrigation System Provider Full Name" },
      // { "title": "Lawn Irrigation System Provider Last Name" },
      // { "title": "Lawn Irrigation System Provider Phone" },
      // { "title": "Lead Based Paint Termination Deadline (date)" },
      // { "title": "Lead Based Paint Termination Deadline (time)" },
      // { "title": "Lead Contamination Inspection Due Date (date)" },
      // { "title": "Lead Contamination Inspection Due Date (time)" },
      // { "title": "Lead Contamination Inspector Company" },
      // { "title": "Lead Contamination Inspector Email" },
      // { "title": "Lead Contamination Inspector First Name" },
      // { "title": "Lead Contamination Inspector Full Name" },
      // { "title": "Lead Contamination Inspector Last Name" },
      // { "title": "Lead Contamination Inspector Phone" },
      // { "title": "Lead Inspector Company" },
      // { "title": "Lead Inspector Email" },
      // { "title": "Lead Inspector First Name" },
      // { "title": "Lead Inspector Full Name" },
      // { "title": "Lead Inspector Last Name" },
      // { "title": "Lead Inspector Phone" },
      // { "title": "Lead-based Paint Disclosure Due Date (date)" },
      // { "title": "Lead-based Paint Disclosure Due Date (time)" },
      // { "title": "Lead-Based Paint Inspection Due Date (date)" },
      // { "title": "Lead-Based Paint Inspection Due Date (time)" },
      // { "title": "Lease Agreements Delivery Deadline (date)" }]

      let roles = [
        { title: 'Admin' },
        { title: 'All Cash Appraiser' },
        { title: '1st Mortgage Balance' },
        { title: '2nd Mortgage Balance' },
        { title: '4 Point Inspector Company' },
        { title: '4 Point Inspector Email' },
        { title: '4 Point Inspector First Name' },
        { title: '4 Point Inspector Full Name' },
        { title: '4 Point Inspector Last Name' },
        { title: '4 Point Inspector Phone' },
        { title: 'Acceptance Date (date)' },
        { title: 'Acceptance Date (time)' },
        { title: 'Actual Closing Date (date)' },
        { title: 'Actual Closing Date (time)' },
        { title: 'add Company' },
        { title: 'add Email' },
        { title: 'add First Name' },
        { title: 'add Full Name' },
        { title: 'add Last Name' },
        { title: 'add Phone' },
        { title: 'Addition' },
        { title: 'Additional Binder Deposit Due Date (date)' },
        { title: 'Additional Binder Deposit Due Date (time)' },
        { title: 'Additional Deposit Due Date (date)' },
        { title: 'Additional Deposit Due Date (time)' },
        { title: 'Admin Company' },
        { title: 'Admin Email' },
        { title: 'Admin First Name' },
        { title: 'Admin Full Name' },
        { title: 'Admin Last Name' },
        { title: 'Admin Phone' },
        { title: 'All Cash Appraiser Company' },
        { title: 'All Cash Appraiser Email' },
        { title: 'All Cash Appraiser First Name' },
        { title: 'All Cash Appraiser Full Name' },
        { title: 'All Cash Appraiser Last Name' },
        { title: 'All Cash Appraiser Phone' },
        // {title:"Anshul (date)"},
        // {title:"Anshul (time)"},
        { title: 'Anticipated Close Date (date)' },
        { title: 'Anticipated Close Date (time)' },
        { title: 'Appraisal Contingency Due Date (date)' },
        { title: 'Appraisal Contingency Due Date (time)' },
        { title: 'Appraisal Contingency Removal (date)' },
        { title: 'Appraisal Contingency Removal (time)' },
        { title: 'Appraisal Date (date)' },
        { title: 'Appraisal Date (time)' },
        { title: 'Appraisal Deadline (date)' },
        { title: 'Appraisal Deadline (time)' },
        { title: 'Appraisal Due Date (date)' },
        { title: 'Appraisal Due Date (time)' },
        { title: 'Appraisal Negotiation Period Due Date (date)' },
        { title: 'Appraisal Negotiation Period Due Date (time)' },
        { title: 'Appraisal Objection Deadline (date)' },
        { title: 'Appraisal Objection Deadline (time)' },
        { title: 'Appraisal Report Due Date (date)' },
        { title: 'Appraisal Report Due Date (time)' },
        { title: 'Appraisal Resolution Deadline (date)' },
        { title: 'Appraisal Resolution Deadline (time)' },
        { title: 'Appraiser Company' },
        { title: 'Appraiser Email' },
        { title: 'Appraiser First Name' },
        { title: 'Appraiser Full Name' },
        { title: 'Appraiser Last Name' },
        { title: 'Appraiser Phone' },
        { title: 'Approval of Financing Due Date (date)' },
        { title: 'Approval of Financing Due Date (time)' },
        { title: 'Asbestos Inspection Due Date (date)' },
        { title: 'Asbestos Inspection Due Date (time)' },
        { title: 'Asbestos Inspector Company' },
        { title: 'Asbestos Inspector Email' },
        { title: 'Asbestos Inspector First Name' },
        { title: 'Asbestos Inspector Full Name' },
        { title: 'Asbestos Inspector Last Name' },
        { title: 'Asbestos Inspector Phone' },
        { title: 'Association Documents Deadline (date)' },
        { title: 'Association Documents Deadline (time)' },
        { title: 'Association Documents Objection Deadline (date)' },
        { title: 'Association Documents Objection Deadline (time)' },
        { title: 'Association Transfer Package Due Date (date)' },
        { title: 'Association Transfer Package Due Date (time)' },
        { title: 'Attorney Approval Period End Date (date)' },
        { title: 'Attorney Approval Period End Date (time)' },
        { title: 'Bathrooms' },
        { title: 'Bedrooms' },
        { title: 'Binder Deposit Due Date (date)' },
        { title: 'Binder Deposit Due Date (time)' },
        { title: 'Binding Agreement Date (date)' },
        { title: 'Binding Agreement Date (time)' },
        { title: 'Block' },
        { title: 'Brochures in Sign Box (date)' },
        { title: 'Brochures in Sign Box (time)' },
        { title: 'Buyer Attorney Company' },
        { title: 'Buyer Attorney Email' },
        { title: 'Buyer Attorney First Name' },
        { title: 'Buyer Attorney Full Name' },
        { title: 'Buyer Attorney Last Name' },
        { title: 'Buyer Attorney Phone' },
        { title: 'Buyer Company' },
        { title: 'Buyer Email' },
        { title: 'Buyer First Name' },
        { title: 'Buyer Full Name' },
        { title: 'Buyer Last Name' },
        { title: 'Buyer Phone' },
        { title: 'Buyer Repairs Acceptance Deadline (date)' },
        { title: 'Buyer Repairs Acceptance Deadline (time)' },
        { title: 'Buyer Termination Due Date (date)' },
        { title: 'Buyer Termination Due Date (time)' },
        { title: 'Buyer to Approve Income and Expense Docs (date)' },
        { title: 'Buyer to Approve Income and Expense Docs (time)' },
        { title: 'Buyer to Deliver Signed Seller Disclosure (date)' },
        { title: 'Buyer to Deliver Signed Seller Disclosure (time)' },
        { title: 'Buyer to Order Preliminary Title Report (date)' },
        { title: 'Buyer to Order Preliminary Title Report (time)' },
        { title: 'Buyer to Remove Rental Contingency (date)' },
        { title: 'Buyer to Remove Rental Contingency (time)' },
        { title: 'Buyer to Review HOA Docs (date)' },
        { title: 'Buyer to Review HOA Docs (time)' },
        { title: 'Buyer to Review Seller Disclosures (date)' },
        { title: 'Buyer to Review Seller Disclosures (time)' },
        { title: "Buyer's Agent Company" },
        { title: "Buyer's Agent Email" },
        { title: "Buyer's Agent First Name" },
        { title: "Buyer's Agent Full Name" },
        { title: "Buyer's Agent Last Name" },
        { title: "Buyer's Agent Phone" },
        { title: "Buyer's Coordinator Company" },
        { title: "Buyer's Coordinator Email" },
        { title: "Buyer's Coordinator First Name" },
        { title: "Buyer's Coordinator Full Name" },
        { title: "Buyer's Coordinator Last Name" },
        { title: "Buyer's Coordinator Phone" },
        { title: "Buyer's Investigation Period (date)" },
        { title: "Buyer's Investigation Period (time)" },
        { title: "Buyer's Lead Based Paint Inspection Due Date (date)" },
        { title: "Buyer's Lead Based Paint Inspection Due Date (time)" },
        { title: "Buyer's Response to Seller's Delivery of Proposal (date)" },
        { title: "Buyer's Response to Seller's Delivery of Proposal (time)" },
        { title: 'Buyers Notice to Seller of Appraised Value (date)' },
        { title: 'Buyers Notice to Seller of Appraised Value (time)' },
        { title: 'Buyers Repair Acceptance Due Date (date)' },
        { title: 'Buyers Repair Acceptance Due Date (time)' },
        { title: 'Buyers Response To Request For Loan Information (date)' },
        { title: 'Buyers Response To Request For Loan Information (time)' },
        { title: 'Buying Broker Company' },
        { title: 'Buying Broker Email' },
        { title: 'Buying Broker First Name' },
        { title: 'Buying Broker Full Name' },
        { title: 'Buying Broker Last Name' },
        { title: 'Buying Broker Phone' },
        { title: 'Carolina Inspectors' },
        { title: 'CCRs Delivery Deadline (date)' },
        { title: 'CCRs Delivery Deadline (time)' },
        { title: 'CCRs Objection Deadline (date)' },
        { title: 'CCRs Objection Deadline (time)' },
        { title: 'CCRs Resolution Deadline (date)' },
        { title: 'CCRs Resolution Deadline (time)' },
        { title: 'check (date)' },
        { title: 'check (time)' },
        { title: 'Checklist detail' },
        { title: 'Chimney Inspection Due Date (date)' },
        { title: 'Chimney Inspection Due Date (time)' },
        { title: 'Chimney Inspector Company' },
        { title: 'Chimney Inspector Email' },
        { title: 'Chimney Inspector First Name' },
        { title: 'Chimney Inspector Full Name' },
        { title: 'Chimney Inspector Last Name' },
        { title: 'Chimney Inspector Phone' },
        { title: 'CL100 Due Date (date)' },
        { title: 'CL100 Due Date (time)' },
        { title: 'Class' },
        { title: 'Close Of Escrow (date)' },
        { title: 'Close Of Escrow (time)' },
        { title: 'Closer Company' },
        { title: 'Closer Email' },
        { title: 'Closer First Name' },
        { title: 'Closer Full Name' },
        { title: 'Closer Last Name' },
        { title: 'Closer Phone' },
        { title: 'Closing Attorney' },
        { title: 'Closing Attorney Address' },
        { title: 'Closing Attorney Company' },
        { title: 'Closing Attorney Email' },
        { title: 'Closing Attorney First Name' },
        { title: 'Closing Attorney Full Name' },
        { title: 'Closing Attorney Last Name' },
        { title: 'Closing Attorney Phone' },
        { title: 'Closing Date (date)' },
        { title: 'Closing Date (time)' },
        { title: 'Closing Notice Date (date)' },
        { title: 'Closing Notice Date (time)' },
        { title: 'Co-List agent Company' },
        { title: 'Co-List agent Email' },
        { title: 'Co-List agent First Name' },
        { title: 'Co-List agent Full Name' },
        { title: 'Co-List agent Last Name' },
        { title: 'Co-List agent Phone' },
        { title: 'Coastal Feature Inspection Due Date (date)' },
        { title: 'Coastal Feature Inspection Due Date (time)' },
        { title: 'Coastal Feature Inspector Company' },
        { title: 'Coastal Feature Inspector Email' },
        { title: 'Coastal Feature Inspector First Name' },
        { title: 'Coastal Feature Inspector Full Name' },
        { title: 'Coastal Feature Inspector Last Name' },
        { title: 'Coastal Feature Inspector Phone' },
        { title: 'Commission' },
        { title: 'Commission - Buy Side' },
        { title: 'Commission - Sell Side' },
        { title: 'Common Interest Document Due Date (date)' },
        { title: 'Common Interest Document Due Date (time)' },
        { title: 'Completion Date (Estimated until Finalized) (date)' },
        { title: 'Completion Date (Estimated until Finalized) (time)' },
        { title: 'Conditional Sale Deadline (date)' },
        { title: 'Conditional Sale Deadline (time)' },
        { title: 'Construction Type' },
        { title: 'Contingent on Financing Due Date (date)' },
        { title: 'Contingent on Financing Due Date (time)' },
        { title: 'Contingent on Inspection (date)' },
        { title: 'Contingent on Inspection (time)' },
        { title: 'Contingent on Sale Due Date (date)' },
        { title: 'Contingent on Sale Due Date (time)' },
        { title: 'Contract Acceptance Date (date)' },
        { title: 'Contract Acceptance Date (time)' },
        { title: 'Contract Type' },
        { title: 'Coordination Transaction Fee' },
        { title: 'County' },
        { title: 'Crawl Space Inspection (date)' },
        { title: 'Crawl Space Inspection (time)' },
        { title: 'Crawl Space Inspector Company' },
        { title: 'Crawl Space Inspector Email' },
        { title: 'Crawl Space Inspector First Name' },
        { title: 'Crawl Space Inspector Full Name' },
        { title: 'Crawl Space Inspector Last Name' },
        { title: 'Crawl Space Inspector Phone' },
        { title: 'Current Price' },
        { title: 'Current Year' },
        { title: 'Date of Possession (date)' },
        { title: 'Date of Possession (time)' },
        { title: 'date queston (date)' },
        { title: 'date queston (time)' },
        { title: 'Days to Apply for Mortgage (date)' },
        { title: 'Days to Apply for Mortgage (time)' },
        { title: "Deadline for Buyer's Review of CC&Rs (date)" },
        { title: "Deadline for Buyer's Review of CC&Rs (time)" },
        { title: 'Deed Book' },
        { title: 'Deed Page' },
        { title: 'Deeds Restrictions and Zoning Inspector Company' },
        { title: 'Deeds Restrictions and Zoning Inspector Email' },
        { title: 'Deeds Restrictions and Zoning Inspector First Name' },
        { title: 'Deeds Restrictions and Zoning Inspector Full Name' },
        { title: 'Deeds Restrictions and Zoning Inspector Last Name' },
        { title: 'Deeds Restrictions and Zoning Inspector Phone' },
        { title: 'Description of Other Liens' },
        { title: 'Detail Question' },
        { title: 'dfg' },
        { title: 'Drywall Inspection Due Date (date)' },
        { title: 'Drywall Inspection Due Date (time)' },
        { title: 'Drywall Inspector Company' },
        { title: 'Drywall Inspector Email' },
        { title: 'Drywall Inspector First Name' },
        { title: 'Drywall Inspector Full Name' },
        { title: 'Drywall Inspector Last Name' },
        { title: 'Drywall Inspector Phone' },
        { title: 'Due Diligence Documents Delivery Deadline (date)' },
        { title: 'Due Diligence Documents Delivery Deadline (time)' },
        { title: 'Due Diligence Documents Delivery Objection Deadline (date)' },
        { title: 'Due Diligence Documents Delivery Objection Deadline (time)' },
        { title: 'Due Diligence Documents Resolution Deadline (date)' },
        { title: 'Due Diligence Documents Resolution Deadline (time)' },
        { title: 'Due Diligence End Date (date)' },
        { title: 'Due Diligence End Date (time)' },
        { title: 'Due Diligence Money Amount' },
        { title: 'Due Diligence Money Due Date (date)' },
        { title: 'Due Diligence Money Due Date (time)' },
        { title: 'Earnest Money Amount' },
        { title: 'Earnest Money Deposited Due Date (date)' },
        { title: 'Earnest Money Deposited Due Date (time)' },
        { title: 'Earnest Money Due Date (date)' },
        { title: 'Earnest Money Due Date (time)' },
        { title: 'Earnest Money Holder' },
        { title: 'Earnest Money/ Due Diligence Due Date (date)' },
        { title: 'Earnest Money/ Due Diligence Due Date (time)' },
        { title: 'Effective Date (date)' },
        { title: 'Effective Date (time)' },
        { title: 'Electric Inspector Company' },
        { title: 'Electric Inspector Email' },
        { title: 'Electric Inspector First Name' },
        { title: 'Electric Inspector Full Name' },
        { title: 'Electric Inspector Last Name' },
        { title: 'Electric Inspector Phone' },
        { title: 'Environmental Site Assessment Due Date (date)' },
        { title: 'Environmental Site Assessment Due Date (time)' },
        { title: 'Environmental Site Assessor Company' },
        { title: 'Environmental Site Assessor Email' },
        { title: 'Environmental Site Assessor First Name' },
        { title: 'Environmental Site Assessor Full Name' },
        { title: 'Environmental Site Assessor Last Name' },
        { title: 'Environmental Site Assessor Phone' },
        { title: 'Escrow Agent Company' },
        { title: 'Escrow Agent Email' },
        { title: 'Escrow Agent First Name' },
        { title: 'Escrow Agent Full Name' },
        { title: 'Escrow Agent Last Name' },
        { title: 'Escrow Agent Phone' },
        { title: 'Escrow Closing Date (date)' },
        { title: 'Escrow Closing Date (time)' },
        { title: 'Escrow Due Date (date)' },
        { title: 'Escrow Due Date (time)' },
        { title: 'Escrow Instructions Due Date (date)' },
        { title: 'Escrow Instructions Due Date (time)' },
        { title: 'Escrow Number' },
        { title: 'Escrow Title Rep Company' },
        { title: 'Escrow Title Rep Email' },
        { title: 'Escrow Title Rep First Name' },
        { title: 'Escrow Title Rep Full Name' },
        { title: 'Escrow Title Rep Last Name' },
        { title: 'Escrow Title Rep Phone' },
        { title: 'Escrowee Company' },
        { title: 'Escrowee Email' },
        { title: 'Escrowee First Name' },
        { title: 'Escrowee Full Name' },
        { title: 'Escrowee Last Name' },
        { title: 'Escrowee Phone' },
        { title: 'Executed Contract Date (date)' },
        { title: 'Executed Contract Date (time)' },
        { title: 'Execution Date (date)' },
        { title: 'Execution Date (time)' },
        { title: 'Existing Loan Documents Deadline (date)' },
        { title: 'Existing Loan Documents Deadline (time)' },
        { title: 'Existing Loan Documents Objection Deadline (date)' },
        { title: 'Existing Loan Documents Objection Deadline (time)' },
        { title: 'fdf (date)' },
        { title: 'fdf (time)' },
        { title: 'Feasibility Study Deadline (date)' },
        { title: 'Feasibility Study Deadline (time)' },
        { title: 'FHA Inspection Delivery Deadline (date)' },
        { title: 'FHA Inspection Delivery Deadline (time)' },
        { title: 'FHA Inspection Objection Deadline (date)' },
        { title: 'FHA Inspection Objection Deadline (time)' },
        { title: 'FHA Inspection Resolution Deadline (date)' },
        { title: 'FHA Inspection Resolution Deadline (time)' },
        { title: 'Final Earnest Money Due Date (date)' },
        { title: 'Final Earnest Money Due Date (time)' },
        { title: 'Final Walkthrough Date (date)' },
        { title: 'Final Walkthrough Date (time)' },
        { title: 'Financing and Appraisal Due Date (date)' },
        { title: 'Financing and Appraisal Due Date (time)' },
        { title: 'Financing Contingency (date)' },
        { title: 'Financing Contingency (time)' },
        { title: 'Financing Deadline (date)' },
        { title: 'Financing Deadline (time)' },
        { title: 'First Commitment Date (date)' },
        { title: 'First Commitment Date (time)' },
        { title: 'First Earnest Money Deposit Due Date (date)' },
        { title: 'First Earnest Money Deposit Due Date (time)' },
        { title: 'First Walkthrough Deadline (date)' },
        { title: 'First Walkthrough Deadline (time)' },
        { title: 'Flood Insurance Provider Company' },
        { title: 'Flood Insurance Provider Email' },
        { title: 'Flood Insurance Provider First Name' },
        { title: 'Flood Insurance Provider Full Name' },
        { title: 'Flood Insurance Provider Last Name' },
        { title: 'Flood Insurance Provider Phone' },
        { title: 'Flood Plain Zone Determination Inspector Company' },
        { title: 'Flood Plain Zone Determination Inspector Email' },
        { title: 'Flood Plain Zone Determination Inspector First Name' },
        { title: 'Flood Plain Zone Determination Inspector Full Name' },
        { title: 'Flood Plain Zone Determination Inspector Last Name' },
        { title: 'Flood Plain Zone Determination Inspector Phone' },
        { title: 'Flood Plain/Zone Determination Inspection Due Date (date)' },
        { title: 'Flood Plain/Zone Determination Inspection Due Date (time)' },
        { title: 'Flood Zone/Elevation Determination Deadline (date)' },
        { title: 'Flood Zone/Elevation Determination Deadline (time)' },
        { title: 'for checking Company' },
        { title: 'for checking Email' },
        { title: 'for checking First Name' },
        { title: 'for checking Full Name' },
        { title: 'for checking Last Name' },
        { title: 'for checking Phone' },
        { title: 'Foundation Installation Delivery Deadline (date)' },
        { title: 'Foundation Installation Delivery Deadline (time)' },
        { title: 'Foundation Installation Delivery Objection Deadline (date)' },
        { title: 'Foundation Installation Delivery Objection Deadline (time)' },
        { title: 'Foundation Installation Resolution Deadline (date)' },
        { title: 'Foundation Installation Resolution Deadline (time)' },
        { title: 'Funding Date (date)' },
        { title: 'Funding Date (time)' },
        { title: 'Gas Inspection Due Date (date)' },
        { title: 'Gas Inspection Due Date (time)' },
        { title: 'Gas Inspector Company' },
        { title: 'Gas Inspector Email' },
        { title: 'Gas Inspector First Name' },
        { title: 'Gas Inspector Full Name' },
        { title: 'Gas Inspector Last Name' },
        { title: 'Gas Inspector Phone' },
        { title: 'gggg (date)' },
        { title: 'gggg (time)' },
        { title: 'Governmental/Occupancy Inspections Deadline (date)' },
        { title: 'Governmental/Occupancy Inspections Deadline (time)' },
        { title: 'Ground Water Inspection Due Date (date)' },
        { title: 'Ground Water Inspection Due Date (time)' },
        { title: 'Ground Water Inspector Company' },
        { title: 'Ground Water Inspector Email' },
        { title: 'Ground Water Inspector First Name' },
        { title: 'Ground Water Inspector Full Name' },
        { title: 'Ground Water Inspector Last Name' },
        { title: 'Ground Water Inspector Phone' },
        { title: 'Hazardous Substance Inspector Company' },
        { title: 'Hazardous Substance Inspector Email' },
        { title: 'Hazardous Substance Inspector First Name' },
        { title: 'Hazardous Substance Inspector Full Name' },
        { title: 'Hazardous Substance Inspector Last Name' },
        { title: 'Hazardous Substance Inspector Phone' },
        { title: 'Hazardous Substances Inspection Due Date (date)' },
        { title: 'Hazardous Substances Inspection Due Date (time)' },
        { title: 'HOA Company' },
        { title: 'HOA Disapproval Due Date (date)' },
        { title: 'HOA Disapproval Due Date (time)' },
        { title: 'HOA Disclosure Delivery Deadline (date)' },
        { title: 'HOA Disclosure Delivery Deadline (time)' },
        { title: 'HOA Disclosure Objection Deadline (date)' },
        { title: 'HOA Disclosure Objection Deadline (time)' },
        { title: 'HOA Disclosure Resolution Deadline (date)' },
        { title: 'HOA Disclosure Resolution Deadline (time)' },
        { title: 'HOA Docs Due Date (date)' },
        { title: 'HOA Docs Due Date (time)' },
        { title: 'HOA Documents Delivery Deadline (date)' },
        { title: 'HOA Documents Delivery Deadline (time)' },
        { title: 'HOA Documents Objection Deadline (date)' },
        { title: 'HOA Documents Objection Deadline (time)' },
        { title: 'HOA Documents Resolution Deadline (date)' },
        { title: 'HOA Documents Resolution Deadline (time)' },
        { title: 'HOA Email' },
        { title: 'HOA First Name' },
        { title: 'HOA Full Name' },
        { title: 'HOA Last Name' },
        { title: 'HOA Phone' },
        { title: 'HOA Required' },
        { title: 'HOA Review Period (date)' },
        { title: 'HOA Review Period (time)' },
        { title: 'Holding Deposit Check Deadline (date)' },
        { title: 'Holding Deposit Check Deadline (time)' },
        { title: 'Home Improvement Provider Company' },
        { title: 'Home Improvement Provider Email' },
        { title: 'Home Improvement Provider First Name' },
        { title: 'Home Improvement Provider Full Name' },
        { title: 'Home Improvement Provider Last Name' },
        { title: 'Home Improvement Provider Phone' },
        { title: 'Home Inspection Company' },
        { title: 'Home Inspection Date (date)' },
        { title: 'Home Inspection Date (time)' },
        { title: 'Home Inspection Due Date (date)' },
        { title: 'Home Inspection Due Date (time)' },
        { title: 'Home Inspector Company' },
        { title: 'Home Inspector Company Company' },
        { title: 'Home Inspector Company Email' },
        { title: 'Home Inspector Company First Name' },
        { title: 'Home Inspector Company Full Name' },
        { title: 'Home Inspector Company Last Name' },
        { title: 'Home Inspector Company Phone' },
        { title: 'Home Inspector Email' },
        { title: 'Home Inspector First Name' },
        { title: 'Home Inspector Full Name' },
        { title: 'Home Inspector Last Name' },
        { title: 'Home Inspector Phone' },
        { title: 'Home Insurance Commitment Deadline (date)' },
        { title: 'Home Insurance Commitment Deadline (time)' },
        { title: 'Home Insurance Provider Company' },
        { title: 'Home Insurance Provider Email' },
        { title: 'Home Insurance Provider First Name' },
        { title: 'Home Insurance Provider Full Name' },
        { title: 'Home Insurance Provider Last Name' },
        { title: 'Home Insurance Provider Phone' },
        { title: 'Home Security Provider Company' },
        { title: 'Home Security Provider Email' },
        { title: 'Home Security Provider First Name' },
        { title: 'Home Security Provider Full Name' },
        { title: 'Home Security Provider Last Name' },
        { title: 'Home Security Provider Phone' },
        { title: 'Home Warranty Due Date (date)' },
        { title: 'Home Warranty Due Date (time)' },
        { title: 'Home Warranty Provider Company' },
        { title: 'Home Warranty Provider Email' },
        { title: 'Home Warranty Provider First Name' },
        { title: 'Home Warranty Provider Full Name' },
        { title: 'Home Warranty Provider Last Name' },
        { title: 'Home Warranty Provider Phone' },
        { title: "Homeowner's Association" },
        { title: "Homeowner's Association Dues" },
        { title: 'HVAC Inspection Due Date (date)' },
        { title: 'HVAC Inspection Due Date (time)' },
        { title: 'HVAC Inspector Company' },
        { title: 'HVAC Inspector Email' },
        { title: 'HVAC Inspector First Name' },
        { title: 'HVAC Inspector Full Name' },
        { title: 'HVAC Inspector Last Name' },
        { title: 'HVAC Inspector Phone' },
        { title: 'Initial Deposit Due Date (date)' },
        { title: 'Initial Deposit Due Date (time)' },
        { title: 'Initial Earnest Money Deposit Due Date (date)' },
        { title: 'Initial Earnest Money Deposit Due Date (time)' },
        { title: 'Initial Inspection Period (date)' },
        { title: 'Initial Inspection Period (time)' },
        { title: 'Inspection Contingency Date (date)' },
        { title: 'Inspection Contingency Date (time)' },
        { title: 'Inspection Deadline (date)' },
        { title: 'Inspection Deadline (time)' },
        { title: 'Inspection Due Date (date)' },
        { title: 'Inspection Due Date (time)' },
        { title: 'Inspection Objection Deadline (21.F.ii) (date)' },
        { title: 'Inspection Objection Deadline (21.F.ii) (time)' },
        { title: 'Inspection Period Due Date (date)' },
        { title: 'Inspection Period Due Date (time)' },
        { title: 'Inspection Resolution Deadline (21.F.iii) (date)' },
        { title: 'Inspection Resolution Deadline (21.F.iii) (time)' },
        { title: 'Inspections Contingency Deadline (date)' },
        { title: 'Inspections Contingency Deadline (time)' },
        { title: 'Inspector Company' },
        { title: 'Inspector Email' },
        { title: 'Inspector First Name' },
        { title: 'Inspector Full Name' },
        { title: 'Inspector Last Name' },
        { title: 'Inspector Phone' },
        { title: 'Insurability Notification Deadline (date)' },
        { title: 'Insurability Notification Deadline (time)' },
        { title: 'Insurance Application Deadline (date)' },
        { title: 'Insurance Application Deadline (time)' },
        { title: 'intro (date)' },
        { title: 'intro (time)' },
        { title: 'Kids Birthday (date)' },
        { title: 'Kids Birthday (time)' },
        { title: 'Kids Name' },
        { title: 'Kitsap County Maintenance Records Due Date (date)' },
        { title: 'Kitsap County Maintenance Records Due Date (time)' },
        { title: 'Land Insurance Provider Company' },
        { title: 'Land Insurance Provider Email' },
        { title: 'Land Insurance Provider First Name' },
        { title: 'Land Insurance Provider Full Name' },
        { title: 'Land Insurance Provider Last Name' },
        { title: 'Land Insurance Provider Phone' },
        { title: 'Landlord Company' },
        { title: 'Landlord Email' },
        { title: 'Landlord First Name' },
        { title: 'Landlord Full Name' },
        { title: 'Landlord Last Name' },
        { title: 'Landlord Phone' },
        { title: 'Lawn Care/Landscape Provider Company' },
        { title: 'Lawn Care/Landscape Provider Email' },
        { title: 'Lawn Care/Landscape Provider First Name' },
        { title: 'Lawn Care/Landscape Provider Full Name' },
        { title: 'Lawn Care/Landscape Provider Last Name' },
        { title: 'Lawn Care/Landscape Provider Phone' },
        { title: 'Lawn Irrigation System Provider Company' },
        { title: 'Lawn Irrigation System Provider Email' },
        { title: 'Lawn Irrigation System Provider First Name' },
        { title: 'Lawn Irrigation System Provider Full Name' },
        { title: 'Lawn Irrigation System Provider Last Name' },
        { title: 'Lawn Irrigation System Provider Phone' },
        { title: 'Lead Based Paint Termination Deadline (date)' },
        { title: 'Lead Based Paint Termination Deadline (time)' },
        { title: 'Lead Contamination Inspection Due Date (date)' },
        { title: 'Lead Contamination Inspection Due Date (time)' },
        { title: 'Lead Contamination Inspector Company' },
        { title: 'Lead Contamination Inspector Email' },
        { title: 'Lead Contamination Inspector First Name' },
        { title: 'Lead Contamination Inspector Full Name' },
        { title: 'Lead Contamination Inspector Last Name' },
        { title: 'Lead Contamination Inspector Phone' },
        { title: 'Lead Inspector Company' },
        { title: 'Lead Inspector Email' },
        { title: 'Lead Inspector First Name' },
        { title: 'Lead Inspector Full Name' },
        { title: 'Lead Inspector Last Name' },
        { title: 'Lead Inspector Phone' },
        { title: 'Lead-based Paint Disclosure Due Date (date)' },
        { title: 'Lead-based Paint Disclosure Due Date (time)' },
        { title: 'Lead-Based Paint Inspection Due Date (date)' },
        { title: 'Lead-Based Paint Inspection Due Date (time)' },
        { title: 'Lease Agreements Delivery Deadline (date)' },
        { title: 'Lease Agreements Delivery Deadline (time)' },
        { title: 'Lease Agreements Objection Deadline (date)' },
        { title: 'Lease Agreements Objection Deadline (time)' },
        { title: 'Lease Agreements Resolution Deadline (date)' },
        { title: 'Lease Agreements Resolution Deadline (time)' },
        { title: 'Leased or Liened Items Contingency (date)' },
        { title: 'Leased or Liened Items Contingency (time)' },
        { title: 'Legal Description' },
        { title: 'Lender Company' },
        { title: 'Lender Email' },
        { title: 'Lender First Name' },
        { title: 'Lender Full Name' },
        { title: 'Lender Last Name' },
        { title: 'Lender Phone' },
        { title: 'Lender Termination Deadline (date)' },
        { title: 'Lender Termination Deadline (time)' },
        { title: 'List Price' },
        { title: 'Listing Agent Assistant Company' },
        { title: 'Listing Agent Assistant Email' },
        { title: 'Listing Agent Assistant First Name' },
        { title: 'Listing Agent Assistant Full Name' },
        { title: 'Listing Agent Assistant Last Name' },
        { title: 'Listing Agent Assistant Phone' },
        { title: 'Listing Agent Office Manager Company' },
        { title: 'Listing Agent Office Manager Email' },
        { title: 'Listing Agent Office Manager First Name' },
        { title: 'Listing Agent Office Manager Full Name' },
        { title: 'Listing Agent Office Manager Last Name' },
        { title: 'Listing Agent Office Manager Phone' },
        { title: 'Listing Broker Company' },
        { title: 'Listing Broker Email' },
        { title: 'Listing Broker First Name' },
        { title: 'Listing Broker Full Name' },
        { title: 'Listing Broker Last Name' },
        { title: 'Listing Broker Phone' },
        { title: 'Listing Date (date)' },
        { title: 'Listing Date (time)' },
        { title: 'Listing Expiration Date (date)' },
        { title: 'Listing Expiration Date (time)' },
        { title: 'Listing Price' },
        { title: 'Listing Start Date (date)' },
        { title: 'Listing Start Date (time)' },
        { title: 'Loan Application Due Date (date)' },
        { title: 'Loan Application Due Date (time)' },
        { title: 'Loan Approval Deadline (date)' },
        { title: 'Loan Approval Deadline (time)' },
        { title: 'Loan Approval Due Date (date)' },
        { title: 'Loan Approval Due Date (time)' },
        { title: 'Loan Approval Period (date)' },
        { title: 'Loan Approval Period (time)' },
        { title: 'Loan Contingency Removal (date)' },
        { title: 'Loan Contingency Removal (time)' },
        { title: 'Loan Objection Deadline (date)' },
        { title: 'Loan Objection Deadline (time)' },
        { title: 'Loan Officer Assistant Company' },
        { title: 'Loan Officer Assistant Email' },
        { title: 'Loan Officer Assistant First Name' },
        { title: 'Loan Officer Assistant Full Name' },
        { title: 'Loan Officer Assistant Last Name' },
        { title: 'Loan Officer Assistant Phone' },
        { title: 'Loan Officer Company' },
        { title: 'Loan Officer Email' },
        { title: 'Loan Officer First Name' },
        { title: 'Loan Officer Full Name' },
        { title: 'Loan Officer Last Name' },
        { title: 'Loan Officer Phone' },
        { title: 'Loan Transfer Approval Deadline (date)' },
        { title: 'Loan Transfer Approval Deadline (time)' },
        { title: 'Loans Processor Company' },
        { title: 'Loans Processor Email' },
        { title: 'Loans Processor First Name' },
        { title: 'Loans Processor Full Name' },
        { title: 'Loans Processor Last Name' },
        { title: 'Loans Processor Phone' },
        { title: 'Lock Interest Rate Due Date (date)' },
        { title: 'Lock Interest Rate Due Date (time)' },
        { title: 'Locking of Mortgage Interest Rate Date (date)' },
        { title: 'Locking of Mortgage Interest Rate Date (time)' },
        { title: 'Locksmith Company' },
        { title: 'Locksmith Email' },
        { title: 'Locksmith First Name' },
        { title: 'Locksmith Full Name' },
        { title: 'Locksmith Last Name' },
        { title: 'Locksmith Phone' },
        { title: 'Lot' },
        { title: 'Lot Size' },
        { title: 'Managing Broker Company' },
        { title: 'Managing Broker Email' },
        { title: 'Managing Broker First Name' },
        { title: 'Managing Broker Full Name' },
        { title: 'Managing Broker Last Name' },
        { title: 'Managing Broker Phone' },
        { title: 'Manufactured House Document Resolution Deadline (date)' },
        { title: 'Manufactured House Document Resolution Deadline (time)' },
        {
          title:
            'Manufactured Housing Division Permanent Foundation Delivery Deadline (date)',
        },
        {
          title:
            'Manufactured Housing Division Permanent Foundation Delivery Deadline (time)',
        },
        {
          title:
            'Manufactured Housing Division Permanent Foundation ObjectionDeadline (date)',
        },
        {
          title:
            'Manufactured Housing Division Permanent Foundation ObjectionDeadline (time)',
        },
        {
          title:
            'Manufactured Housing Division Permanent Foundation Resolution Deadline (date)',
        },
        {
          title:
            'Manufactured Housing Division Permanent Foundation Resolution Deadline (time)',
        },
        { title: 'Manufactured Housing Documents Delivery Deadline (date)' },
        { title: 'Manufactured Housing Documents Delivery Deadline (time)' },
        { title: 'Manufactured Housing Documents Objection Deadline (date)' },
        { title: 'Manufactured Housing Documents Objection Deadline (time)' },
        { title: 'Map Grid' },
        { title: 'Marketable Title Due Date (date)' },
        { title: 'Marketable Title Due Date (time)' },
        { title: 'Mechanical Inspector Company' },
        { title: 'Mechanical Inspector Email' },
        { title: 'Mechanical Inspector First Name' },
        { title: 'Mechanical Inspector Full Name' },
        { title: 'Mechanical Inspector Last Name' },
        { title: 'Mechanical Inspector Phone' },
        { title: 'Meth Inspector Company' },
        { title: 'Meth Inspector Email' },
        { title: 'Meth Inspector First Name' },
        { title: 'Meth Inspector Full Name' },
        { title: 'Meth Inspector Last Name' },
        { title: 'Meth Inspector Phone' },
        { title: 'MLS Area' },
        { title: 'MLS Number' },
        { title: 'Mold Inspection Due Date (date)' },
        { title: 'Mold Inspection Due Date (time)' },
        { title: 'Mold Inspector Company' },
        { title: 'Mold Inspector Email' },
        { title: 'Mold Inspector First Name' },
        { title: 'Mold Inspector Full Name' },
        { title: 'Mold Inspector Last Name' },
        { title: 'Mold Inspector Phone' },
        { title: 'Mortgage Application Due Date (date)' },
        { title: 'Mortgage Application Due Date (time)' },
        { title: 'Mortgage Commitment Due Date (date)' },
        { title: 'Mortgage Commitment Due Date (time)' },
        { title: 'Mortgage Contingency Date (date)' },
        { title: 'Mortgage Contingency Date (time)' },
        { title: 'Move Out Date (date)' },
        { title: 'Move Out Date (time)' },
        { title: 'Moving and Storage Company' },
        { title: 'Moving and Storage Email' },
        { title: 'Moving and Storage First Name' },
        { title: 'Moving and Storage Full Name' },
        { title: 'Moving and Storage Last Name' },
        { title: 'Moving and Storage Phone' },
        { title: 'Municipal Lien Search Due Date (date)' },
        { title: 'Municipal Lien Search Due Date (time)' },
        { title: 'Municipality Building Inspector Company' },
        { title: 'Municipality Building Inspector Email' },
        { title: 'Municipality Building Inspector First Name' },
        { title: 'Municipality Building Inspector Full Name' },
        { title: 'Municipality Building Inspector Last Name' },
        { title: 'Municipality Building Inspector Phone' },
        { title: 'My Email' },
        { title: 'My First Name' },
        { title: 'My Full Name' },
        { title: 'My Phone Number' },
        { title: 'Negotiation Period Due Date (date)' },
        { title: 'Negotiation Period Due Date (time)' },
        { title: 'Neighborhood Review Deadline (date)' },
        { title: 'Neighborhood Review Deadline (time)' },
        { title: 'New Date (date)' },
        { title: 'New Date (time)' },
        { title: 'New Date for checking checklist (date)' },
        { title: 'New Date for checking checklist (time)' },
        { title: 'New Detail' },
        { title: 'New ILC or New Survey Deadline (date)' },
        { title: 'New ILC or New Survey Deadline (time)' },
        { title: 'New ILC or New Survey Objection Deadline (date)' },
        { title: 'New ILC or New Survey Objection Deadline (time)' },
        { title: 'New ILC or New Survey Resolution Deadline (date)' },
        { title: 'New ILC or New Survey Resolution Deadline (time)' },
        { title: 'New Role Not Defined Company' },
        { title: 'New Role Not Defined Email' },
        { title: 'New Role Not Defined First Name' },
        { title: 'New Role Not Defined Full Name' },
        { title: 'New Role Not Defined Last Name' },
        { title: 'New Role Not Defined Phone' },
        { title: 'Next Assessment Date (date)' },
        { title: 'Next Assessment Date (time)' },
        { title: 'Non-Refundable Deposit Due Date (date)' },
        { title: 'Non-Refundable Deposit Due Date (time)' },
        { title: 'Nonrefundable Deposit Company' },
        { title: 'Nonrefundable Deposit Email' },
        { title: 'Nonrefundable Deposit First Name' },
        { title: 'Nonrefundable Deposit Full Name' },
        { title: 'Nonrefundable Deposit Last Name' },
        { title: 'Nonrefundable Deposit Phone' },
        {
          title:
            'Notification of Change in Terms of Buyers Financing Date (date)',
        },
        {
          title:
            'Notification of Change in Terms of Buyers Financing Date (time)',
        },
        { title: 'Occupancy' },
        { title: 'Occupancy Date (date)' },
        { title: 'Occupancy Date (time)' },
        { title: 'Off-Record Title Deadline (date)' },
        { title: 'Off-Record Title Deadline (time)' },
        { title: 'Off-Record Title Objection Deadline (date)' },
        { title: 'Off-Record Title Objection Deadline (time)' },
        { title: 'Offer Date (date)' },
        { title: 'Offer Date (time)' },
        { title: 'Offer Expiration Date (date)' },
        { title: 'Offer Expiration Date (time)' },
        { title: 'Open Escrow Due Date (date)' },
        { title: 'Open Escrow Due Date (time)' },
        { title: 'Operations Manager Company' },
        { title: 'Operations Manager Email' },
        { title: 'Operations Manager First Name' },
        { title: 'Operations Manager Full Name' },
        { title: 'Operations Manager Last Name' },
        { title: 'Operations Manager Phone' },
        { title: 'Option Period End Date (date)' },
        { title: 'Option Period End Date (time)' },
        { title: 'Original Price' },
        { title: 'Other Company' },
        { title: 'Other Email' },
        { title: 'Other First Name' },
        { title: 'Other Full Name' },
        { title: 'Other Last Name' },
        { title: 'Other Liens' },
        { title: 'Other Phone' },
        { title: 'OWTS Approval Deadline (date)' },
        { title: 'OWTS Approval Deadline (time)' },
        { title: 'OWTS Design Approval Company' },
        { title: 'OWTS Design Approval Due Date (date)' },
        { title: 'OWTS Design Approval Due Date (time)' },
        { title: 'OWTS Design Approval Email' },
        { title: 'OWTS Design Approval First Name' },
        { title: 'OWTS Design Approval Full Name' },
        { title: 'OWTS Design Approval Last Name' },
        { title: 'OWTS Design Approval Phone' },
        { title: 'Paralegal Company' },
        { title: 'Paralegal Email' },
        { title: 'Paralegal First Name' },
        { title: 'Paralegal Full Name' },
        { title: 'Paralegal Last Name' },
        { title: 'Paralegal Phone' },
        { title: 'Parcel/Tax ID' },
        { title: 'Percolation Inspection Due Date (date)' },
        { title: 'Percolation Inspection Due Date (time)' },
        { title: 'Percolation Inspector Company' },
        { title: 'Percolation Inspector Email' },
        { title: 'Percolation Inspector First Name' },
        { title: 'Percolation Inspector Full Name' },
        { title: 'Percolation Inspector Last Name' },
        { title: 'Percolation Inspector Phone' },
        { title: 'Permits Delivery Deadline (date)' },
        { title: 'Permits Delivery Deadline (time)' },
        { title: 'Permits Objection Deadline (date)' },
        { title: 'Permits Objection Deadline (time)' },
        { title: 'Permits Resolution Deadline (date)' },
        { title: 'Permits Resolution Deadline (time)' },
        { title: 'Pest Inspection Due Date (date)' },
        { title: 'Pest Inspection Due Date (time)' },
        { title: 'Pest Inspector Company' },
        { title: 'Pest Inspector Email' },
        { title: 'Pest Inspector First Name' },
        { title: 'Pest Inspector Full Name' },
        { title: 'Pest Inspector Last Name' },
        { title: 'Pest Inspector Phone' },
        { title: 'Photographer Company' },
        { title: 'Photographer Email' },
        { title: 'Photographer First Name' },
        { title: 'Photographer Full Name' },
        { title: 'Photographer Last Name' },
        { title: 'Photographer Phone' },
        { title: 'Pool Inspection Due Date (date)' },
        { title: 'Pool Inspection Due Date (time)' },
        { title: 'Pool Inspector Company' },
        { title: 'Pool Inspector Email' },
        { title: 'Pool Inspector First Name' },
        { title: 'Pool Inspector Full Name' },
        { title: 'Pool Inspector Last Name' },
        { title: 'Pool Inspector Phone' },
        { title: 'Pre-Closer Company' },
        { title: 'Pre-Closer Email' },
        { title: 'Pre-Closer First Name' },
        { title: 'Pre-Closer Full Name' },
        { title: 'Pre-Closer Last Name' },
        { title: 'Pre-Closer Phone' },
        { title: 'Pre-Qualification Letter Deadline (6.A.ii) (date)' },
        { title: 'Pre-Qualification Letter Deadline (6.A.ii) (time)' },
        { title: 'Production assistant Company' },
        { title: 'Production assistant Email' },
        { title: 'Production assistant First Name' },
        { title: 'Production assistant Full Name' },
        { title: 'Production assistant Last Name' },
        { title: 'Production assistant Phone' },
        { title: 'Property City' },
        { title: 'Property Disclosure Delivery Deadline (date)' },
        { title: 'Property Disclosure Delivery Deadline (time)' },
        { title: 'Property Disclosure Objection Deadline (date)' },
        { title: 'Property Disclosure Objection Deadline (time)' },
        { title: 'Property Disclosure Resolution Deadline (date)' },
        { title: 'Property Disclosure Resolution Deadline (time)' },
        { title: 'Property Excludes' },
        { title: 'Property Full Address' },
        { title: 'Property Includes' },
        { title: 'Property Insurance Objection Deadline (date)' },
        { title: 'Property Insurance Objection Deadline (time)' },
        { title: 'Property Manager Company' },
        { title: 'Property Manager Email' },
        { title: 'Property Manager First Name' },
        { title: 'Property Manager Full Name' },
        { title: 'Property Manager Last Name' },
        { title: 'Property Manager Phone' },
        { title: 'Property State' },
        { title: 'Property Street Address' },
        { title: 'Property Type' },
        { title: 'Property Zip Code' },
        { title: 'Public Improvement District Delivery Deadline (date)' },
        { title: 'Public Improvement District Delivery Deadline (time)' },
        { title: 'Public Improvement District Objection Deadline (date)' },
        { title: 'Public Improvement District Objection Deadline (time)' },
        { title: 'Public Improvement District Resolution Deadline (date)' },
        { title: 'Public Improvement District Resolution Deadline (time)' },
        { title: 'Purchase Price' },
        { title: 'Purchaser Execution Date (date)' },
        { title: 'Purchaser Execution Date (time)' },
        { title: 'Radon Inspection Due Date (date)' },
        { title: 'Radon Inspection Due Date (time)' },
        { title: 'Radon Inspector Company' },
        { title: 'Radon Inspector Email' },
        { title: 'Radon Inspector First Name' },
        { title: 'Radon Inspector Full Name' },
        { title: 'Radon Inspector Last Name' },
        { title: 'Radon Inspector Phone' },
        { title: 'Ratified Contract Date (date)' },
        { title: 'Ratified Contract Date (time)' },
        { title: 'Record Title Deadline (date)' },
        { title: 'Record Title Deadline (time)' },
        { title: 'Record Title Objections Deadline (date)' },
        { title: 'Record Title Objections Deadline (time)' },
        { title: 'Referral %' },
        { title: 'Referral Source' },
        { title: 'Remarks' },
        { title: 'Renegotiation Period Due Date (date)' },
        { title: 'Renegotiation Period Due Date (time)' },
        { title: 'Rental Agreements Review Period (date)' },
        { title: 'Rental Agreements Review Period (time)' },
        { title: 'Repair Resolution Period End Date (date)' },
        { title: 'Repair Resolution Period End Date (time)' },
        { title: 'Repairs Due Date (date)' },
        { title: 'Repairs Due Date (time)' },
        { title: 'Required Completion Date (date)' },
        { title: 'Required Completion Date (time)' },
        { title: 'Ribbon Representative Company' },
        { title: 'Ribbon Representative Email' },
        { title: 'Ribbon Representative First Name' },
        { title: 'Ribbon Representative Full Name' },
        { title: 'Ribbon Representative Last Name' },
        { title: 'Ribbon Representative Phone' },
        { title: 'Right of First Refusal Deadline (date)' },
        { title: 'Right of First Refusal Deadline (time)' },
        { title: 'Road Documents Delivery Deadline (date)' },
        { title: 'Road Documents Delivery Deadline (time)' },
        { title: 'Road Documents Objection Deadline (date)' },
        { title: 'Road Documents Objection Deadline (time)' },
        { title: 'Road Documents Resolution Deadline (date)' },
        { title: 'Road Documents Resolution Deadline (time)' },
        { title: 'Roof Inspector Company' },
        { title: 'Roof Inspector Email' },
        { title: 'Roof Inspector First Name' },
        { title: 'Roof Inspector Full Name' },
        { title: 'Roof Inspector Last Name' },
        { title: 'Roof Inspector Phone' },
        { title: 'Sale Commission Rate' },
        { title: 'Sale Commission Split $ - Buy Side' },
        { title: 'Sale Commission Split $ - Sell Side' },
        { title: 'Sale Commission Split % - Buy Side' },
        { title: 'Sale Commission Split % - Sell Side' },
        { title: "Sale of Buyer's Property Due Date (date)" },
        { title: "Sale of Buyer's Property Due Date (time)" },
        { title: 'Sale of Property Contingency' },
        { title: 'Sale Price' },
        { title: 'School District' },
        { title: 'Second Earnest Money Deposit Due Date (date)' },
        { title: 'Second Earnest Money Deposit Due Date (time)' },
        { title: 'SECTION' },
        { title: 'Seller Attorney Company' },
        { title: 'Seller Attorney Email' },
        { title: 'Seller Attorney First Name' },
        { title: 'Seller Attorney Full Name' },
        { title: 'Seller Attorney Last Name' },
        { title: 'Seller Attorney Phone' },
        { title: 'Seller Company' },
        { title: 'Seller Disclosure Due Date (date)' },
        { title: 'Seller Disclosure Due Date (time)' },
        { title: 'Seller Email' },
        { title: 'Seller First Name' },
        { title: 'Seller Full Name' },
        { title: 'Seller Last Name' },
        {
          title: 'Seller Mandated and Contractual Disclosures Due Date (date)',
        },
        {
          title: 'Seller Mandated and Contractual Disclosures Due Date (time)',
        },
        { title: 'Seller Name for DD' },
        { title: 'Seller or Private Financing Deadline (date)' },
        { title: 'Seller or Private Financing Deadline (time)' },
        { title: 'Seller Paid Repair Request Due Date (date)' },
        { title: 'Seller Paid Repair Request Due Date (time)' },
        { title: 'Seller Phone' },
        { title: 'Seller Repair Response Deadline (date)' },
        { title: 'Seller Repair Response Deadline (time)' },
        { title: 'Seller Report Delivery Date (date)' },
        { title: 'Seller Report Delivery Date (time)' },
        { title: 'Seller Requirements Due Date (date)' },
        { title: 'Seller Requirements Due Date (time)' },
        { title: 'Seller Right To Terminate Date (date)' },
        { title: 'Seller Right To Terminate Date (time)' },
        { title: 'Seller to Deliver Completed Rental Questionnaires (date)' },
        { title: 'Seller to Deliver Completed Rental Questionnaires (time)' },
        { title: 'Seller to Deliver Copies of Rental Agreements (date)' },
        { title: 'Seller to Deliver Copies of Rental Agreements (time)' },
        { title: 'Seller to Deliver HOA Docs (date)' },
        { title: 'Seller to Deliver HOA Docs (time)' },
        { title: 'Seller to Deliver Leased or Liened Items (date)' },
        { title: 'Seller to Deliver Leased or Liened Items (time)' },
        {
          title:
            'Seller to Deliver Purchase Agreement to Lienholders Deadline (date)',
        },
        {
          title:
            'Seller to Deliver Purchase Agreement to Lienholders Deadline (time)',
        },
        { title: 'Seller to Deliver to Buyer Income and Expense Docs (date)' },
        { title: 'Seller to Deliver to Buyer Income and Expense Docs (time)' },
        { title: 'Seller to Provide an Inventory of Personal Property (date)' },
        { title: 'Seller to Provide an Inventory of Personal Property (time)' },
        { title: "Seller's Agent Company" },
        { title: "Seller's Agent Email" },
        { title: "Seller's Agent First Name" },
        { title: "Seller's Agent Full Name" },
        { title: "Seller's Agent Last Name" },
        { title: "Seller's Agent Phone" },
        { title: "Seller's Coordinator Company" },
        { title: "Seller's Coordinator Email" },
        { title: "Seller's Coordinator First Name" },
        { title: "Seller's Coordinator Full Name" },
        { title: "Seller's Coordinator Last Name" },
        { title: "Seller's Coordinator Phone" },
        { title: "Seller's Delivery of Proposal to Buyer Due Date (date)" },
        { title: "Seller's Delivery of Proposal to Buyer Due Date (time)" },
        { title: "Seller's Receipt of Lienholders Conditions (date)" },
        { title: "Seller's Receipt of Lienholders Conditions (time)" },
        { title: "Seller's Request for Certificate of Resale Due Date (date)" },
        { title: "Seller's Request for Certificate of Resale Due Date (time)" },
        { title: 'Sellers Request for Loan Information Due Date (date)' },
        { title: 'Sellers Request for Loan Information Due Date (time)' },
        { title: 'Septic Evaluation Objection Deadline (date)' },
        { title: 'Septic Evaluation Objection Deadline (time)' },
        { title: 'Septic Evaluation Report Deadline (date)' },
        { title: 'Septic Evaluation Report Deadline (time)' },
        { title: 'Septic Evaluation Resolution Deadline (date)' },
        { title: 'Septic Evaluation Resolution Deadline (time)' },
        { title: 'Septic Inspection Date (date)' },
        { title: 'Septic Inspection Date (time)' },
        { title: 'Septic Inspection Due Date (date)' },
        { title: 'Septic Inspection Due Date (time)' },
        { title: 'Septic Inspector Company' },
        { title: 'Septic Inspector Email' },
        { title: 'Septic Inspector First Name' },
        { title: 'Septic Inspector Full Name' },
        { title: 'Septic Inspector Last Name' },
        { title: 'Septic Inspector Phone' },
        { title: 'Septic System Inspection Date (date)' },
        { title: 'Septic System Inspection Date (time)' },
        { title: 'Service Provider Company' },
        { title: 'Service Provider Email' },
        { title: 'Service Provider First Name' },
        { title: 'Service Provider Full Name' },
        { title: 'Service Provider Last Name' },
        { title: 'Service Provider Phone' },
        { title: 'Settlement Company' },
        { title: 'Settlement Deadline (date)' },
        { title: 'Settlement Deadline (time)' },
        { title: 'Settlement Email' },
        { title: 'Settlement First Name' },
        { title: 'Settlement Full Name' },
        { title: 'Settlement Last Name' },
        { title: 'Settlement Phone' },
        { title: 'Sewer Lateral Inspector Company' },
        { title: 'Sewer Lateral Inspector Email' },
        { title: 'Sewer Lateral Inspector First Name' },
        { title: 'Sewer Lateral Inspector Full Name' },
        { title: 'Sewer Lateral Inspector Last Name' },
        { title: 'Sewer Lateral Inspector Phone' },
        { title: 'Sewer Scope Inspector Company' },
        { title: 'Sewer Scope Inspector Email' },
        { title: 'Sewer Scope Inspector First Name' },
        { title: 'Sewer Scope Inspector Full Name' },
        { title: 'Sewer Scope Inspector Last Name' },
        { title: 'Sewer Scope Inspector Phone' },
        { title: 'Sewer System Inspector Company' },
        { title: 'Sewer System Inspector Email' },
        { title: 'Sewer System Inspector First Name' },
        { title: 'Sewer System Inspector Full Name' },
        { title: 'Sewer System Inspector Last Name' },
        { title: 'Sewer System Inspector Phone' },
        { title: 'Short Sale Deadline Date (date)' },
        { title: 'Short Sale Deadline Date (time)' },
        { title: 'Site Evaluation Deadline (date)' },
        { title: 'Site Evaluation Deadline (time)' },
        { title: 'Smoke Detector Compliance Company' },
        { title: 'Smoke Detector Compliance Email' },
        { title: 'Smoke Detector Compliance First Name' },
        { title: 'Smoke Detector Compliance Full Name' },
        { title: 'Smoke Detector Compliance Last Name' },
        { title: 'Smoke Detector Compliance Phone' },
        { title: 'Solar System Assumption Approval Date (date)' },
        { title: 'Solar System Assumption Approval Date (time)' },
        { title: 'Solar System Documents Deadline (date)' },
        { title: 'Solar System Documents Deadline (time)' },
        { title: 'Solar System Objection Deadline (date)' },
        { title: 'Solar System Objection Deadline (time)' },
        { title: 'Spec Sheet (date)' },
        { title: 'Spec Sheet (time)' },
        { title: 'Square Footage' },
        { title: 'Square Footage Verification Due Date (date)' },
        { title: 'Square Footage Verification Due Date (time)' },
        { title: 'ss Company' },
        { title: 'ss Email' },
        { title: 'ss First Name' },
        { title: 'ss Full Name' },
        { title: 'ss Last Name' },
        { title: 'ss Phone' },
        { title: 'Structural Engineer Inspection Deadline (date)' },
        { title: 'Structural Engineer Inspection Deadline (time)' },
        { title: 'Structural Engineer Inspection Objection Deadline (date)' },
        { title: 'Structural Engineer Inspection Objection Deadline (time)' },
        { title: 'Structural Engineer Inspection Resolution Deadline (date)' },
        { title: 'Structural Engineer Inspection Resolution Deadline (time)' },
        { title: 'Structural Inspector Company' },
        { title: 'Structural Inspector Email' },
        { title: 'Structural Inspector First Name' },
        { title: 'Structural Inspector Full Name' },
        { title: 'Structural Inspector Last Name' },
        { title: 'Structural Inspector Phone' },
        { title: 'Stucco Inspector Company' },
        { title: 'Stucco Inspector Email' },
        { title: 'Stucco Inspector First Name' },
        { title: 'Stucco Inspector Full Name' },
        { title: 'Stucco Inspector Last Name' },
        { title: 'Stucco Inspector Phone' },
        { title: 'Subdivision' },
        { title: 'Survey Defects Notification Deadline (date)' },
        { title: 'Survey Defects Notification Deadline (time)' },
        { title: 'Survey Due Date (date)' },
        { title: 'Survey Due Date (time)' },
        { title: 'Survey Report Due Date (date)' },
        { title: 'Survey Report Due Date (time)' },
        { title: 'Surveyor Company' },
        { title: 'Surveyor Email' },
        { title: 'Surveyor First Name' },
        { title: 'Surveyor Full Name' },
        { title: 'Surveyor Last Name' },
        { title: 'Surveyor Phone' },
        { title: 'Tax Withholding Documentation Due Date (date)' },
        { title: 'Tax Withholding Documentation Due Date (time)' },
        { title: 'Tenant Agent Company' },
        { title: 'Tenant Agent Email' },
        { title: 'Tenant Agent First Name' },
        { title: 'Tenant Agent Full Name' },
        { title: 'Tenant Agent Last Name' },
        { title: 'Tenant Agent Phone' },
        { title: 'Tenant Company' },
        { title: 'Tenant Email' },
        { title: 'Tenant First Name' },
        { title: 'Tenant Full Name' },
        { title: 'Tenant Last Name' },
        { title: 'Tenant Phone' },
        { title: 'Termite Inspector Company' },
        { title: 'Termite Inspector Email' },
        { title: 'Termite Inspector First Name' },
        { title: 'Termite Inspector Full Name' },
        { title: 'Termite Inspector Last Name' },
        { title: 'Termite Inspector Phone' },
        { title: 'test' },
        { title: 'test new Company' },
        { title: 'test new Email' },
        { title: 'test new First Name' },
        { title: 'test new Full Name' },
        { title: 'test new Last Name' },
        { title: 'test new Phone' },
        { title: 'testsharing Company' },
        { title: 'testsharing Email' },
        { title: 'testsharing First Name' },
        { title: 'testsharing Full Name' },
        { title: 'testsharing Last Name' },
        { title: 'testsharing Phone' },
        { title: 'Third Part Requirements Company' },
        { title: 'Third Part Requirements Email' },
        { title: 'Third Part Requirements First Name' },
        { title: 'Third Part Requirements Full Name' },
        { title: 'Third Part Requirements Last Name' },
        { title: 'Third Part Requirements Phone' },
        { title: 'This is a new detail' },
        { title: 'Thurston County Maintenance Records Due Date (date)' },
        { title: 'Thurston County Maintenance Records Due Date (time)' },
        { title: 'Thurston County Septic Inspection Due Date (date)' },
        { title: 'Thurston County Septic Inspection Due Date (time)' },
        { title: 'Time Reference Date (date)' },
        { title: 'Time Reference Date (time)' },
        { title: 'Title Agent Company' },
        { title: 'Title Agent Email' },
        { title: 'Title Agent First Name' },
        { title: 'Title Agent Full Name' },
        { title: 'Title Agent Last Name' },
        { title: 'Title Agent Phone' },
        { title: 'Title Assessments Objection Deadline (date)' },
        { title: 'Title Assessments Objection Deadline (time)' },
        { title: 'Title Commitment Date (date)' },
        { title: 'Title Commitment Date (time)' },
        { title: 'Title Commitment Due (date)' },
        { title: 'Title Commitment Due (time)' },
        { title: 'Title Commitment Ordered Deadline (date)' },
        { title: 'Title Commitment Ordered Deadline (time)' },
        { title: 'Title Commitment Received (date)' },
        { title: 'Title Commitment Received (time)' },
        { title: 'Title Contingency (date)' },
        { title: 'Title Contingency (time)' },
        { title: 'Title Cure Period Deadline (date)' },
        { title: 'Title Cure Period Deadline (time)' },
        { title: 'Title Defect Notice Date (date)' },
        { title: 'Title Defect Notice Date (time)' },
        { title: 'Title Evidence Deadline (date)' },
        { title: 'Title Evidence Deadline (time)' },
        { title: 'Title Insurance Commitment Due Date (date)' },
        { title: 'Title Insurance Commitment Due Date (time)' },
        { title: 'Title Objection Due Date (date)' },
        { title: 'Title Objection Due Date (time)' },
        { title: 'Title Objection Seller Reply Deadline (date)' },
        { title: 'Title Objection Seller Reply Deadline (time)' },
        { title: 'Title Recording Date (date)' },
        { title: 'Title Recording Date (time)' },
        { title: 'Title Resolution Deadline (date)' },
        { title: 'Title Resolution Deadline (time)' },
        { title: 'TOM Fee Deadline (date)' },
        { title: 'TOM Fee Deadline (time)' },
        { title: 'Total Encumberances' },
        { title: 'Transaction Coordination Fee' },
        { title: 'Transaction Coordinator Company' },
        { title: 'Transaction Coordinator Email' },
        { title: 'Transaction Coordinator First Name' },
        { title: 'Transaction Coordinator Full Name' },
        { title: 'Transaction Coordinator Last Name' },
        { title: 'Transaction Coordinator Phone' },
        { title: 'Transaction Number' },
        { title: 'Type of Mortgage' },
        { title: 'Utilities Provider Company' },
        { title: 'Utilities Provider Email' },
        { title: 'Utilities Provider First Name' },
        { title: 'Utilities Provider Full Name' },
        { title: 'Utilities Provider Last Name' },
        { title: 'Utilities Provider Phone' },
        { title: 'Utility Information Due Date (date)' },
        { title: 'Utility Information Due Date (time)' },
        { title: 'Verification of Funds Due Date (date)' },
        { title: 'Verification of Funds Due Date (time)' },
        { title: 'Water Inspection Due Date (date)' },
        { title: 'Water Inspection Due Date (time)' },
        { title: 'Water Inspector Company' },
        { title: 'Water Inspector Email' },
        { title: 'Water Inspector First Name' },
        { title: 'Water Inspector Full Name' },
        { title: 'Water Inspector Last Name' },
        { title: 'Water Inspector Phone' },
        { title: 'Water Rights Documents Delivery Deadline (date)' },
        { title: 'Water Rights Documents Delivery Deadline (time)' },
        { title: 'Water Rights Documents Objections Deadline (date)' },
        { title: 'Water Rights Documents Objections Deadline (time)' },
        { title: 'Water Rights Documents Resolution Deadline (date)' },
        { title: 'Water Rights Documents Resolution Deadline (time)' },
        { title: 'Well Documents Delivery Deadline (date)' },
        { title: 'Well Documents Delivery Deadline (time)' },
        { title: 'Well Documents Due Date (date)' },
        { title: 'Well Documents Due Date (time)' },
        { title: 'Well Documents Objection Deadline (date)' },
        { title: 'Well Documents Objection Deadline (time)' },
        { title: 'Well Documents Resolution Deadline (date)' },
        { title: 'Well Documents Resolution Deadline (time)' },
        { title: 'Well Inspection Contingency (date)' },
        { title: 'Well Inspection Contingency (time)' },
        { title: 'Well Inspection Due Date (date)' },
        { title: 'Well Inspection Due Date (time)' },
        { title: 'Well Inspector Company' },
        { title: 'Well Inspector Email' },
        { title: 'Well Inspector First Name' },
        { title: 'Well Inspector Full Name' },
        { title: 'Well Inspector Last Name' },
        { title: 'Well Inspector Phone' },
        { title: 'Well Water Inspection Due Date (date)' },
        { title: 'Well Water Inspection Due Date (time)' },
        { title: 'Well Water Inspector Company' },
        { title: 'Well Water Inspector Email' },
        { title: 'Well Water Inspector First Name' },
        { title: 'Well Water Inspector Full Name' },
        { title: 'Well Water Inspector Last Name' },
        { title: 'Well Water Inspector Phone' },
        { title: 'Wetlands Determination Inspection Due Date (date)' },
        { title: 'Wetlands Determination Inspection Due Date (time)' },
        { title: 'Wetlands Determination Inspector Company' },
        { title: 'Wetlands Determination Inspector Email' },
        { title: 'Wetlands Determination Inspector First Name' },
        { title: 'Wetlands Determination Inspector Full Name' },
        { title: 'Wetlands Determination Inspector Last Name' },
        { title: 'Wetlands Determination Inspector Phone' },
        { title: 'Wind Mitigation Inspector Company' },
        { title: 'Wind Mitigation Inspector Email' },
        { title: 'Wind Mitigation Inspector First Name' },
        { title: 'Wind Mitigation Inspector Full Name' },
        { title: 'Wind Mitigation Inspector Last Name' },
        { title: 'Wind Mitigation Inspector Phone' },
        { title: 'Wood Destroying Insects Inspection Due Date (date)' },
        { title: 'Wood Destroying Insects Inspection Due Date (time)' },
        { title: 'Wood Destroying Insects Inspector Company' },
        { title: 'Wood Destroying Insects Inspector Email' },
        { title: 'Wood Destroying Insects Inspector First Name' },
        { title: 'Wood Destroying Insects Inspector Full Name' },
        { title: 'Wood Destroying Insects Inspector Last Name' },
        { title: 'Wood Destroying Insects Inspector Phone' },
        { title: 'WoodPecker Surveyor Company' },
        { title: 'WoodPecker Surveyor Email' },
        { title: 'WoodPecker Surveyor First Name' },
        { title: 'WoodPecker Surveyor Full Name' },
        { title: 'WoodPecker Surveyor Last Name' },
        { title: 'WoodPecker Surveyor Phone' },
        { title: 'WQEWQ' },
        { title: 'Written Loan Conditions Deadline (date)' },
        { title: 'Written Loan Conditions Deadline (time)' },
        { title: 'Written Statement Due Date (date)' },
        { title: 'Written Statement Due Date (time)' },
        { title: 'Year Built' },
      ];
      const contacts = await Contacts.find({});
      // var roles = []
      if (contacts && contacts.length > 0) {
        for await (let contact of contacts) {
          if (contact.roles && contact.roles.length > 0) {
            for await (let role of contact.roles) {
              if (checkExistence(roles, role) == false) {
                roles.push({ title: role });
              }
            }
          }
        }
      }

      db.collection('transactiondata')
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
            $project: {
              title: '$title',
              mile_stone: '$mile_stone',
              document: '$document',
              instructions: '$instructions',
              owner: '$owner',
              template: '$template',
              transactionId: '$transaction',
              transactionId: '$transaction.routes',

              sharing_setting: '$sharing_setting',
              days: '$days',
              date: '$date',
              time: '$time',
              value: '$value',
              dayType: '$dayType',
              timing: '$timing',
              addedBy: '$addedBy',
              referenceDate: '$referenceDate',
              addedById: '$addedBy._id',
              type: '$type',
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
          db.collection('transactiondata')
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

              // Converting id to string as in remider table there is no referencing for key as it belongs to many collection
              { $addFields: { taskid: { $toString: '$_id' } } },

              {
                $lookup: {
                  from: 'reminders',
                  localField: 'taskid',
                  foreignField: 'data_id',
                  as: 'reminderCount',
                },
              },
              {
                $addFields: {
                  reminderCount: { $size: '$reminderCount' }, // Calculating total of reminders of particular task
                },
              },

              {
                $project: {
                  title: '$title',
                  mile_stone: '$mile_stone',
                  document: '$document',
                  template: '$template',
                  transactionId: '$transaction',

                  instructions: '$instructions',
                  owner: '$owner',
                  sharing_setting: '$sharing_setting',
                  days: '$days',
                  date: '$date',
                  time: '$time',
                  value: '$value',
                  dayType: '$dayType',
                  timing: '$timing',
                  referenceDate: '$referenceDate',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  type: '$type',
                  createdAt: '$createdAt',
                  isDeleted: '$isDeleted',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  reminderCount: '$reminderCount',
                },
              },
              {
                $match: query,
              },
              {
                $sort: sortquery,
              },

              //   {
              //     $skip: Number(skipNo),
              //   },
              //   {
              //     $limit: Number(count),
              //   },
            ])
            .toArray(async (err, result) => {
              // const response = roles.concat(result);
              var roleslist = [];
              const regexp = new RegExp(search, 'i');
              filterTest = roles.filter((x) => regexp.test(x.title));
              if (filterTest.length > 0) {
                for await (let itm of filterTest) {
                  roleslist.push({ title: itm.title, fullName: itm.title });
                }
              }
              const unique = await uniqueArray(result, 'title'); //Array.from(new Set(result.map(JSON.stringify))).map(JSON.parse);
              response = roleslist.concat(unique);

              await new Promise((resolve) => setTimeout(resolve, 2000));
              return res.status(200).json({
                success: true,
                code: 200,
                data: response,
                total: response.length,
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

  sendEmailTemplate: async function (req, res) {
    var data = req.body;
    if (!data.to || data.to == undefined) {
      return res
        .status(400)
        .json({ success: false, code: 400, messaeg: 'Enter email' });
    }
    try {
      const sendEmail = await sendEmailTemplates({
        email: data.to,

        subject: data.subject,
        body: data.body,
      });
      return res
        .status(200)
        .json({ success: true, code: 200, message: 'Email sent succesfully.' });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },

  markTransactionCompleteSkippedClosed: async (req, res) => {
    try {
      const data = req.body;

      if (!data.transactionStatus && !data.transactionId && !data.status) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Payload missing' },
        });
      }
      query = {};
      query.isDeleted = false;
      query.transaction = String(data.transactionId);
      query.type = { in: ['Dates', 'Checklist'] };
      query.status = 'open';
      const total = await TransactionData.update(query, {
        status: data.status,
      });
      transactionDataToUpdate = {};
      if (data.status && data.status == 'closed') {
        transactionDataToUpdate.closingDate = new Date();
      }
      transactionDataToUpdate.status = data.transactionStatus;
      const updatedTransaction = await Transactions.update(
        { id: data.transactionId },
        transactionDataToUpdate
      );

      return res.status(200).json({
        success: true,
        message: `Transaction ${data.transactionStatus} successfully.`,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};

function uniqueArray(array, propertyName) {
  return array.filter(
    (e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i
  );
}

sendEmailTemplates = function (options) {
  var email = options.email;
  var cc = options.cc;
  var subject = options.subject;
  var body = options.body;

  var firstName = options.firstName;
  var password = options.password;

  if (!firstName) {
    firstName = email;
  }
  message = '';
  style = {
    header: `
          padding:30px 15px;
          text-align:center;
          background-color:#f2f2f2;
          `,
    body: `
          padding:15px;
          height: 230px;
          `,
    hTitle: `font-family: 'Raleway', sans-serif;
          font-size: 37px;
          height:auto;
          line-height: normal;
          font-weight: bold;
          background:none;
          padding:0;
          color:#333;
          `,
    maindiv: `
          width:600px;
          margin:auto;
          font-family: Lato, sans-serif;
          font-size: 14px;
          color: #333;
          line-height: 24px;
          font-weight: 300;
          border: 1px solid #eaeaea;
          `,
    textPrimary: `color:#3e3a6e;
          `,
    h5: `font-family: Raleway, sans-serif;
          font-size: 22px;
          background:none;
          padding:0;
          color:#333;
          height:auto;
          font-weight: bold;
          line-height:normal;
          `,
    m0: `margin:0;`,
    mb3: 'margin-bottom:15px;',
    textCenter: `text-align:center;`,
    btn: `padding:10px 30px;
          font-weight:500;
          font-size:14px;
          line-height:normal;
          border:0;
          display:inline-block;
          text-decoration:none;
          `,
    btnPrimary: `
          background-color:#3e3a6e;
          color:#fff;
          `,
    footer: `
          padding:10px 15px;
          font-weight:500;
          color:#fff;
          text-align:center;
          background-color:#000;
          `,
  };

  message +=
    `<div class="container" style="` +
    style.maindiv +
    `">
      <div class="header" style="` +
    style.header +
    `text-align:center">
          <img src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png" style="margin-bottom:20px;  width=100px;" />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Email Template</h2>
      </div>
      <div class="body" style="` +
    style.body +
    `">
          <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `">Hello ` +
    firstName +
    `</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">You recieved email template. <br>
          
          </p>
      

          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Email: ${email} <br>
              
              </p>

              <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Subject: ${subject} <br>
                  
                  </p>
                  <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Body: ${body} <br>
                                
                                </p>
      </div>
     
      <div class="footer" style="` +
    style.footer +
    `">
      &copy 2021 Smart Cloze   All rights reserved.
      </div>
    </div>`;

  SmtpController.sendEmail(email, 'Email Template', message);
};

function checkExistence(arr, value) {
  return arr.some(function (el) {
    return el.title === value;
  });
}

function sorting(options) {
  console.log(options);
  options.sort(function (a, b) {
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    return new Date(b.date) - new Date(a.date);
  });

  return options;
}
