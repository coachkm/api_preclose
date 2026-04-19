/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const bcrypt = require('bcrypt-nodejs');
var constantObj = sails.config.constants;
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
const db = sails.getDatastore().manager;
const csv = require('csv-writer');
var ObjectId = require('mongodb').ObjectID;

const safeCred = require('../../config/local');
const { option } = require('grunt');
// const accountSid = safeCred.twilio.TWILIO_ACCOUNT_SID;
// const authToken = safeCred.twilio.TWILIO_AUTH_TOKEN;

// const client = require("twilio")(accountSid, authToken);

var stripe = require('stripe')(constant.PAYMENT_INFO.SECREATKEY);
generateVeificationCode = function () {
  // action are perform to generate VeificationCode for user
  var length = 9,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    retVal = '';

  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

generateOTP = function () {
  // action are perform to generate random OTP for user
  var length = 4,
    charset = '0123456789',
    retVal = '';
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

module.exports = {
  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to register User
   */
  // register: async (req, res) => {
  //   if (!req.body.mobileNo || typeof req.body.mobileNo == undefined) {
  //     return res.status(404).json({
  //       success: false,
  //       error: { code: 404, message: constantObj.user.MOBILE_REQUIRED },
  //     });
  //   }
  //   if (!req.body.password || typeof req.body.password == undefined) {
  //     return res.status(404).json({
  //       success: false,
  //       error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
  //     });
  //   }
  //   var date = new Date();

  //   let query = {};
  //   if (req.body.email) {
  //     req.body.email.toLowerCase();
  //   }
  //   query.email = req.body.email.toLowerCase();
  //   try {
  //     var user = await Users.findOne(query);
  //     if (user) {
  //       return res.status(400).json({
  //         success: false,
  //         error: { code: 400, message: constantObj.user.ACCOUNT_EXIST },
  //       });
  //     } else {
  //       req.body['date_registered'] = date;
  //       req.body['date_verified'] = date;
  //       req.body['status'] = 'active';
  //       req.body['role'] = 'user';
  //       req.body['participant_id'] = new Date().getTime();

  //       if (req.body.firstName && req.body.lastName) {
  //         req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
  //       }

  //       const OTP = generateOTP();
  //       req.body['otp'] = OTP;
  //       var newUser = await Users.create(req.body).fetch();
  //       if (newUser) {
  //         if (req.body.email) {
  //           userVerifyLink({
  //             email: newUser.email,
  //             fullName: newUser.fullName,
  //             id: newUser.id,
  //           });
  //         }
  //         let mobileNo = req.body.countryCode + req.body.mobileNo;
  //         //console.log(mobileNo);
  //         // client.messages
  //         // .create({
  //         //     body: '[#] Use ' + OTP + ' as your verification code for Casareward. The otp expires within 10 mins. - Casareward.com',
  //         //     from:safeCred.twillioNumber,
  //         //     to: mobileNo,
  //         // })
  //         // .then(message => //console.log(message.sid,"-----OTP sent from twilio"));

  //         return res.status(200).json({
  //           success: true,
  //           code: 200,
  //           data: newUser.id,
  //           message: constantObj.user.SUCCESSFULLY_REGISTERED,
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     return res.status(400).json({ success: true, code: 400, error: err });
  //   }
  // },

  register: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }
    if (!req.body.password || typeof req.body.password == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }
    var date = new Date();
    var inviteId = req.body.addedBy;
    // console.log(inviteId,"---------------------->inviteId");
    try {
      if (inviteId) {
        // console.log(inviteId,"-----------------------> invitedId")
        let existUser = await Users.findOne({ id: req.body.id });
        console.log(existUser);
        if (existUser) {
          // console.log(existUser,"------------------------>existUser")
          var newPassword = req.body.password;
          var encryptedPassword = bcrypt.hashSync(
            newPassword,
            bcrypt.genSaltSync(10)
          );
          let update = await Users.update(
            { id: existUser.id },
            {
              encryptedPassword: encryptedPassword,
              isVerified: 'Y',
              status: 'active',
              isDeleted: false,
            }
          );

          const emailTemplates = await EmailTemplates.find({
            addedBy: existUser.addedBy,
            isDeleted: false,
          });
          if (emailTemplates && emailTemplates.length > 0) {
            for await (let itm of emailTemplates) {
              delete itm.id;
              delete itm.createdAt;
              delete itm.uppdatedAt;
              itm.addedBy = existUser.id;

              const createdTemplate = await EmailTemplates.create(itm);
            }
          }
          // const workFlows = await Workflows.find({addedBy:existUser.addedBy,isDeleted:false})

          // if(workFlows && workFlows.length >0){

          //   workFlows.forEach(async itm => {

          //   // for await(let itm of workFlows){
          //     const intakeQuestion = await IntakeQuestions.find({workflow: itm.id,isDeleted:false})
          //     delete itm.id
          //     delete itm.createdAt
          //     delete itm.addedBy
          //     delete itm.updatedAt
          //     itm.addedBy = existUser.id
          //     itm.invitedTemplate = "yes"

          //     const createdWorkFlow = await Workflows.create(itm).fetch()

          //     if(intakeQuestion && intakeQuestion.length > 0){
          //       for await (let itm of intakeQuestion){
          //         itm.workflow = createdWorkFlow.id
          //         itm.addedBy = existUser.id
          //         delete itm.id
          //         delete itm.createdAt
          //         delete itm.updatedAt

          //         const createdIntakeQuestion = await IntakeQuestions.create(itm)
          //       }
          //     }
          //   // }

          // });
          // }

          // const transactionTemplates = await TransactionsTemplates.find({addedBy:existUser.addedBy,isDeleted:false})

          // if(transactionTemplates && transactionTemplates.length > 0){

          //   transactionTemplates.forEach(async itm => {

          //   // for await (let itm of transactionTemplates){
          //     const documents = await DocumentDetail.find({template:itm.id,isDeleted:false})

          //     const templateTasks = await TemplateTasks.find({ template:itm.id, isDeleted: false })
          //     delete itm.id
          //     delete itm.createdAt
          //     delete itm.uppdatedAt
          //     itm.addedBy = existUser.id
          //     const createdTemplate =  await TransactionsTemplates.create(itm).fetch()
          //     if(documents && documents.length > 0){

          //       documents.forEach(async itm => {

          //       // for await (let itm of documents){
          //         delete itm.id
          //         delete itm.createdAt
          //         delete itm.uppdatedAt
          //         delete itm.referenceDate
          //         itm.addedBy = existUser.id
          //         itm.template = createdTemplate.id

          //         const createdDocuments = await DocumentDetail.create(itm)
          //       // }
          //     });
          //     }

          //     counter = 0
          //     if (templateTasks && templateTasks.length > 0) {
          //       for (let i = 0; i < templateTasks.length; i++) {
          //         let newdata = templateTasks[i]
          //         if (newdata.days == '') {
          //           delete newdata.days
          //         }
          //         if (newdata.days) {
          //           newdata.days = Number(newdata.days)
          //         }
          //        delete newdata.referenceId
          //         delete newdata.id
          //         newdata.rank = counter
          //         delete newdata.createdAt
          //         delete newdata.updatedAt
          //         newdata.addedBy = existUser.id
          //         newdata.template = createdTemplate.id
          //         delete newdata.addedBy

          //         const createdTask = await TransactionData.create(newdata).fetch()

          //         counter++

          //       }
          //     }

          //   // }

          // });
          // }
          var token = jwt.sign(
            { user_id: existUser.id, firstName: existUser.firstName },
            {
              issuer: 'jcsoftwaresolution',
              subject: existUser.email,
              audience: 'public',
            }
          );
          existUser.access_token = token;

          var userDetail = existUser;
          if (userDetail.addedBy && userDetail.addedBy != null) {
            do {
              var parentUser = await Users.findOne({ id: userDetail.addedBy });
              userDetail = parentUser;
            } while (userDetail.addedBy && userDetail.addedBy != null);
            existUser.masterAccount = userDetail;
          }
          return res.status(200).json({
            success: true,
            code: 200,
            data: existUser,
            message: constantObj.user.SUCCESSFULLY_REGISTERED,
          });
        }
      } else {
        var user = await Users.findOne({
          email: req.body.email.toLowerCase(),
          isDeleted: false,
        });
        if (user) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constantObj.user.EMAIL_EXIST },
          });
        } else {
          req.body['date_registered'] = date;
          req.body['date_verified'] = date;
          req.body['status'] = 'active';
          req.body['role'] = 'agent';

          if (req.body.firstName && req.body.lastName) {
            req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
          }
          const today = new Date();
          let validUpto = new Date();
          validUpto.setDate(today.getDate() + 7);
          req.body['planName'] = 'Trail';
          req.body['validFrom'] = today;
          req.body['validupto'] = validUpto;

          var newUser = await Users.create(req.body).fetch();
          if (newUser) {
            userVerifyLink({
              email: newUser.email,
              fullName: newUser.fullName,
              id: newUser.id,
            });
            var workFlow = {};
            workFlow.title = 'default intake';
            workFlow.addedBy = newUser.id;

            const createdWorkFlow = await Workflows.create(workFlow).fetch();

            const defaultIntakeQuestions = await IntakeQuestions.find({
              workflow: null,
              isDeleted: false,
            });

            if (defaultIntakeQuestions && defaultIntakeQuestions.length > 0) {
              defaultIntakeQuestions.forEach(async (element) => {
                delete element.id;
                element.workflow = createdWorkFlow.id;

                const created = await IntakeQuestions.create(element);
              });
            }
            var token = jwt.sign(
              { user_id: newUser.id, firstName: newUser.firstName },
              {
                issuer: 'jcsoftwaresolution',
                subject: newUser.email,
                audience: 'public',
              }
            );
            newUser.access_token = token;
            return res.status(200).json({
              success: true,
              code: 200,
              data: newUser,
              message: constantObj.user.SUCCESSFULLY_REGISTERED,
            });
          }
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({ success: false, code: 400, error: err });
    }
  },

  /**
   *
   * @reqBody  : {email,password}
   * @param {*} res
   * @returns
   */
  adminSignin: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    if (!req.body.password || typeof req.body.password == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }

    var user = await Users.findOne({
      email: req.body.email.toLowerCase(),
      isDeleted: false,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.INVALID_CRED },
      });
    }

    if (user && user.status == 'deactive') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
      });
    }

    if (user && user.status != 'active' && user.isVerified != 'Y') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
      });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.WRONG_PASSWORD },
      });
    } else {
      var token = jwt.sign(
        { user_id: user.id, firstName: user.firstName },
        {
          issuer: 'jcsoftwaresolution',
          subject: user.email,
          audience: 'public',
        }
      );

      user.access_token = token;

      return res.status(200).json({
        success: true,
        code: 200,
        message: constantObj.user.SUCCESSFULLY_LOGGEDIN,
        data: user,
      });
    }
  },

  /*
   *changePassword
   */
  changePassword: async function (req, res) {
    if (!req.body.newPassword || typeof req.body.newPassword == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }

    if (
      !req.body.confirmPassword ||
      typeof req.body.confirmPassword == undefined
    ) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.CONPASSWORD_REQUIRED },
      });
    }

    if (
      !req.body.currentPassword ||
      typeof req.body.currentPassword == undefined
    ) {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: constantObj.user.CURRENTPASSWORD_REQUIRED,
        },
      });
    }
    let data = req.body;
    let newPassword = data.newPassword;
    let currentPassword = data.currentPassword;

    let query = {};
    query.id = req.identity.id;

    Users.findOne(query).then((user) => {
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.CURRENT_PASSWORD },
        });
      } else {
        var encryptedPassword = bcrypt.hashSync(
          newPassword,
          bcrypt.genSaltSync(10)
        );
        Users.update(
          { id: req.identity.id },
          { encryptedPassword: encryptedPassword }
        ).then(function (user) {
          return res.status(200).json({
            success: true,
            message: constantObj.user.PASSWORD_CHANGED,
          });
        });
      }
    });
  },

  /**
   *
   * @param {*} req.body {email:"",password:""}
   * @param {*} res
   * @returns detail of the user
   * @description: Used to signup for user
   */
  userSignin: async (req, res) => {
    if (!req.body.password || typeof req.body.password == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }

    var query = {};

    query.email = req.body.email;

    query.role = { nin: ['admin'] };
    query.isDeleted = false;

    var userDetails = await Users.find(query);
    var user = userDetails[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.INVALID_CRED },
      });
    }

    if (user && user.status != 'active') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
      });
    }
    if (user.isVerified == 'N') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_VERIFIED },
      });
    }
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      //console.log("Password wrong.")
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.INVALID_CRED },
      });
    } else {
      /**Genreating access token for the company and company_admin */
      var token = jwt.sign(
        { user_id: user.id, firstName: user.firstName },
        { issuer: 'Jcsoftware', subject: user.email, audience: 'Smart Cloze' }
      );
      // const refreshToken = jwt.sign({ user_id: user.id }, { issuer: 'refresh', subject: "user", audience: "Smart Cloze" })
      var userDetail = user;
      if (userDetail.addedBy && userDetail.addedBy != null) {
        do {
          var parentUser = await Users.findOne({ id: userDetail.addedBy });
          userDetail = parentUser;
        } while (userDetail.addedBy && userDetail.addedBy != null);
        user.masterAccount = userDetail;
      }
      user.access_token = token;

      return res.status(200).json({
        success: true,
        code: 200,
        message: constantObj.user.SUCCESSFULLY_LOGGEDIN,
        data: user,
      });
    }
  },

  /*
   % Function   : Verified Otp
   % Description:   This Function is used for Otp TO Mobile . 
   % Param : mobileNo
   % Return     : Send otp
   */
  verifyOtp: async function (req, res) {
    try {
      var otp = req.body.otp;
      var id = req.body.id;
      if (!otp || typeof otp == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.OTP_REQUIRED },
        });
      }

      //For check otp on Database
      var user = await Users.findOne({ where: { otp: req.body.otp } });
      if (!user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.WRONG_OTP },
        });
      } else {
        //  //console.log(user,'user==');
        var updatedUser = await Users.update(
          { id: user.id },
          { isVerified: 'Y', otp: '' }
        );
        return res.status(200).json({
          success: true,
          code: 200,
          message: constantObj.user.OTP_MATCH,
          data: user.id,
          participant_id: user.participant_id,
        });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + error } });
    }
  },

  /*For Get User Details
   * Get Record from Login User Id
   */
  userDetails: async function (req, res) {
    var id = req.param('id');
    if (!id || typeof id == undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Id is required' },
      });
    }

    var userDetails = await Users.find({ where: { id: id } });

    return res.status(200).json({
      success: true,
      code: 200,
      data: userDetails,
    });
  },

  /*For Get all Users
   * Param Role
   */

  getAllUsers: async (req, res) => {
    console.log('In Get all user');
    try {
      var search = req.param('search');
      var role = req.param('role');
      var isDeleted = req.param('isDeleted');
      var page = req.param('page');
      // var addedBy = req.body.addedBy;
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
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { schoolName: { $regex: search, $options: 'i' } },
        ];
      }
      query.role = { $ne: 'admin' };
      if (role) {
        query.role = role;
      }

      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }

      console.log(query, '---------------->query');
      db.collection('users')
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
              role: '$role',
              isDeleted: '$isDeleted',
              fullName: '$fullName',
              email: '$email',
              status: '$status',
              createdAt: '$createdAt',
              deletedBy: '$deletedBy.fullName',
              deletedAt: '$deletedAt',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          console.log(err, totalResult);
          db.collection('users')
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
                  role: '$role',
                  isDeleted: '$isDeleted',
                  fullName: '$fullName',
                  email: '$email',
                  status: '$status',
                  validupto: '$validupto',
                  createdAt: '$createdAt',
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
      console.log(error);
      return res.status(400).json({
        success: false,
        code: 400,
        error: error,
      });
    }
  },

  /*
   *For Check Email Address Exit or not
   */
  checkEmail: async function (req, res) {
    var email = req.param('email');
    if (!email || typeof email == undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Email is required' },
      });
    }
    Users.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(200).json({
          success: false,
          error: { code: 400, message: 'Email already taken' },
        });
      } else {
        return res.status(200).json({
          success: true,
          code: 200,
          message: 'you can use this email',
        });
      }
    });
  },

  editProfile: async (req, res) => {
    let data = req.body;
    try {
      const id = req.param('id');
      var transactionId = req.param('transactionId');

      if (!id || id == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Id required' },
        });
      }

      if (data.firstName && data.lastName) {
        data.fullName = data.firstName + ' ' + data.lastName;
      }
      const user = await Users.findOne({ id: id });
      data.updatedBy = req.identity.id;
      // Users.findOne({ email: data.email, id: { '!=': id }}).then(user => {
      // if (user) {
      //     return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.user.EMAIL_USED } });
      // } else {

      console.log(transactionId);
      if (transactionId) {
        if (data.roles && data.roles.length > 0) {
          const contact = await Contacts.find({
            user_id: id,
            transaction: transactionId,
            isDeleted: false,
          });
          if (contact && contact.length > 0) {
            if (user.user_access == false && data.user_access == true) {
              contactEmail({
                email: user.email,
                firstName: user.firstName ? req.body.firstName : user.firstName,
                invitedBy: req.identity.firstName,
                addedBy: req.identity.id,
                link: `${constant.FRONT_WEB_URL}auth/signup?email=${user.email}&id=${user.id}`,
              });
            }
            const updatedContact = await Contacts.update(
              { id: contact[0].id },
              { roles: data.roles, user_access: data.user_access }
            );
          } else {
            console.log('contact not exist ---------------------');
            var contactData = {
              user_id: id,
              addedBy: req.identity.id,
              transaction: transactionId,
              status: 'accepted',
            };
            createdContact = await Contacts.create(contactData);
          }
        } else {
          console.log('contact not exist ---------------------');
          var contactData = {
            user_id: data.userId,
            addedBy: req.identity.id,
            transaction: transactionId,
            status: 'accepted',
          };
          createdContact = await Contacts.create(contactData).fetch();

          console.log(createdContact);
        }
      }

      delete data.roles;
      // delete data.role_id
      delete data.transaction;
      // delete data.teamSettings
      delete data.createdAt;
      delete data.user_id;
      delete data._id;
      delete data.updatedAt;
      delete data.status;
      Users.updateOne({ id: id }, data).then((user) => {
        return res.status(200).json({
          success: true,
          data: user,
          message: constantObj.user.UPDATED_USER,
        });
      });
      // }
      // })
    } catch (err) {
      console.log(err);
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },

  forgotPassword: async (req, res) => {
    let data = req.body;
    if (!data.email || data.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_REQUIRED },
      });
    }
    Users.findOne({ email: data.email.toLowerCase(), isDeleted: false }).then(
      (data) => {
        if (data === undefined) {
          return res.status(404).json({
            success: false,
            error: {
              code: 404,
              message: constantObj.user.INVALID_USER,
            },
          });
        } else {
          var verificationCode = generateVeificationCode();

          Users.update(
            { email: data.email, isDeleted: false },
            {
              verificationCode: verificationCode,
            }
          ).then(async (result) => {
            currentTime = new Date();
            await forgotPasswordEmail({
              email: data.email,
              verificationCode: verificationCode,
              firstName: data.firstName,
              id: data.id,
              time: currentTime.toISOString(),
            });
            return res.status(200).json({
              success: true,
              id: data.id,
              message: constantObj.user.VERIFICATION_SENT,
            });
          });
        }
      }
    );
  },

  resetPassword: async (req, res) => {
    let data = req.body;
    try {
      var code = data.code;
      var newPassword = data.newPassword;

      let user = await Users.findOne({ verificationCode: code });

      if (!user || user.verificationCode !== code) {
        //check for case senstive
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Verification code wrong',
          },
        });
      } else {
        const encryptedPassword = bcrypt.hashSync(
          newPassword,
          bcrypt.genSaltSync(10)
        );
        Users.updateOne({ id: user.id }, { password: encryptedPassword }).then(
          (updatedUser) => {
            return res.status(200).json({
              success: true,
              message: 'Password reset successfully.',
            });
          }
        );
      }
    } catch (err) {
      return res
        .status(400)
        .json({ success: true, error: { code: 400, message: '' + err } });
    }
  },

  userProfileData: (req, res, next) => {
    // //console.log("in user profile data")
    let query = {};
    query.id = req.identity.id;
    Users.findOne(query)
      .populate('plan_id')
      .exec((err, userDetail) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: '' + err },
          });
        } else {
          return res.status(200).json({
            success: true,
            code: 200,
            data: userDetail,
          });
        }
      });
  },

  userDetail: (req, res, next) => {
    let query = {};
    query.id = req.param('id');
    Users.findOne(query)
      .populate('addedBy')
      .exec((err, userDetail) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: '' + err },
          });
        } else {
          return res.status(200).json({
            success: true,
            code: 200,
            data: userDetail,
          });
        }
      });
  },

  verifyUser: (req, res) => {
    var id = req.param('id');
    Users.findOne({ id: id }).then((user) => {
      if (user) {
        Users.update({ id: id }, { isVerified: 'Y' }).then((verified) => {
          return res.redirect(constant.FRONT_WEB_URL + 'auth/login');
        });
      } else {
        return res.redirect(constant.FRONT_WEB_URL);
      }
    });
  },

  verifyEmail: (req, res) => {
    //console.log('in verifyEmail');
    var id = req.param('id');
    Users.findOne({ id: id }).then((user) => {
      if (user) {
        Users.update({ id: id }, { contact_information: 'Yes' }).then(
          (verified) => {
            return res.redirect(
              constantObj.messages.FRONT_WEB_URL + '/auth/login'
            );
          }
        );
      } else {
        return res.redirect(constantObj.messages.FRONT_WEB_URL);
      }
    });
  },

  activateDeactivatePlan: async (req, res) => {
    try {
      var user_id = req.param('id');
      var status = req.param('status');

      if (status == 'activate') {
        var validupto = addDays(new Date(), 30);
        const updatedUser = await Users.update(
          { id: user_id },
          { validupto: validupto }
        );

        return res.status(200).json({
          success: true,
          message:
            'Account access will provide for next one month successfully.',
        });
      } else {
        var userInfo = await Users.findOne({ id: user_id });
        try {
          if (userInfo.subscription_id) {
            const existedSubscription = await stripe.subscriptions.retrieve(
              String(userInfo.subscription_id)
            );
            //console.log('existedSubscription', existedSubscription);
            if (existedSubscription) {
              const deleted = await stripe.subscriptions.del(
                userInfo.subscription_id
              );
            }
          }

          const deactivatedAccount = await Users.update(
            { id: user_id },
            { validupto: null, subscription_id: '' }
          );

          return res.status(200).json({
            success: true,
            message: 'Account access will be restricted successfully.',
          });
        } catch (err) {
          //console.log(err);
        }
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to register User
   */
  addUser: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    var date = new Date();
    try {
      var user = await Users.findOne({ email: req.body.email.toLowerCase() });
      if (user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        });
      } else {
        req.body['date_registered'] = date;
        req.body['status'] = 'active';
        req.body['role'] = req.body.role ? req.body.role : 'user';
        const password = generateVeificationCode();
        req.body.password = password;
        req.body.isVerified = 'Y';

        if (req.body.firstName && req.body.lastName) {
          req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
        }

        var newUser = await Users.create(req.body).fetch();
        if (newUser) {
          addUserEmail({
            email: newUser.email,
            firstName: newUser.firstName,
            password: password,
          });

          return res.status(200).json({
            success: true,
            code: 200,
            data: newUser,
            message: constantObj.user.SUCCESSFULLY_REGISTERED,
          });
        }
      }
    } catch (err) {
      return res.status(400).json({ success: true, code: 400, error: err });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to export csv file of Users
   */

  userCSV: async (req, res) => {
    var role = req.param('role');
    let query = { isDeleted: false };
    if (role) {
      query.role = role;
    }

    var async = require('async');
    const date = new Date().getTime();
    const path = `csv/users${date}.csv`;
    const filePath = `assets/csv/users${date}.csv`;
    var createCsvWriter = csv.createObjectCsvWriter;

    // Passing the column names intp the module
    const csvWriter = createCsvWriter({
      // Output csv file name is geek_data
      path: filePath,
      header: [
        // Title of the columns (column_names)
        { id: 'id', title: 'ID', width: 25 },
        { id: 'name', title: 'Name', width: 25 },
        { id: 'email', title: 'Email', width: 25 },
        { id: 'address', title: 'Address', width: 25 },
        { id: 'createdAt', title: 'Redister On', width: 25 },
      ],
    });
    var users = await Users.find(query);
    // Values for each column through an array
    let results = [];
    if (users.length > 0) {
      async.each(
        users,
        function (user, callback) {
          let obj = {
            id: user.id,
            email: user.email,
            address: user.address,
            createdAt: new Date(user.createdAt),
          };
          if (user.fullName == '') {
            obj.name = user.schoolName;
          } else {
            obj.name = user.fullName;
          }
          results.push(obj);
          callback();
        },
        function (error) {
          if (error) {
            return res.status(400).jsonx({
              success: false,
              error: {
                message: error,
              },
            });
          } else {
            // Writerecords function to add records
            csvWriter.writeRecords(results).then(async () => {
              await new Promise((resolve) => setTimeout(resolve, 10000));
              return res.status(200).json({
                success: true,
                path: constant.BACK_WEB_URL + path,
              });
            });
          }
        }
      );
    } else {
      // Writerecords function to add records
      csvWriter.writeRecords(results).then(() => {
        return res.status(200).json({
          success: true,
          path: constant.BACK_WEB_URL + path,
        });
      });
    }
  },

  inviteUser: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    var date = new Date();
    try {
      var user = await Users.findOne({
        email: req.body.email.toLowerCase(),
        isDeleted: false,
      });
      if (user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        });
      } else {
        req.body['date_registered'] = date;
        //req.body["status"] = "active";
        req.body['password'] = generateVeificationCode();

        req.body.addedBy = req.identity.id;
        if (req.body.firstName && req.body.lastName) {
          req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
        }

        var newUser = await Users.create(req.body).fetch();
        // console.log(newUser, "------------------>newuser")
        // if(req.body.transaction){
        query = {};
        query.user_id = newUser.id;
        query.addedBy = req.identity.id;
        query.user_access = req.body.user_access;
        query.roles = req.body.roles;
        query.isDeleted = false;

        if (req.body.teamMember == true) {
          query.teamMember = true;
        }
        // query.transaction=req.body.transaction

        var create = await Contacts.create(query).fetch();
        // }
        if (newUser) {
          userInviteLink({
            email: newUser.email,
            firstName: newUser.firstName,
            addedBy: req.identity.id,
            createdByName: req.identity.firstName,
            id: newUser.id,
          });
          // console.log(userInviteLink)

          return res.status(200).json({
            success: true,
            code: 200,
            data: newUser,
            message: constantObj.user.SUCCESSFULLY_REGISTERED,
          });
        }
      }
    } catch (err) {
      console.log(err);
      return res
        .status(400)
        .json({ success: true, code: 400, message: 'catch block' + err });
    }
  },

  resendInvite: async (req, res) => {
    var date = new Date();
    try {
      var user = await Users.findOne({ id: req.param('id') }).populate(
        'addedBy'
      );
      if (!user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'User not found.' },
        });
      } else {
        if (!user.addedBy) {
          user.addedBy = req.identity;
          var updatedUser = await Users.update(
            { id: id },
            { addedBy: req.identity.id }
          );
        }
        if (user) {
          userInviteLink({
            email: user.email,
            firstName: user.firstName,
            addedBy: user.addedBy,
            createdByName: user.addedBy.firstName,
            id: user.id,
          });
          // console.log(userInviteLink)

          return res.status(200).json({
            success: true,
            message: 'Invitation resend successfully.',
          });
        }
      }
    } catch (err) {
      console.log(err);
      return res
        .status(400)
        .json({ success: true, code: 400, message: 'catch block' + err });
    }
  },
  inviteUserList: async (req, res) => {
    try {
      var search = req.param('search');
      var isDeleted = req.param('isDeleted');
      var page = req.param('page');
      var role = req.param('role');
      // var invitedBy = req.param("addedBy");
      var role_id = req.param('role_id');
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
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { schoolName: { $regex: search, $options: 'i' } },
        ];
      }
      query.role = { $nin: ['admin', 'contact', 'Client'] };
      if (role) {
        query.role = role;
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
      addedBy_ids = [];
      var invitedBy = req.identity.id;
      addedBy_ids.push(ObjectId(req.identity.id));
      if (req.identity.addedBy && req.identity.addedBy != '') {
        invitedBy = req.identity.addedBy;
        addedBy_ids.push(ObjectId(req.identity.id));

        masterAccountId = req.identity.id;
        userDetail = req.identity;

        do {
          var parentUser = await Users.findOne({ id: userDetail.addedBy });
          userDetail = parentUser;
          masterAccountId = parentUser.id;
          console.log('Inside do while loop');
        } while (userDetail.addedBy && userDetail.addedBy != null);
        addedBy_ids.push(ObjectId(masterAccountId));
      } else {
        const myUsers = await Users.find({
          addedBy: req.identity.id,
          isDeleted: false,
        });
        if (myUsers && myUsers.length > 0) {
          for await (let user of myUsers) {
            addedBy_ids.push(ObjectId(user.id));
          }
        }
      }
      if (invitedBy) {
        query.addedBy_id = { $in: addedBy_ids };
      }

      query._id = { $ne: ObjectId(req.identity.id) };
      console.log(query);
      db.collection('users')
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
              from: 'roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'roles',
            },
          },

          {
            $unwind: {
              path: '$roles',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              role: '$role',
              isDeleted: '$isDeleted',
              firstName: '$firstName',
              lastName: '$lastName',
              image: '$image',
              fullName: '$fullName',
              email: '$email',
              mobileNo: '$mobileNo',
              company: '$company',
              status: '$status',
              teamSettings: '$teamSettings',
              sharing_setting: '$sharing_setting',
              createdAt: '$createdAt',
              deletedBy: '$deletedBy.fullName',
              deletedAt: '$deletedAt',
              addedBy: '$addedBy',
              role_id: '$roles',
              addedBy_id: '$addedBy._id',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          db.collection('users')
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
                  from: 'roles',
                  localField: 'role_id',
                  foreignField: '_id',
                  as: 'roles',
                },
              },

              {
                $unwind: {
                  path: '$roles',
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $project: {
                  role: '$role',
                  isDeleted: '$isDeleted',
                  firstName: '$firstName',
                  lastName: '$lastName',
                  image: '$image',
                  fullName: '$fullName',
                  email: '$email',
                  mobileNo: '$mobileNo',
                  company: '$company',
                  status: '$status',
                  teamSettings: '$teamSettings',
                  sharing_setting: '$sharing_setting',
                  createdAt: '$createdAt',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  addedBy: '$addedBy',
                  role_id: '$roles',
                  addedBy_id: '$addedBy._id',
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

              // {
              //   $skip: Number(skipNo),
              // },
              // {
              //   $limit: Number(count),
              // },
            ])
            .toArray(async (err, result) => {
              if (result && result.length > 0) {
                if (req.identity.addedBy && req.identity.addedBy != '') {
                  masterAccountId = req.identity.id;
                  userDetail = req.identity;

                  do {
                    var parentUser = await Users.findOne({
                      id: userDetail.addedBy,
                    });
                    userDetail = parentUser;
                    masterAccountId = parentUser.id;
                    console.log('Inside do while loop');
                  } while (userDetail.addedBy && userDetail.addedBy != null);
                  result.push(userDetail);
                  result.push(req.identity);
                } else {
                  result.push(req.identity);
                }
              }

              slicedArray = result.slice((page - 1) * count, page * count);
              return res.status(200).json({
                success: true,
                data: slicedArray,
                total: result.length,
              });
            });
        });
    } catch (error) {
      return res.status(400).json({
        success: false,
        code: 400,
        error: error,
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const id = req.param('id');

      if (!id || id == undefined) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Payload missing' },
        });
      }

      const contacts = await Contacts.find({
        user_id: id,
        transaction: { '!=': null },
        isDeleted: false,
      });

      if (contacts && contacts.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message:
              'Needs to assign associated transaction to other member first.',
          },
        });
      } else {
        const deletedUser = await Users.update({ id: id }, { isDeleted: true });

        const deletedContacts = await Contacts.update(
          { user_id: id },
          { isDeleted: true }
        );

        return res.status(200).json({
          success: true,
          message: 'User deleted successfully.',
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};

userVerifyLink = function (options) {
  var email = options.email;
  message = '';
  style = {
    header: `
       padding:30px 15px;
       text-align:center;
       background-color:#f2f2f2;
       `,
    body: `
       padding:15px;
       min-height: 230px;
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
    <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png" />
       <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Welcome to Smart Cloze </h2>
   </div>
   <div class="body" style="` +
    style.body +
    `">
       <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `"> Hello
    </h5>
       <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">You are one step away from verifying your account and joining the Smart Cloze community.
    The smartest way to manage your transactions and provide your client with high powered VIP closing experience. Please verify your account by clicking the link below.</p>
       <div style="` +
    style.textCenter +
    `">
           <a style="text-decoration:none" href="` +
    constant.BACK_WEB_URL +
    'verifyUser?id=' +
    options.id +
    `"><span style="` +
    style.btn +
    style.btnPrimary +
    `">Verify Email</span></a>
       </div>
   </div>

 </div>`;

  SmtpController.sendEmail(email, 'Email Verification', message);
};

forgotPasswordEmail = function (options) {
  var email = options.email;
  var verificationCode = options.verificationCode;
  var firstName = options.firstName;

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
          min-height: 230px;
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
          <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png" />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Smart Cloze Reset Password</h2>
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
    email +
    `</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">It's OK. We tend to forget things sometimes as well. We have recived your request to reset your password. Your verification code is ` +
    verificationCode +
    `<br>
          
          </p>
        
      </div>
     

      
    </div>`;

  SmtpController.sendEmail(email, 'Reset Password', message);
};

addUserEmail = function (options) {
  var email = options.email;

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
          min-height: 230px;
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
    `">Registration</h2>
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
    `margin-bottom:20px;font-weight: 600">Your account is created on Smart Cloze <br>
          
          </p>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Your login credentials are: <br>
          
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
    `margin-bottom:20px;font-weight: 600">Password: ${password} <br>
                  
                  </p>
        
      </div>
     

    </div>`;

  SmtpController.sendEmail(email, 'Registration', message);
};

userInviteLink = function (options) {
  var email = options.email;
  var addedBy = options.addedBy;
  var firstName = option.firstName;
  message = '';
  style = {
    header: `
         padding:30px 15px;
         text-align:center;
         background-color:#f2f2f2;
         `,
    body: `
         padding:15px;
         min-height: 230px;
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
         <img src="http://198.251.65.146:4019/img/logo.png" width="150" style="margin-bottom:20px;" />
         <h3 style="` +
    style.hTitle +
    style.m0 +
    `">Hello,` +
    options.firstName +
    `, you've been invited to Smart Cloze by ${options.createdByName}.</h2>
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
    options.firstName +
    `</h5>
         <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Smart Cloze lets you manage all your real estate transactions in one place.
     The smartest way to simplify your clients real estate transaction process with customized document management, an integrated messaging platform, and fully customizable checklists and workflow templates.
       Basically: we are heavy on the automation side and light on the paperwork side!  You and your clients will know exactly where you are in the home buying or selling process at all times.
        And Smart Cloze focuses on making our agents and coordinators look like rock stars. </p>

    <p style="font-weight: 600">You can use an existing Smart Cloze account if you already have one or you can create a new one .</p>
         <div style="` +
    style.textCenter +
    `">
             <a style="text-decoration:none" href="` +
    constant.FRONT_WEB_URL +
    'auth/signup' +
    '?email=' +
    options.email +
    '&addedBy=' +
    options.addedBy +
    '&id=' +
    options.id +
    `"><span class="mt-0 mb-5" style="background-color:#34cceb;color:#fff; padding:5px 20px"` +
    style.btn +
    style.btnPrimary +
    `">Join</span></a>
         </div>
     </div>

   </div>`;

  SmtpController.sendEmail(email, 'Invitation', message);
};
contactEmail = function (options) {
  var email = options.email;
  var addedBy = options.addedBy;
  var firstName = options.firstName;
  message = '';
  style = {
    header: `
         padding:30px 15px;
         text-align:center;
         background-color:#f2f2f2;
         `,
    body: `
         padding:15px;
         min-height: 230px;
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
    <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png"  />
         <h3 style="` +
    style.hTitle +
    style.m0 +
    `">Hello,` +
    options.firstName +
    `, you've been invited to Smart Cloze by ${options.invitedBy}.</h2>
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
    options.firstName +
    `</h5>
         <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Smart Cloze lets you manage your real estate transaction in one place.
    The smartest way to simplify your real estate transaction process with customized document management, an integrated messaging platform, and fully customizable checklists and workflow templates.
      Basically: we are going to give you a one stop shop for your transaction.
        You will know exactly where you are in the home buying or selling process at all times.</p>

    <p style="font-weight: 600">You can use an existing Smart Cloze account if you already have one or you can create a new one .</p>
         <div style="` +
    style.textCenter +
    `">
             <a style="text-decoration:none" href="${options.link}"><span class="mt-0 mb-5" style="background-color:#34cceb;color:#fff; padding:5px 20px"` +
    style.btn +
    style.btnPrimary +
    `">Join</span></a>
         </div>
     </div>

   </div>`;

  SmtpController.sendEmail(email, 'Invitation', message);
};
