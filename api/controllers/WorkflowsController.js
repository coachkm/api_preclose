/**
 * WorkflowsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
module.exports = {
  addWorkFlow: async (req, res) => {
    try {
      const data = req.body;
      if (!data.title || data.title == undefined) {
        returnres.status(404).json({
          success: false,
          error: { code: 400, message: constantObj.Workflow.TITLE_REQUIRED },
        });
      } else {
        let query = {};
        query.isDeleted = false;
        query.addedBy = req.identity.id;
        query.title = data.title

        data.addedBy = req.identity.id;

        const createdWorkFlow = await Workflows.create(data).fetch();


        const defaultIntakeQuestions = await IntakeQuestions.find({ workflow: null, isDeleted: false })
        //console.log(defaultIntakeQuestions.length,"defaultIntakeQuestions======",defaultIntakeQuestions)

        if (defaultIntakeQuestions && defaultIntakeQuestions.length > 0) {
          defaultIntakeQuestions.forEach(async element => {
            delete element.id
            element.workflow = createdWorkFlow.id

            const created = await IntakeQuestions.create(element);

          });

          return res.status(200).json({
            success: true,
            message: constantObj.Workflow.CREATED,
            id: createdWorkFlow.id
          });
        }
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: err + '' },
      });
    }
  },

  getWorkFlows: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');

      var isDeleted = req.param('isDeleted');

      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 1000000;
      }
      var skipNo = (page - 1) * count;
      var query = {};
      if (search) {
        query.$or = [{ title: { $regex: search, $options: 'i' } }];
      }

      query.isDeleted = false;

      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }

      addedByIds = []



      addedByIds.push(ObjectId(req.identity.id))

      const userQuery = {}
      addedBy = [req.identity.id]
      userQuery.isDeleted = false
      

      if (req.identity.addedBy) {

        addedByIds.push(ObjectId(req.identity.addedBy))
        addedBy.push(req.identity.addedBy)
      }
      userQuery.addedBy  = {in:addedBy}
      const addedUsers = await Users.find(userQuery)

      if(addedUsers && addedUsers.length > 0){
        addedUsers.forEach(element => {
          addedByIds.push(ObjectId(element.id))
          });
      }
      query.addedBy = {$in:addedByIds}
      db.collection('workflows')
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
              title: '$title',
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
          db.collection('workflows')
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
                  title: '$title',
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
};
