/**
 * TransactionsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;

var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
module.exports = {
  addTransaction: async (req, res) => {
    const data = req.body;
    const questions = data.questions;
    const note = data.notes;
    const workflow = data.workflow_id;
    delete data.questions;

    try {
      let query = {};
      query.address = data.address;
      query.isDeleted = false;

      data.addedBy = req.identity.id;

      const created = await Transactions.create(data).fetch();

      await transactionEmail({
        email: req.identity.email,
        username: req.identity.fullName,
        propertyAddress: data.address,
        id: created.id,
        companyName: req.identity.company,
      });
      if (req.identity.addedBy) {
        const parentUser = await Users.findOne({ id: req.identity.addedBy });
        if (
          parentUser &&
          parentUser.coordinator &&
          parentUser.coordinator.length > 0
        ) {
          await transactionEmail({
            email: parentUser.email,
            name: parentUser.fullName,
            username: req.identity.fullName,
            propertyAddress: data.address,
            id: created.id,
            companyName: req.identity.company,
          });
          for await (let itm of parentUser.coordinator) {
            await transactionEmail({
              email: itm.email,
              name: itm.fullName,
              username: req.identity.fullName,
              propertyAddress: data.address,
              id: created.id,
              companyName: req.identity.company,
            });
            if (created.workflow_id) {
              const existedworkflow = await Workflows.findOne({
                id: created.workflow_id,
              });
              let cordinator = await Users.findOne({
                email: itm.email,
                isDeleted: false,
              });

              if (existedworkflow.invitedTemplate == 'yes' && cordinator) {
                let contactData = {};
                contactData.user_id = cordinator.id;
                contactData.addedBy = req.identity.id;
                contactData.transaction = created.id;
                contactData.status = 'accepted';
                contactData.roles = ["Buyer's Coordinator"];
                let createdContact = await Contacts.create(contactData).fetch();
              }
            }
          }
        }
      }
      if (created) {
        if (note && note != undefined && note != '') {
          let noteData = {};
          noteData.note = note;
          noteData.transaction = created.id;
          noteData.addedBy = req.identity.id;

          const createdNote = await Notes.create(noteData);
        }

        var ownRole = '';
        var cordinatorRole = '';
        var myRole = '';

        if (questions && questions.length > 0) {
          for await (const element of questions) {
            element.transaction_id = created.id;
            element.addedBy = req.identity.id;
            var allroles = [];
            if (element.type === 'contact') {
              if (
                element.question ===
                'please enter the contact information for the buyer.'
              ) {
                allroles.push('Buyer');
              } else if (
                element.question ===
                'please enter the contact information for the seller.'
              ) {
                allroles.push('Seller');
              } else if (element.question === 'who is the closing attorney?') {
                allroles.push('Closing Attorney');
              } else if (element.question === 'who is the termite inspector?') {
                allroles.push('Termite Inspector');
              } else if (
                element.question === 'Who will perform the home inspection?'
              ) {
                allroles.push('Home Inspector');
              } else if (
                element.question ===
                'If the buyer has selected a lender, please enter it here.'
              ) {
                allroles.push('Lender');
              } else if (
                element.question === 'Who is the home warranty provider?'
              ) {
                allroles.push('Home Warranty Provider');
              }

              if (element.contacts && element.contacts.length > 0) {
                for await (const itm of element.contacts) {
                  let contactData = {};
                  contactData.user_id = itm._id;
                  contactData.addedBy = req.identity.id;
                  contactData.transaction = created.id;
                  contactData.status = 'accepted';
                  const contactDetail = await Users.findOne({
                    id: contactData.user_id,
                  });

                  try {
                    let query = {};
                    query.user_id = contactData.user_id;
                    query.addedBy = req.identity.id;
                    query.isDeleted = false;

                    if (
                      contactDetail.teamMember == true &&
                      contactDetail.user_access == true
                    ) {
                      await transactionEmail({
                        email: contactDetail.email,
                        name: contactDetail.fullName,
                        username: req.identity.fullName,
                        propertyAddress: data.address,
                        id: created.id,
                        companyName: req.identity.company,
                      });
                    }

                    if (contactData.transaction) {
                      query.transaction = contactData.transaction;
                    } else {
                      query.transaction = null;
                    }
                    // //console.log(query,"fffffffffffffffffff");
                    var existedContact = await Contacts.findOne(query);

                    if (existedContact) {
                      let oldRoles = existedContact.roles;
                      const allrolesArray = [...allroles, ...oldRoles];
                      let updaterole = allrolesArray.filter(
                        (item, i, ar) => ar.indexOf(item) === i
                      );
                      const createdContact = await Contacts.update(
                        { id: existedContact.id },
                        { roles: updaterole }
                      );
                    } else {
                      contactData.roles = allroles;
                      const createdContact = await Contacts.create(
                        contactData
                      ).fetch();
                    }
                  } catch (err) {}
                }
              }
            }

            if (element.type === 'document') {
              let documentData = {};
              documentData.addedBy = req.identity.id;
              documentData.transaction = created.id;
              documentData.type = 'Documents';
              documentData.value = 'docs/' + element.answer;
              documentData.title = element.text;
              try {
                const createdContact = await TransactionData.create(
                  documentData
                ).fetch();
              } catch (err) {}
            }

            if (element.question === 'what is your role in the transaction?') {
              let contactData = {};
              contactData.user_id = req.identity.id;
              contactData.addedBy = req.identity.id;
              contactData.transaction = created.id;
              contactData.status = 'accepted';
              if (element.answer === 'Coordinator') {
                element.answer = "Buyer's Coordinator";
              }
              if (element.answer === 'Agent') {
                element.answer = "Buyer's Agent";
              }

              if (element.answer != 'Coordinator') {
                var users = await Users.findOne({ id: req.identity.id });

                if (
                  users &&
                  users.coordinator &&
                  users.coordinator.length > 0
                ) {
                  for await (const user of users.coordinator) {
                    var coordinator = await Users.findOne({
                      email: user.email.toLowerCase(),
                      isDeleted: false,
                    });
                    if (coordinator) {
                      let contactData1 = {};
                      contactData1.user_id = coordinator.id;
                      contactData1.addedBy = req.identity.id;
                      contactData1.transaction = created.id;
                      contactData1.status = 'accepted';
                      contactData1.roles = ["Buyer's Coordinator"];
                      var existedContact = await Contacts.find({
                        user_id: coordinator.id,
                        transaction: created.id,
                        status: 'accepted',
                        isDeleted: false,
                      });

                      if (existedContact && existedContact.length > 0) {
                        updatedContact = existedContact[0];

                        updatedContact.roles.push("Buyer's Coordinator");
                        let updatedRoles = updatedContact.roles.filter(
                          (item, i, ar) => ar.indexOf(item) === i
                        );
                        updatedContact.roles = updatedRoles;
                        cordinatorRole = existedContact[0].id;
                        const updatedContactData = await Contacts.update(
                          { id: existedContact[0].id },
                          updatedContact
                        );
                      } else {
                        const createdContact = await Contacts.create(
                          contactData1
                        ).fetch();

                        cordinatorRole = createdContact.id;
                      }

                      await transactionEmail({
                        email: coordinator.email,
                        name: coordinator.fullName,
                        username: req.identity.fullName,
                        propertyAddress: data.address,
                        id: created.id,
                        companyName: req.identity.company,
                      });
                    }
                  }
                }

                if (req.identity.addedBy) {
                  var users = await Users.findOne({ id: req.identity.addedBy });
                  if (
                    users &&
                    users.coordinator &&
                    users.coordinator.length > 0
                  ) {
                    for await (const user of users.coordinator) {
                      var coordinator = await Users.findOne({
                        email: user.email.toLowerCase(),
                        isDeleted: false,
                      });
                      if (coordinator) {
                        let contactData1 = {};
                        contactData1.user_id = coordinator.id;
                        contactData1.addedBy = req.identity.id;
                        contactData1.transaction = created.id;
                        contactData1.status = 'accepted';
                        contactData1.roles = ["Buyer's Coordinator"];
                        var existedContact = await Contacts.find({
                          user_id: coordinator.id,
                          transaction: created.id,
                          status: 'accepted',
                          isDeleted: false,
                        });
                        if (existedContact && existedContact.length > 0) {
                          updatedContact = existedContact[0];
                          updatedContact.roles.push("Buyer's Coordinator");

                          updatedRoles = updatedContact.roles.filter(
                            (item, i, ar) => ar.indexOf(item) === i
                          );
                          updatedContact.roles = updatedRoles;
                          cordinatorRole = existedContact[0].id;
                          const updatedContactData = await Contacts.update(
                            { id: existedContact[0].id },
                            updatedContact
                          );
                        } else {
                          const createdContact = await Contacts.create(
                            contactData1
                          ).fetch();

                          cordinatorRole = createdContact.id;
                        }
                        // const createdContact = await Contacts.create(
                        //   contactData1
                        // ).fetch();
                        await transactionEmail({
                          email: coordinator.email,
                          name: coordinator.fullName,
                          username: req.identity.fullName,
                          propertyAddress: data.address,
                          id: created.id,
                          companyName: req.identity.company,
                        });
                        // cordinatorRole = createdContact.id;
                      }
                    }
                  }
                }
              }
              contactData.roles = [element.answer];
              // if (element.answer === 'Both') {
              //   contactData.roles = ["Buyer's Agent","Seller's Agent","Buyer's Coordinator","Seller's Coordinator"]
              // }

              var existedContact = await Contacts.find({
                user_id: req.identity.id,
                transaction: created.id,
                status: 'accepted',
                isDeleted: false,
              });
              if (existedContact && existedContact.length > 0) {
                updatedContact = existedContact[0];
                updatedContact.roles.push(element.answer);
                cordinatorRole = existedContact[0].id;

                let updatedRoles = updatedContact.roles.filter(
                  (item, i, ar) => ar.indexOf(item) === i
                );
                updatedContact.roles = updatedRoles;
                const updatedContactData = await Contacts.update(
                  { id: existedContact[0].id },
                  updatedContact
                );
              } else {
                const createdContact = await Contacts.create(
                  contactData
                ).fetch();

                ownRole = createdContact.id;
              }
              // const createdContact = await Contacts.create(contactData).fetch();
              // ownRole = createdContact.id;
              myRole = element.answer;
            }

            if (element.question === 'is this a closing or a listing?') {
              updatedTransaction = await Transactions.update(
                { id: created.id },
                { type: element.answer }
              );
              if (element.answer == 'Listing') {
                if (cordinatorRole != '') {
                  updatedContact = await Contacts.update(
                    { id: cordinatorRole },
                    { roles: ["Seller's Coordinator"] }
                  ).fetch();
                }

                if (ownRole != '') {
                  updatedContact = await Contacts.update(
                    { id: ownRole },
                    { roles: ["Seller's Agent"] }
                  ).fetch();
                }
              }
            }

            if (
              element.question ===
              'is this an existing home or new construction?'
            ) {
              updatedExistingHome = await Transactions.update(
                { id: created.id },
                { existingHome: element.answer }
              ).fetch();
            }

            if (element.question === 'is the property vacant?') {
              PropertyVacantYes = await Transactions.update(
                { id: created.id },
                { vacantProperty: element.answer }
              ).fetch();
            }

            if (
              element.question === "what's the latest with the home inspection?"
            ) {
              if (element.answer == 'Scheduled') {
              } else if (element.answer == 'Need to be scheduled') {
                let obj = {};
                obj.note = 'Home inspection need to be scheduled.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == 'Wait to scheduled') {
                let obj = {};
                obj.note = 'Home inspection waiting to scheduled.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == 'Completed') {
                let obj = {};
                obj.note = 'Home inspection completed.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              }
            }

            if (element.question === 'When is the inspection scheduled?') {
              if (element.answer) {
                let obj = {};
                obj.note = `Home inspection scheduled on ${new Date(
                  element.answer
                ).toDateString()}.`;
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              }
            }

            if (
              element.question ===
              'which side is responsible for ordering the home warranty?'
            ) {
              if (element.answer == "Buyer's Side") {
                let obj = {};
                obj.note = 'Buyer is responsible for home warranty.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == "Seller's Side") {
                let obj = {};
                obj.note = 'Seller is responsible for home warranty.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              }
            }

            if (
              element.question ===
              'which side is responsible for the termite inspection?'
            ) {
              if (element.answer == "Buyer's Side") {
                let obj = {};
                obj.note = 'Buyer is responsible for termite inspection.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == "Seller's Side") {
                let obj = {};
                obj.note = 'Seller is responsible for termite inspection.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              }
            }

            if (element.question === 'who are you representing?') {
              representingBuyer = await Transactions.update(
                { id: created.id },
                { represent: element.answer }
              ).fetch();

              if (element.answer === 'Both' && myRole == 'Coordinator') {
                updatedrolesArray = [
                  "Buyer's Coordinator",
                  "Seller's Coordinator",
                ];

                let updatedroles = updatedrolesArray.filter(
                  (item, i, ar) => ar.indexOf(item) === i
                );

                updatedContact = await Contacts.update(
                  { id: ownRole },
                  { roles: updatedroles }
                ).fetch();
              } else if (
                element.answer === 'Both' &&
                myRole == "Buyer's Agent"
              ) {
                updatedroles = ["Buyer's Agent", "Seller's Agent"];
                updatedContact = await Contacts.update(
                  { id: ownRole },
                  { roles: updatedroles }
                ).fetch();
                updatedCoordinatorrolesArray = [
                  "Buyer's Coordinator",
                  "Seller's Coordinator",
                ];
                let updatedCoordinatorroles =
                  updatedCoordinatorrolesArray.filter(
                    (item, i, ar) => ar.indexOf(item) === i
                  );
                updatedContact = await Contacts.update(
                  { id: cordinatorRole },
                  { roles: updatedCoordinatorroles }
                ).fetch();
              }
            }

            if (
              element.question ===
              'Does the buyer want to attend the home inspection?'
            ) {
              if (element.answer == 'Yes') {
                let obj = {};
                obj.note = 'Buyer want to attend the home inspection.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == 'No') {
                let obj = {};
                obj.note = 'Buyer does not want to attend the home inspection.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              } else if (element.answer == 'Not Sure') {
                let obj = {};
                obj.note =
                  'Uncertain whether or not buyer wants to attend home inspection.';
                obj.transaction = created.id;
                obj.addedBy = req.identity.id;
                const createdNote = await Notes.create(obj);
              }
            }

            try {
              var createdAnswers = await TransactionAnswers.create(element);
            } catch (err) {
              //console.log(err);
            }
          }
        }

        return res.status(200).json({
          success: true,
          message: constantObj.Transaction.CREATED,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      var data = req.body;
      const id = req.param('id');

      if (data.status && data.status == 'closed') {
        data.closingDate = new Date();
      }

      const updated = await Transactions.update({ id: id }, data);

      return res.status(200).json({
        success: true,
        message: constantObj.Transaction.UPDATED,
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
      const detail = await Transactions.findOne({ id: id })
        .populate('workflow_id')
        .populate('addedBy');

      countQuery = {};
      countQuery.isDeleted = false;
      countQuery.transaction = id;
      countQuery.type = { in: ['Dates', 'Checklist'] };
      const total = await TransactionData.count(countQuery);
      countQuery.status = 'complete';
      const totalCompleted = await TransactionData.count(countQuery);
      //console.log("total",total,totalCompleted)
      if (total > 0) {
        detail.totalProgress = ((totalCompleted / total) * 100).toFixed(2);
      } else {
        detail.totalProgress = 0;
      }
      return res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (err) {
      //console.log(err)
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
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');

      var workflow_id = req.param('workflow_id');
      var status = req.param('status');
      var id = req.param('id');

      var role = req.param('role');

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
          { address: { $regex: search, $options: 'i' } },
          { pattern: { $regex: search, $options: 'i' } },
        ];
      }

      query.isDeleted = false;
      var sortquery = {};
      if (status) {
        query.status = status;
      }

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
      if (workflow_id) {
        query.workflow_id = ObjectId(workflow_id);
      }
      userId = req.identity.id;
      if (id) {
        userId = id;
      }

      // //console.log({user_id:userId,isDeleted:false,transaction:{"!=":null}})
      transactionUserids = [];
      transactionUserids.push(userId);
      {
      }
      var transactionIds = [];

      const otherTransactions = await Contacts.find({
        user_id: userId,
        isDeleted: false,
        transaction: { '!=': null },
      });

      if (role != 'Standard User') {
        const addedUsers = await Users.find({
          addedBy: userId,
          isDeleted: false,
        });

        if (addedUsers && addedUsers.length > 0) {
          addedUsers.forEach((element) => {
            transactionUserids.push(element.id);
          });
        }

        if (otherTransactions && otherTransactions.length > 0) {
          otherTransactions.forEach((element) => {
            transactionIds.push(ObjectId(element.transaction));
          });
        }
      }
      const ownTransactions = await Transactions.find({
        addedBy: { in: transactionUserids },
        isDeleted: false,
      });

      if (ownTransactions && ownTransactions.length > 0) {
        ownTransactions.forEach((element) => {
          transactionIds.push(ObjectId(element.id));
        });
      }

      query._id = { $in: transactionIds };

      db.collection('transactions')
        .aggregate([
          {
            $lookup: {
              from: 'workflows',
              localField: 'workflow_id',
              foreignField: '_id',
              as: 'workflow_id',
            },
          },
          {
            $unwind: {
              path: '$workflow_id',
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
              address: '$address',
              route: '$route',
              locality: '$locality',
              lat: '$lat',
              lng: '$lng',
              country: '$country',
              city: '$city',
              state: '$state',
              zipcode: '$zipcode',
              workflow_id: '$workflow_id',
              status: '$status',
              image: '$image',
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
          db.collection('transactions')
            .aggregate([
              {
                $lookup: {
                  from: 'workflows',
                  localField: 'workflow_id',
                  foreignField: '_id',
                  as: 'workflow_id',
                },
              },
              {
                $unwind: {
                  path: '$workflow_id',
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
                  address: '$address',
                  route: '$route',
                  locality: '$locality',
                  lat: '$lat',
                  lng: '$lng',
                  country: '$country',
                  city: '$city',
                  state: '$state',
                  zipcode: '$zipcode',
                  image: '$image',
                  closingDate: '$closingDate',
                  workflow_id: '$workflow_id',
                  status: '$status',
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
            .toArray(async (err, result) => {
              if (result && result.length > 0) {
                for await (const itm of result) {
                  countQuery = {};
                  countQuery.isDeleted = false;
                  countQuery.transaction = String(itm._id);
                  countQuery.type = { in: ['Dates', 'Checklist'] };
                  const total = await TransactionData.count(countQuery);
                  countQuery.status = { in: ['complete', 'skipped'] };
                  const totalCompleted = await TransactionData.count(
                    countQuery
                  );
                  if (total > 0) {
                    itm.totalProgress = (
                      (totalCompleted / total) *
                      100
                    ).toFixed(2);
                  } else {
                    itm.totalProgress = 0;
                  }
                }
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

  applyTemplate: async (req, res) => {
    try {
      const data = req.body;

      const query = {};
      query.template = data.tamplateId;
      query.addedBy = req.identity.id;
      query.transaction = data.transactionId;
      data.addedBy = req.identity.id;
      var counter = 1;

      // const appliedTemplate = await AppliedTemplates.findOne(query);

      // if (appliedTemplate) {
      //   return res.status(400).json({
      //     success: false,
      //     message: constantObj.Transaction.ALREADY_APPLIED,
      //   });
      // } else {
      const applyed = await AppliedTemplates.create(query).fetch();

      const templateTasks = await TemplateTasks.find({
        template: query.template,
        isDeleted: false,
      });

      if (templateTasks && templateTasks.length > 0) {
        for (let i = 0; i < templateTasks.length; i++) {
          let newdata = templateTasks[i];
          if (newdata.days == '') {
            delete newdata.days;
          }
          if (newdata.days) {
            newdata.days = Number(newdata.days);
          }
          //console.log(templateTasks[i],"Template task")
          const reminders = await Reminders.find({
            isDeleted: false,
            data_id: newdata.id,
          });
          newdata.referenceId = newdata.id;
          newdata.dateReference = newdata.referenceDate;
          delete newdata.id;
          newdata.type = 'Checklist';
          newdata.rank = counter;
          newdata.sharing_setting = templateTasks[i].sharing_setting;
          newdata.transaction = query.transaction;
          delete newdata.createdAt;
          delete newdata.updatedAt;
          newdata.addedBy = req.identity.id;
          newdata.template = query.template;
          delete newdata.addedBy;
          const createdTask = await TransactionData.create(newdata).fetch();

          //console.log(createdTask)
          if (reminders && reminders.length > 0) {
            for await (const itm of reminders) {
              itm.data_id = createdTask.id;
              itm.transactionId = data.transactionId;
              delete itm.id;
              delete data.createdAt;
              delete data.updatedAt;
              const createdReminder = await Reminders.create(itm);
            }
          }

          counter++;
        }
      }
      const templateOtherDetail = await DocumentDetail.find({
        template: query.template,
        isDeleted: false,
      });

      if (templateOtherDetail && templateOtherDetail.length > 0) {
        for (let i = 0; i < templateOtherDetail.length; i++) {
          let newdata = templateOtherDetail[i];
          const reminders = await Reminders.find({
            isDeleted: false,
            data_id: newdata.id,
          });
          newdata.referenceId = newdata.referenceId;
          delete newdata.id;
          if (newdata.days == '') {
            delete newdata.days;
          }
          if (newdata.days) {
            newdata.days = Number(newdata.days);
          }
          newdata.rank = counter;
          newdata.template = query.template;
          newdata.transaction = query.transaction;
          newdata.sharing_setting = templateOtherDetail[i].sharing_setting;
          delete newdata.createdAt;
          delete newdata.updatedAt;
          delete newdata.addedBy;

          const existingDoc = await TransactionData.find({
            transaction: query.transaction,
            title: newdata.title,
            isDeleted: false,
          });
          if (existingDoc.length == 0) {
            console.log(existingDoc.length, newdata.title);
            const createdTask = await TransactionData.create(newdata).fetch();

            if (reminders && reminders.length > 0) {
              for await (const itm of reminders) {
                itm.data_id = createdTask.id;
                itm.transactionId = data.transactionId;
                delete itm.id;
                delete data.createdAt;
                delete data.updatedAt;
                // //console.log(itm)
                const createdReminder = await Reminders.create(itm).fetch();
                //console.log(createdReminder)
              }
            }
          }

          // const createdTask = await TransactionData.create(newdata).fetch()

          counter++;
        }
      }

      return res.status(200).json({
        success: true,
        message: constantObj.Transaction.TEMPLATE_APPLIED,
      });
      // }
    } catch (err) {
      //console.log(err)
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getColumnsOfTable: async (req, res) => {
    try {
      var search = req.param('search');
      const addedBy = req.identity.id;
      const transactions = await Transactions.find({
        addedBy: req.identity.id,
      });
      var transactionIds = [];
      if (transactions && transactions.length > 0) {
        var transactionIds = transactions.map((elem) => ObjectId(elem.id));
      }
      var query = {};
      query.isDeleted = false;
      query.transaction = { $in: transactionIds };
      //console.log(query)

      if (search) {
        query.$or = [{ title: { $regex: search, $options: 'i' } }];
      }
      db.collection('transactiondata')
        .aggregate([
          {
            $match: query,
          },
          {
            $group: {
              _id: {
                title: '$title',
                // type:'$type'
              },
            },
          },
        ])
        .toArray((err, result) => {
          if (err) {
            return res.status(400).json({
              success: false,
              error: {
                code: 400,
                error: '' + error,
              },
            });
          } else {
            return res.status(200).json({
              success: true,
              data: result,
            });
          }
        });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          error: '' + error,
        },
      });
    }
  },

  getCounts: async (req, res) => {
    try {
      var transactionIds = [];
      transactionUserids = [];
      transactionUserids.push(req.identity.id);
      if (req.identity.role != 'Standard User') {
        const addedUsers = await Users.find({
          addedBy: req.identity.id,
          isDeleted: false,
        });

        if (addedUsers && addedUsers.length > 0) {
          addedUsers.forEach((element) => {
            transactionUserids.push(element.id);
          });
        }
        const otherTransactions = await Contacts.find({
          user_id: req.identity.id,
          isDeleted: false,
          transaction: { '!=': null },
        });
        if (otherTransactions && otherTransactions.length > 0) {
          otherTransactions.forEach((element) => {
            transactionIds.push(element.transaction);
          });
        }
      }
      // const otherTransactions = await Contacts.find({ user_id: req.identity.id, isDeleted: false, transaction: { "!=": null } })
      const ownTransactions = await Transactions.find({
        addedBy: { in: transactionUserids },
        isDeleted: false,
      });

      // if (otherTransactions && otherTransactions.length > 0) {
      //   otherTransactions.forEach(element => {
      //     transactionIds.push(element.transaction)
      //   });
      // }

      if (ownTransactions && ownTransactions.length > 0) {
        ownTransactions.forEach((element) => {
          transactionIds.push(element.id);
        });
      }
      const openTransaction = await Transactions.count({
        isDeleted: false,
        id: { in: transactionIds },
        status: { in: ['active', 'progress', 'on-hold', 'needs-attention'] },
      });
      const closedTransaction = await Transactions.count({
        isDeleted: false,
        id: { in: transactionIds },
        status: { in: ['closed'] },
      });
      return res.status(200).json({
        success: true,
        openTransaction,
        closedTransaction,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },

  getTransactionUsers: async (req, res) => {
    try {
      const id = req.param('id');
      if (!id || id == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Params missing.' },
        });
      } else {
        // const buyers = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['buyer']}}).populate('user_id')
        // const buyersAgent = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['buyersAgent']}}).populate('user_id')
        // const buyersCoordinator = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['buyersCoordinator']}}).populate('user_id')

        // const seller = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['seller']}}).populate('user_id')
        // const sellerAgent = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['sellerAgent']}}).populate('user_id')
        // const sellerCoordinator = await Contacts.find({transaction:id,addedBy:req.identity.id,isDeleted:false,status:"accepted",roles:{in:['sellerCoordinator']}}).populate('user_id')

        const buyers = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ['Buyer'] },
        }).populate('user_id');
        const buyersAgent = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ["Buyer's Agent"] },
        }).populate('user_id');
        const buyersCoordinator = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ["Buyer's Coordinator"] },
        }).populate('user_id');

        const seller = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ['Seller'] },
        }).populate('user_id');
        const sellerAgent = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ["Seller's Agent"] },
        }).populate('user_id');
        const sellerCoordinator = await Contacts.find({
          transaction: id,
          isDeleted: false,
          status: 'accepted',
          roles: { in: ["Seller's Coordinator"] },
        }).populate('user_id');
        return res.status(200).json({
          success: true,
          buyers: buyers,
          buyersAgent: buyersAgent,
          buyersCoordinator: buyersCoordinator,
          seller: seller,
          sellerAgent: sellerAgent,
          sellerCoordinator: sellerCoordinator,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  assignTransactions: async (req, res) => {
    try {
      const data = req.body;
      if (!data.to && !data.from) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Payload is missing.' },
        });
      }
      const updatedContact = await Contacts.update(
        { user_id: data.from },
        { user_id: data.to }
      );

      return res.status(200).json({
        success: true,
        message: 'Transaction re assigned successfully.',
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};
transactionEmail = function (options) {
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
          <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png"  />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">New Transaction Created for ${options.propertyAddress}</h2>
      </div>
      <div class="body" style="` +
    style.body +
    `">
          <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `">Hello a new transaction has been created for ` +
    options.companyName +
    ` in Smart Cloze</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600"> A new transaction is created for ${options.companyName} in Smart Cloze with the following 
    property address ${options.propertyAddress} . Use the link below to view more details and manage transaction .<br>
          
          </p>

          <div style="` +
    style.textCenter +
    `">
           <a style="text-decoration:none" href="` +
    constant.FRONT_WEB_URL +
    'transactions-details?id=' +
    options.id +
    `"><span style="` +
    style.btn +
    style.btnPrimary +
    `">View Transaction</span></a>
       </div>
        
      </div>
     

    </div>`;

  SmtpController.sendEmail(email, 'New Transaction Created', message);
};

transactionEmailCoordinator = function (options) {
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
          <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png"  />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">New Transaction Created</h2>
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
    options.name +
    `</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600"> Agent ${options.username} has created and added a transaction ${options.propertyAddress} on Smart Cloze.<br>
          
          </p>

      
        
      </div>
     
 
    </div>`;

  SmtpController.sendEmail(email, 'New Transaction Created By Agent', message);
};

transactionEmailCoordinator = function (options) {
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
          <img style="margin-bottom:20px;width: 39%!important;height: 39%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png"  />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">New Transaction Created</h2>
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
    options.name +
    `</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600"> Agent ${options.username} has created and added a transaction ${options.propertyAddress} on Smart Cloze.<br>
          
          </p>

      
        
      </div>
     

    </div>`;

  SmtpController.sendEmail(email, 'New Transaction Created By Agent', message);
};
