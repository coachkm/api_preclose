/**
 * TransactionsTemplatesController
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
  add: async (req, res) => {
    try {
      const data = req.body;
      if (!data.title || data.title == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 400, message: constantObj.Transaction.TITLE_REQUIRED },
        });
      }
      data.title = data.title;
      // const template = await TransactionsTemplates.findOne({
      //   title: data.title,
      // });
      // if (template) {
      //   return res.status(400).json({
      //     success: false,
      //     error: { code: 400, message: constantObj.Transaction.TEMPLATE_EXIST },
      //   });
      // } else {
      data.addedBy = req.identity.id;
      const createdTAsk = await TransactionsTemplates.create(data).fetch();

      return res.status(200).json({
        success: true,
        message: constantObj.Transaction.TEMPLATE_CREATED,
        id: createdTAsk.id,
      });
      // }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  detail: async (req, res) => {
    try {
      const id = req.param('id');
      const task = await TransactionsTemplates.findOne({ id: id });
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

  getTransactionTemplatesListing: async (req, res) => {
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
        query.$or = [{ title: { $regex: search, $options: 'i' } }];
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

      var user_ids = [];
      user_ids.push(ObjectId(req.identity.id));
      contactsIds = [req.identity.id];
      if (req.identity.addedBy) {
        console.log('Here');
        contactsIds.push(req.identity.addedBy);
        user_ids.push(ObjectId(req.identity.addedBy));
        // const adminUsers = await Users.find({addedBy:req.identity.addedBy,isDeleted:false})
        // console.log(adminUsers.length)
        // if(adminUsers && adminUsers.length > 0){
        //   for await (let user of adminUsers){
        //     contactsIds.push(user.id)
        //   }
        // }
      }
      const conatcts = await Users.find({
        addedBy: { in: contactsIds },
        isDeleted: false,
      });

      if (conatcts && conatcts.length > 0) {
        for await (let itm of conatcts) {
          user_ids.push(ObjectId(itm.id));
        }
      }
      // query.addedById = ObjectId(req.identity.id);

      query.addedById = { $in: user_ids };
      // console.log(query)
      db.collection('transactionstemplates')
        .aggregate([
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
          db.collection('transactionstemplates')
            .aggregate([
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

  update: async (req, res) => {
    try {
      const id = req.param('id');
      const data = req.body;
      data.title = data.title.toLowerCase();
      var existedTemplate = await TransactionsTemplates.findOne({
        name: data.title,
        id: { '!=': id },
      });
      if (existedTemplate) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.Transaction.TEMPLATE_EXIST },
        });
      } else {
        const updatedTask = await TransactionsTemplates.update(
          { id: id },
          data
        );
        return res.status(200).json({
          success: true,
          message: constantObj.Transaction.TEMPLATE_UPDATED,
        });
      }
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

  removeTemplate: async (req, res) => {
    try {
      const id = req.param('id');
      const deletedTask = await TransactionsTemplates.update(
        { id: id },
        { isDeleted: true }
      );
      return res.status(200).json({
        success: true,
        message: constantObj.Transaction.TEMPLATE_REMOVED,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  /**Used to duplicate transaction template */

  duplicateTemplate: async (req, res) => {
    try {
      const data = req.body;
      if (!data.templateId || data.templateId == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.tasks.TEMPLATE_REQUIRED },
        });
      }

      if (!data.title || data.title == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.Transaction.TITLE_REQUIRED },
        });
      }
      data.title = data.title;

      const existingTemplate = await TransactionsTemplates.findOne({
        id: data.templateId,
      });
      if (!existingTemplate) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.tasks.TEMPLATE_NOT_FOUND },
        });
      } else {
        data.addedBy = req.identity.id;
        const createdTAsk = await TransactionsTemplates.create({
          title: data.title,
          addedBy: req.identity.id,
        }).fetch();

        const documentDetail = await DocumentDetail.find({
          template: data.templateId,
        });
        if (documentDetail.length > 0) {
          documentDetail.forEach(async (detail) => {
            delete detail.id;
            detail.template = createdTAsk.id;
            detail.addedBy = req.identity.id;
            await DocumentDetail.create(detail).fetch();
          });
        }

        const templateTasks = await TemplateTasks.find({
          template: data.templateId,
        });
        var counter = 0;
        if (templateTasks.length > 0) {
          // templateTasks.forEach(async (detail) => {
          for await (const detail of templateTasks) {
            const reminders = await Reminders.find({
              isDeleted: false,
              data_id: detail.id,
            });
            delete detail.id;
            detail.template = createdTAsk.id;
            detail.addedBy = req.identity.id;
            const createdTask = await TemplateTasks.create(detail).fetch();
            if (reminders && reminders.length > 0) {
              for await (const itm of reminders) {
                itm.data_id = createdTask.id;
                delete itm.id;
                delete data.createdAt;
                delete data.updatedAt;
                const createdReminder = await Reminders.create(itm);
              }
            }
          }

          // for (let i = 0; i < templateTasks.length; i++) {
          //   let newdata = templateTasks[i];
          //   if (newdata.days == '') {
          //     delete newdata.days;
          //   }
          //   if (newdata.days) {
          //     newdata.days = Number(newdata.days);
          //   }
          //   //console.log(templateTasks[i],"Template task")
          //   const reminders = await Reminders.find({
          //     isDeleted: false,
          //     data_id: newdata.id,
          //   });
          //   newdata.referenceId = newdata.id;
          //   newdata.dateReference = newdata.referenceDate;
          //   delete newdata.id;
          //   newdata.sharing_setting = templateTasks[i].sharing_setting;

          //   delete newdata.createdAt;
          //   delete newdata.updatedAt;
          //   newdata.addedBy = req.identity.id;
          //   newdata.template = data.templateId;
          //   delete newdata.addedBy;
          //   const createdTask = await TemplateTasks.create(newdata).fetch();

          //   //console.log(createdTask)
          //   if (reminders && reminders.length > 0) {
          //     for await (const itm of reminders) {
          //       itm.data_id = createdTask.id;
          //       delete itm.id;
          //       delete data.createdAt;
          //       delete data.updatedAt;
          //       const createdReminder = await Reminders.create(itm);
          //     }
          //   }

          //   counter++;
          // }
        }

        return res.status(200).json({
          success: true,
          message: constantObj.tasks.DUPLICATE_SUCCESS,
        });
      }
    } catch (err) {
      console.log('_________________________________');
      console.log(err);
      console.log('_________________________________');
      return res.status(400).json({
        suucess: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },
};
