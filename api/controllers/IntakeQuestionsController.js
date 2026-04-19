/**
 * IntakeQuestionsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
module.exports = {
  addIntakeQuestions: async (req, res) => {
    var data = req.body;
    try {
      data.question = data.question.toLowerCase();
    //   const question = await IntakeQuestions.findOne({
    //  // question: data.question,
    //     workflow:data.workflow,
    //     isDeleted:false
    //   });

    //   if (question) {
    //     return res.status(400).json({
    //       success: false,
    //       error: {
    //         code: 400,
    //         message: constantObj.intakeQuestions.ALREADY_EXIST,
    //       },
    //     });
    //   } else {
      const admintotal = await IntakeQuestions.count({workflow:null})
       const total = await IntakeQuestions.count({workflow:data.workflow})
       data.index = admintotal+total + 1
       data.addedBy = req.identity.id
        if(req.identity.role == 'admin'){
          data.canDrag = false
        }
        var created = await IntakeQuestions.create(data).fetch();
       
        
        return res.status(200).json({
          success: true,
          message: constantObj.intakeQuestions.CREATED,
        });
    //  }
    } catch (err) {
      return res.status(200).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  addUsersIntake: async (req, res) => {
    var data = req.body;
    try {
      data.question = data.question.toLowerCase();
      const question = await IntakeQuestions.findOne({
        question: data.question,
      });

      if (question) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constantObj.intakeQuestions.ALREADY_EXIST,
          },
        });
      } else {
        data.addedBy = req.identity.id;
        const created = await IntakeQuestions.create(data);

        return res.status(200).json({
          success: true,
          message: constantObj.intakeQuestions.CREATED,
        });
      }
    } catch (err) {
      return res.status(200).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  updateQuestion: async (req, res) => {
    try {
      var data = req.body;
      const id = req.param('id');
      data.question = data.question.toLowerCase();
      if(req.identity.role=="admin"){
        const intake = await IntakeQuestions.findOne({ id: id });
        const updated = await IntakeQuestions.update({ question: intake.question }, data);
      }else{
        const updated = await IntakeQuestions.update({ id: id }, data);
      }

      return res.status(200).json({
        success: true,
        message: constantObj.intakeQuestions.UPDATED,
      });
    } catch (err) {
      return res.status(200).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getDetail: async (req, res) => {
    try {
      const { id } = req.query;
      const detail = await IntakeQuestions.findOne({ id: id }).populate(
        'contactType'
      );
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

  getListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');

      var isDeleted = req.param('isDeleted');

      var workflow_id = req.param('workflow');
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
          { question: { $regex: search, $options: 'i' } },
          { pattern: { $regex: search, $options: 'i' } },
        ];
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
      if (workflow_id && type === 'all') {
        query.workflow = null
        // query.workflow = { $in: [ObjectId(workflow_id), null] };
      } else if (workflow_id && !type) {
        query.workflow = ObjectId(workflow_id);
      }else{
        query.workflow = null
      }
      var sortQuery = {}
      if(req.identity.role == 'admin'){
        sortQuery = { createdAt: 1}
      }
      else{
        sortQuery = { index: 1}
      }
      //console.log(req.identity.role)
      //console.log(query);

      db.collection('intakequestions')
        .aggregate([
          {
            $lookup: {
              from: 'contacttype',
              localField: 'contactType',
              foreignField: '_id',
              as: 'contactType',
            },
          },
          {
            $unwind: {
              path: '$contactType',
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
              question: '$question',
              pattern: '$pattern',
              contactType: '$contactType',
              type: '$type',
              text: '$text',
              workflow: '$workflow',
              options:'$options',
              index:'$index',
              status: '$status',
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
          db.collection('intakequestions')
            .aggregate([
              {
                $lookup: {
                  from: 'contacttype',
                  localField: 'contactType',
                  foreignField: '_id',
                  as: 'contactType',
                },
              },
              {
                $unwind: {
                  path: '$contactType',
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
                  question: '$question',
                  pattern: '$pattern',
                  status: '$status',
                  contactType: '$contactType',
                  options:'$options',
                  type: '$type',
                  text: '$text',
                  index:'$index',
                  workflow: '$workflow',
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
                $sort: sortQuery
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
  /**
   * 
   * @param {*} req 
   * @param {*} res 
   * @returns 
   * @description:: Used to update the index of questions(i.e drag and drop functionality)
   */
  updateIndex: async (req, res)=>{
    try{
      const data = req.body.data
      if(data && data.length > 0){
        for (let i = 0; i < data.length; i++) {
          const element = data[i];
          const id = element.id ? id: element._id    
          const updatedIndex = await IntakeQuestions.update({id:id},{index:element.index})         
        }

        return res.status(200).json({
          success:true,
          message:constantObj.intakeQuestions.INDEX_UPDATED
        })
      }else{
        return res.status(400).json({
          success:false,
          error:{code:400,message:constantObj.intakeQuestions.NOT_FOUND}
        })
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  }
};
