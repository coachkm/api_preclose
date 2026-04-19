/**
 * ContactsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var constantObj = sails.config.constants;
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');

const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;

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

module.exports = {
  addContact: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
     req.body.email = "dummy"+new Date().getTime()+"@xyz.com"
    }

    var date = new Date();
    var user

    if (req.body.user_id && req.body.transaction) {
      var existedContact = await Contacts.find({ user_id: req.body.user_id._id, isDeleted: false, transaction: req.body.transaction }).limit(1)

      if (existedContact && existedContact.length > 0) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: "Contact already exist in transaction." }
        })
      }
    }
    try {
      var userDetail = await Users.find({ email: req.body.email.toLowerCase() }).limit(1).sort("createdAt desc") //User limit as for normal contact delete user created and for adding team member undeleted account create and this provide issue of multiple contacts
      if (userDetail && userDetail.length > 0) {
        user = userDetail[0]
      }

      if (user) {
        console.log("userExist")
        // if (user.isDeleted == true) {
        //   return res.status(400).json({
        //     success: false,
        //     error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        //   });
        // } else {

        if (req.body.firstName && req.body.lastName) {
          const fullName = req.body.firstName + " " + req.body.lastName
          image = ""
          if(req.body.image){
            image = req.body.image
          }

          company= ""

          if(req.body.company){
            company = req.body.company
          }

          const updatedUser = await Users.update({ id: user.id }, { firstName: req.body.firstName, lastName: req.body.lastName, fullName: fullName ,image:image,company:company})
        }
        let query = {}
        query.user_id = user.id
        query.addedBy = req.identity.id
        query.isDeleted = false
        if (req.body.transaction) {
          query.transaction = req.body.transaction
        } else {
          query.transaction = null
        }
        var existedContact = await Contacts.findOne(query);

        if (existedContact) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constantObj.user.ALREADY_INVITED },
          });
        } else {

          let contactData = {};

          contactData.user_id = user.id;
          if (req.body.user_id) {
            contactData.user_id = req.body.user_id._id;
          }
          contactData.addedBy = req.identity.id;
          contactData.status = "accepted";
          if (req.body.transaction) {
            contactData.transaction = req.body.transaction
            if (req.body.roles) {
              contactData.roles = req.body.roles
            }

          }

          const createdContact = await Contacts.create(contactData).fetch();

          var existedContact = await Contacts.findOne({ user_id: createdContact.user_id, addedBy: req.identity.id, isDeleted: false, transaction: null });
          if (!existedContact && !req.body.user_id) {
            let newcontactData = {};
            newcontactData.user_id = user.id;
            newcontactData.addedBy = req.identity.id;

            const newcreatedContact = await Contacts.create(newcontactData).fetch();
          }
          //  if(req.body.user_access == true){
          //   userInviteEmail({
          //     email: user.email,
          //     firstName: user.firstName,
          //     addedBy: req.identity,
          //     id: createdContact.id,
          //   });
          //  }

          if (req.body.transaction && user.user_access == true) {
            contactEmail({
              email: req.body.email,
              firstName: req.body.firstName ? req.body.firstName : user.firstName,
              invitedBy: req.identity.firstName,
              addedBy: req.identity.id,
              link: `${constant.FRONT_WEB_URL}auth/signup?email=${req.body.email}&addedBy=${addedBy}&id=${user.id}`

            });
          }


          return res.status(200).json({
            success: true,
            message: constantObj.user.CONTACT_ADDED,

          });
        }
        // }
      } else {
        console.log("userExist not exist")
        req.body['date_registered'] = date;
        req.body['status'] = 'active';
        req.body['role'] = req.body.role ? req.body.role : 'contact';
        req.body['addedBy'] = req.identity.id;
        const password = generateVeificationCode();
        req.body.password = password;
        req.body.isVerified = 'Y';
        if (req.body.firstName && req.body.lastName) {
          req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
        }
        delete req.body.createdAt
        req.body.isDeleted = true
        var newUser = await Users.create(req.body).fetch();
        let contactData = {};
        contactData.user_id = newUser.id;
        contactData.addedBy = req.identity.id;
        contactData.status = 'accepted';
        if (req.body.transaction) {
          contactData.transaction = req.body.transaction

          if (req.body.roles) {
            contactData.roles = req.body.roles
          }
        }


        var createdContact = await Contacts.create(contactData).fetch();
        var existedContact = await Contacts.findOne({ user_id: newUser.id, addedBy: req.identity.id, isDeleted: false, transaction: null });
        if (!existedContact) {
          let newcontactData = {};
          newcontactData.user_id = newUser.id;
          newcontactData.addedBy = req.identity.id;

          const newcreatedContact = await Contacts.create(newcontactData).fetch();
        }

        if (newUser && req.body.transaction && newUser.user_access == true) {
          contactEmail({
            email: newUser.email,
            firstName: newUser.firstName,
            invitedBy: req.identity.firstName,
            addedBy: req.identity.id,
            link: `${constant.FRONT_WEB_URL}auth/signup?email=${newUser.email}&addedBy=${req.identity.id}&id=${newUser.id}`
          });

        }

        return res.status(200).json({
          success: true,
          code: 200,
          data: newUser,
          message: constantObj.user.CONTACT_ADDED,
        });
        // }
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({ success: true, code: 400, error: "" + err });
    }
  },

  getContacts: async (req, res) => {
    try {
      var search = req.param('search');
      var isDeleted = req.param('isDeleted');
      var addedBy = req.param('addedBy');
      var page = req.param('page');
      var transactionId = req.param('transactionId')
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
          { company: { $regex: search, $options: 'i' } },
        ];
      }
      query.isDeleted = false;

      var userIds = []
      if (addedBy) {
        userIds.push(ObjectId(addedBy))
        const AdduserQuery = {}
        const userDeatil = await Users.findOne({ id: addedBy })
        AdduserQuery.isDeleted = false
        AdduserQuery.addedBy = addedBy

        if (userDeatil && userDeatil.addedBy) {
          AdduserQuery.addedBy = { "in": [addedBy, userDeatil.addedBy] }
        }

        const addedUsers = await Users.find(AdduserQuery)

        if (addedUsers && addedUsers.length > 0) {
          addedUsers.forEach(element => {
            userIds.push(ObjectId(element.id))
          });
        }

        const otherTransactions = await Contacts.find({ user_id: addedBy, isDeleted: false, transaction: { "!=": null } })
        if (otherTransactions && otherTransactions.length > 0) {
          otherTransactions.forEach(element => {

            userIds.push(ObjectId(element.addedBy))
          });
        }
        query.addedById = { $in: userIds }
        const user = await Users.findOne({ id: addedBy })

        if (user && user.addedBy) {
          userIds.push(ObjectId(user.addedBy))

          query.addedById = { $in: userIds }
          query.userId = { $nin: [ObjectId(addedBy)] }
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
      if (transactionId) {
        query.transaction = ObjectId(transactionId)
      } else {
        query.transaction = null
      }
      // console.log(query)
      db.collection('contacts')
        .aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user_id',
            },
          },
          {
            $unwind: {
              path: '$user_id',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'roles',
              localField: 'user_id.role_id',
              foreignField: '_id',
              as: 'user_id.role',
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
            $project: {
              user_id: '$user_id',
              userId: "$user_id._id",
              fullName: '$user_id.fullName',
              email: '$user_id.email',
              company: '$user_id.company',
              addedBy: '$addedBy',
              addedById: '$addedBy._id',
              transaction: '$transaction',
              user_access: '$user_access',
              roles: '$roles',
              isDeleted: '$isDeleted',
              status: '$status',
              createdAt: '$createdAt',
              deletedAt: '$deletedAt',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          db.collection('contacts')
            .aggregate([
              {
                $lookup: {
                  from: 'users',
                  localField: 'user_id',
                  foreignField: '_id',
                  as: 'user_id',
                },
              },
              {
                $unwind: {
                  path: '$user_id',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'roles',
                  localField: 'user_id.role_id',
                  foreignField: '_id',
                  as: 'user_id.role',
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
                $project: {
                  user_id: '$user_id',
                  userId: "$user_id._id",
                  fullName: '$user_id.fullName',
                  email: '$user_id.email',
                  company: '$user_id.company',
                  addedBy: '$addedBy',
                  addedById: '$addedBy._id',
                  isDeleted: '$isDeleted',
                  transaction: '$transaction',
                  user_access: '$user_access',
                  roles: '$roles',
                  status: '$status',
                  createdAt: '$createdAt',
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

              // {
              //   $skip: Number(skipNo),
              // },
              // {
              //   $limit: Number(count),
              // },
            ])
            .toArray(async (err, result) => {

              if (addedBy) {


                userDetails = await Users.findOne({ id: addedBy })

                myContact = await Contacts.find({user_id:addedBy}).populate('user_id').limit(1)
                if(myContact && myContact.length > 0){
                  result.push(myContact[0])
                
                  myContact[0].fullName = myContact[0].user_id.fullName
                  myContact[0].email = myContact[0].user_id.email
                  myContact[0].company = myContact[0].user_id.company
                  myContact[0].userId = myContact[0].user_id.id
                  myContact[0]._id = myContact[0].id
                  totalResult.push(myContact[0])
                }else{
                  var myContact = {}
                  myContact.user_id = userDetails
                  myContact.fullName = userDetails.fullName
                  myContact.email = userDetails.email
                  myContact.company = userDetails.company
  
                    result.push(myContact)
                    totalResult.push(myContact)


                }
             
                if(userDetails && userDetails.addedBy){

                  parentContact = await Contacts.find({user_id:userDetails.addedBy,}).populate('user_id').limit(1)
                  if(parentContact && parentContact.length > 0){
                    result.push(parentContact[0])
                    parentContact[0].fullName = parentContact[0].user_id.fullName
                    parentContact[0].email = parentContact[0].user_id.email
                    parentContact[0].company = parentContact[0].user_id.company
                    parentContact[0].userId = parentContact[0].user_id.id
                    parentContact[0]._id = parentContact[0].id
                    totalResult.push(parentContact[0])
                  }else{
                  parentUser = await Users.findOne({id:userDetails.addedBy})
                  var upperContact = {}
                  upperContact.user_id = parentUser
                  upperContact.fullName = parentUser.fullName
                  upperContact.email = parentUser.email
                  upperContact.company = parentUser.company
                  upperContact.fullName = parentUser.fullName

                  result.push(upperContact)
                  totalResult.push(upperContact)
                  }
                }
              }

              slicedArray = result.slice((page - 1) * count, page * count);
              return res.status(200).json({
                success: true,
                code: 200,
                data: slicedArray,
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

  acceptRejectInvite: async (req, res) => {
    const id = req.param('id');
    const status = req.param('status');

    //console.log("Accepting request")
    try {
      const invite = await Contacts.find({ id: id });

      if (!invite) {
        return res.redirect(constant.FRONT_WEB_URL);
      } else {
        if (invite && invite.status == 'accepted') {
          return res.redirect(constant.FRONT_WEB_URL);
        } else {
          //console.log("Updating status")
          updatedInvite = await Contacts.update({ id: id }, { status: status });
          return res.redirect(constant.FRONT_WEB_URL);
        }
      }
    } catch (err) {
      return res.redirect(constant.FRONT_WEB_URL);
    }
  },

  deleteContact: async (req, res) => {
    try {
      const id = req.param('id');
      Contacts.findOne({ id: id }).then(async data => {

        // Users.update({id:data.user_id},{isDeleted:true}).then(updated=>{})

        if (!data.transaction) {
          const deletedCont = await Contacts.update(
            { user_id: data.user_id },
            { isDeleted: true }
          );
        }
      })
      const deletedContact = await Contacts.update(
        { id: id },
        { isDeleted: true }
      );
      return res.status(200).json({
        success: true,
        message: constantObj.user.CONTACT_DELETED,
      });
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

      if (id) {
        const contact = await Contacts.find({ id: id })
          .populate('user_id')
          .populate('addedBy');
        return res.status(200).json({
          success: true,
          data: contact,
        });
      } else {
        return res.status(200).json({
          success: true,
          data: [{ user_id: req.identity.id, user_access: req.identity.user_access, teamMember: req.identity.teamMember }],
        });
      }

    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  mergeContacts: async (req, res) => {
    const data = req.body;
    try {
      if (!data.merge || data.merge == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.contact.MERGE_USER },
        });
      }

      if (!data.mergeTo || data.mergeTo == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.contact.MERGETO_USER },
        });
      }

      const needToMerge = await Users.findOne({ id: data.merge });
      const mergeTO = await Users.findOne({ id: data.mergeTo });

      if (!needToMerge || !mergeTO) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.contact.CONTACT_NOT_FOUND },
        });
      } else {
        const transactions = await Transactions.find({ addedBy: data.merge });

        if (transactions && transactions.length > 0) {
          transactions.forEach(async (element) => {
            const mergedTransactions = await Transactions.update(
              { id: element.id },
              { addedBy: data.mergeTo }
            );
          });
        }

        const templates = await TransactionsTemplates.find({
          addedBy: data.merge,
        });

        if (templates && templates.length > 0) {
          templates.forEach(async (element) => {
            const mergedTransactionsTemplates = await TransactionsTemplates.update(
              { id: element.id },
              { addedBy: data.mergeTo }
            );
          });
        }
        const workflow = await Workflows.find({ addedBy: data.merge });

        if (workflow && workflow.length > 0) {
          workflow.forEach(async (element) => {
            const mergedWorkflows = await Workflows.update(
              { id: element.id },
              { addedBy: data.mergeTo }
            );
          });
        }

        const assignedTransactions = await Contacts.update(
          { user_id: data.merge, transaction:{"!=":null} },
          { user_id: data.mergeTo }
        );
        const deletedUser = await Users.update({ id: data.merge, },{isDeleted:true});
        return res.status(200).json({
          success: true,
          message: constantObj.contact.MERGED,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getToContacts: async (req, res) => {
    try {
      var search = req.param('search');
      var isDeleted = req.param('isDeleted');
      var addedBy = req.param('addedBy');
      var page = req.param('page');
      var transactionId = req.param('transactionId')
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
          { company: { $regex: search, $options: 'i' } },
        ];
      }
      query.isDeleted = false;
      query.addedById = ObjectId(addedBy);
      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }
      if (transactionId) {
        query.transaction = ObjectId(transactionId)
      } else {
        query.transaction = null
      }

      db.collection('contacts')
        .aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user_id',
            },
          },
          {
            $unwind: {
              path: '$user_id',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'roles',
              localField: 'user_id.role_id',
              foreignField: '_id',
              as: 'user_id.role',
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
            $project: {
              user_id: '$user_id',
              fullName: '$user_id.fullName',
              email: '$user_id.email',
              company: '$user_id.company',
              addedBy: '$addedBy',
              addedById: '$addedBy._id',
              transaction: '$transaction',
              user_access: '$user_access',
              roles: '$roles',
              isDeleted: '$isDeleted',
              status: '$status',
              createdAt: '$createdAt',
              deletedAt: '$deletedAt',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray(async (err, totalResult) => {
          // if(totalResult .length > 0){
          //   totalResult.push({email:"All Buyers",fullName:"All Buyers",})
          //   totalResult.push({email:"All Sellers",fullName:"All Sellers"})
          //   totalResult.push({email:"All Buyer's Agent",fullName:"All Buyer's Agent"})
          //   totalResult.push({email:"All Seller's Agent",fullName:"All Seller's Agent"})
          //   totalResult.push({email:"All Buyer's Coordinator",fullName:"All Buyer's Coordinator"})
          //   totalResult.push({email:"All Seller's Coordinator",fullName:"All Seller's Coordinator"})
          // }
          // roleslist = await getDefaultRoles({text:search})
          // //console.log(roleslist)
          var roleslist = []
          roles = [

            { title: "All Buyers" },
            { title: "All Sellers" },
            { title: "All Buyer's Agent" },
            { title: "All Seller's Agent" },
            { title: "All Buyer's Coordinator" },
            { title: "All Seller's Coordinator" },


            { title: "Admin" },
            { title: "All Cash Appraiser" },
            { title: "Appraiser" },
            { title: "Asbestos Inspector" },
            { title: "Buyer" },
            { title: "Buyer Attorney" },
            { title: "Buyer's Agent" },
            { title: "Buyer's Coordinator" },
            { title: "Buying Broker" },
            { title: "Chimney Inspector" },
            { title: "Closer" },
            { title: "Closing Attorney" },
            { title: "Co-List agent" },
            { title: "Coastal Feature Inspector" },
            { title: "Crawl Space Inspector" },
            { title: "Deeds Restrictions and Zoning Inspector" },
            { title: "Drywall Inspector" },
            { title: "Electric Inspector" },
            { title: "Environmental Site Assessor" },
            { title: "Escrow Agent" },
            { title: "Escrow Title Rep" },
            { title: "Escrowee" },
            { title: "Flood Insurance Provider" },
            { title: "Flood Plain Zone Determination Inspector" },
            { title: "Gas Inspector" },
            { title: "Ground Water Inspector" },
            { title: "Hazardous Substance Inspector" },
            { title: "HOA" },
            { title: "Home Improvement Provider" },
            { title: "Home Inspector" },
            { title: "Home Inspector Company" },
            { title: "Home Insurance Provider" },
            { title: "Home Security Provider" },
            { title: "Home Warranty Provider" },
            { title: "HVAC Inspector" },
            { title: "Inspector" },
            { title: "Land Insurance Provider" },
            { title: "Landlord" },
            { title: "Lawn Care/Landscape Provider" },
            { title: "Lawn Irrigation System Provider" },
            { title: "Lead Contamination Inspector" },
            { title: "Lead Inspector" },
            { title: "Lender" },
            { title: "Listing Agent Assistant" },
            { title: "Listing Agent Office Manager" },
            { title: "Listing Broker" },
            { title: "Loan Officer" },
            { title: "Loan Officer Assistant" },
            { title: "Loans Processor" },
            { title: "Locksmith" },
            { title: "Managing Broker" },
            { title: "Mechanical Inspector" },
            { title: "Meth Inspector" },
            { title: "Mold Inspector" },
            { title: "Moving and Storage" },
            { title: "Municipality Building Inspector" },
            { title: "My Team" },
            { title: "Nonrefundable Deposit" },
            { title: "Operations Manager" },
            { title: "Other" },
            { title: "OWTS Design Approval" },
            { title: "Paralegal" },
            { title: "Percolation Inspector" },
            { title: "Pest Inspector" },
            { title: "Photographer" },
            { title: "Pool Inspector" },
            { title: "Pre-Closer" },
            { title: "Production assistant" },
            { title: "Property Manager" },
            { title: "Radon Inspector" },
            { title: "Ribbon Representative" },
            { title: "Roof Inspector" },
            { title: "Seller" },
            { title: "Seller Attorney" },
            { title: "Seller's Agent" },
            { title: "Seller's Coordinator" },
            { title: "Septic Inspector" },
            { title: "Service Provider" },
            { title: "Settlement" },
            { title: "Sewer Lateral Inspector" },
            { title: "Sewer Scope Inspector" },
            { title: "Sewer System Inspector" },
            { title: "Smoke Detector Compliance" },
            { title: "Structural Inspector" },
            { title: "Stucco Inspector" },
            { title: "Surveyor" },
            { title: "Tenant" },
            { title: "Tenant Agent" },
            { title: "Termite Inspector" },
            { title: "Third Part Requirements" },
            { title: "Title Agent" },
            { title: "Transaction Coordinator" },
            { title: "Utilities Provider" },
            { title: "Water Inspector" },
            { title: "Well Inspector" },
            { title: "Well Water Inspector" },
            { title: "Wetlands Determination Inspector" },
            { title: "Wind Mitigation Inspector" },
            { title: "Wood Destroying Insects Inspector" },
            { title: "WoodPecker Surveyor" },
          ]


          var index
          // var newArr = [];
          const regexp = new RegExp(search, 'i');
          filterTest = roles.filter(x => regexp.test(x.title))
          if (filterTest.length > 0) {
            for await (let itm of filterTest) {
              roleslist.push({ email: itm.title, fullName: itm.title });
            }

          }


          //console.log(roleslist)
          roleslist.concat(totalResult);
          array1 = roleslist.concat(totalResult);
          return res.status(200).json({
            success: true,
            code: 200,
            data: array1
          });
        });
    } catch (error) {
      //console.log(error);
      return res.status(400).json({
        success: false,
        code: 400,
        error: error,
      });
    }
  },
  getClientTeamMember: async (req, res) => {
    try {
      let userContacts = await Contacts.find({ user_id: req.identity.id, isDeleted: false ,transaction: {"!=":null} }).populate('transaction')
      var transaction_Id = [];
      for await (let item of userContacts) {

        if(item.transaction && item.transaction.id && item.transaction.isDeleted == false){
          transaction_Id.push(item.transaction.id);
        }
       
      }

      let clientTeam = await Contacts.find({ transaction: { in: transaction_Id }, isDeleted: false }).populate("user_id");
      //filter unique records
      const arrayUniqueByKey = [...new Map(clientTeam.map(item =>
        [item.user_id.email, item])).values()];
      return res.status(200).json({
        success: true,
        data: arrayUniqueByKey

      })
      // }

    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 500, message: "" + err }
      })
    }
  }
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
    `assets/images/logo.png" style="margin-bottom:20px;  width=100px;" />
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

userInviteEmail = function (options) {
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
    `assets/images/logo.png" style="margin-bottom:20px;  width=100px;" />
              <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Contact Invite</h2>
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
    `margin-bottom:20px;font-weight: 600">You are added as a contact by ${options.addedBy.firstName} <br>
              
              </p>
              <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">You can accept and reject the invite from below<br>
              
              </p>
    


          </div>
          <div style="` +
    style.textCenter +
    `">
           <a style="text-decoration:none" href="` +
    constant.BACK_WEB_URL +
    'acceptRejectInvite?status=accepted&id=' +
    options.id +
    `"><span style="` +
    style.btn +
    style.btnPrimary +
    `">Accept</span></a>
    <a style="text-decoration:none" href="` +
    constant.BACK_WEB_URL +
    'acceptRejectInvite?status=rejected&id=' +
    options.id +
    `">
    <span style="` +
    style.btn +
    style.btnPrimary +
    `">Reject</span></a>
       </div>
   </div>

 
   </div>
         

        </div>`;

  SmtpController.sendEmail(email, 'Contact Invite', message);
};


getDefaultRoles = async (option) => {



}


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
    `">Hello,` + options.firstName + `, you've been invited to Smart Cloze by ${options.invitedBy}.</h2>
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
             <a style="text-decoration:none" href="` +
    options.link
      `"><span class="mt-0 mb-5" style="background-color:#34cceb;color:#fff; padding:5px 20px"` +
    style.btn +
    style.btnPrimary +
    `">Join</span></a>
         </div>
     </div>

   </div>`;

  SmtpController.sendEmail(email, 'Invitation', message);
};