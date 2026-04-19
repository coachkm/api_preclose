/**
 * PlansController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var constantObj = sails.config.constants;

const db = sails.getDatastore().manager;
var ObjectId = require('mongodb').ObjectID;
var payment_const = require('../../config/local');
const { UserInstance } = require('twilio/lib/rest/chat/v1/service/user');
const stripe = require('stripe')(payment_const.PAYMENT_INFO.SECREATKEY);
module.exports = {
  createPlan: async (req, res) => {
    const data = req.body;
    if (!data.name || typeof data.name == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.plan.NAME_REQUIRED },
      });
    }
    if (!data.price || typeof data.price == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.plan.PRICE_REQUIRED },
      });
    }

    let query = {};

    data.name = data.name.toLowerCase();
    query.name = data.name;
    query.isDeleted = false

    Plans.findOne(query)
      .then(async (planExist) => {
        if (planExist) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constantObj.plan.ALREADY_EXIST },
          });
        } else {
          const product = await stripe.products.create({
            name: data.name,
            type: 'service',
          });

          const plan = await stripe.plans.create({
            nickname: data.name,
            amount: Number(data.price) * 100,
            interval: 'month',
            // interval_count: parseInt(requestBody.planIntervalNumber),
            product: product.id,
            currency: 'USD',
          });
          data.stripePlanId = plan.id;
          data.addedBy = req.identity.id;
          return Plans.create(data)
            .then((savedPlan) => {
              return res.status(200).json({
                success: true,
                plan: savedPlan,
                message: constantObj.plan.PLAN_CREATED,
              });
            })
            .catch((err) => {
              //console.log(err, 'err1');
              return res.status(400).json({
                success: false,
                error: { code: 400, message: '' + err },
              });
            });
        }
      })
      .catch((err2) => {
        //console.log(err2, 'err2');
        return res
          .status(400)
          .json({ success: false, error: { code: 400, message: '' + err2 } });
      });
  },
  getPlan: (req, res) => {
    var id = req.param('id');
    if (!id || id == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.plan.ID_REQUIRED },
      });
    } else {
      Plans.findOne({ id: id }).then((plan) => {
        return res.status(200).json({
          success: true,
          data: plan,
        });
      });
    }
  },

  updatePlan: async (req, res) => {
    try {
      const data = req.body;
      data.name = data.name.toLowerCase();
      var existedPlan = await Plans.findOne({
        name: data.name,
        id: { '!=': data.id },
      });
      if (existedPlan) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.plan.ALREADY_EXIST },
        });
      } else {
        var updatedPlan = await Plans.update({ id: data.id }, data);
        return res.status(200).json({
          success: true,
          message: constantObj.category.PLAN_UPDATED,
        });
      }
    } catch (err) {
      return res.staus(400).json({
        success: false,
        error: { code: 400, message: err },
      });
    }
  },

  getAllPlans: (req, res) => {
    var search = req.param('search');
    var sortBy = req.param('sortBy');
    var page = Number(req.param('page'));
    var count = Number(req.param('count'));
    var status = req.param('status');

    if (page == undefined) {
      page = 1;
    }

    if (count == undefined) {
      count = 10;
    }

    var skipNo = (page - 1) * count;
    var query = {};

    if (sortBy) {
      sortBy = sortBy.toString();
    } else {
      sortBy = 'createdAt desc';
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    var isDeleted = req.param('isDeleted');
    if (isDeleted === true || isDeleted === 'true') {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }
    if (status) {
      query.status = status;
    }

    db.collection('plans')
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
            id: '$_id',
            name: '$name',
            price: '$price',
            features: '$features',
            deletedBy: '$deletedBy.fullName',

            status: '$status',

            addedBy: '$addedBy',
            stripePlanId: '$stripePlanId',
            createdAt: '$createdAt',
            updatedBy: '$updatedBy',
            isDeleted: '$isDeleted',
            deletedAt: '$deletedAt',
            updatedAt: '$updatedAt',
          },
        },
        {
          $match: query,
        },
      ])
      .toArray((err, totalResult) => {
        db.collection('plans')
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
                id: '$_id',
                name: '$name',
                price: '$price',
                features: '$features',
                status: '$status',
                deletedBy: '$deletedBy.firstName',
                addedBy: '$addedBy',
                stripePlanId: '$stripePlanId',
                createdAt: '$createdAt',
                updatedBy: '$updatedBy',
                isDeleted: '$isDeleted',
                deletedAt: '$deletedAt',
                updatedAt: '$updatedAt',
              },
            },
            {
              $match: query,
            },
            { $sort: { createdAt: -1 } },

            {
              $skip: skipNo,
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
  },

  deletePlan: async (req, res) => {
    const id = req.param('id');
    try {
      const deletedPlan = await Plans.destroy({ id: id });
      return res.status(200).json({
        success: true,
        message: 'Plan deleted permanently.',
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getUserPlan: async (req, res) => {
    try {
      const userId = req.param('id');
      const user = await Users.findOne({ id: userId }).populate('plan_id');

      let userPlan = {};

      if (user && user.plan_id) {
        userPlan.planName = user.plan_id.name;
        userPlan.plan_id = user.plan_id.id;
        userPlan.features = user.plan_id.features;
        userPlan.price = user.plan_id.price;
        userPlan.validFrom = user.validFrom;
        userPlan.validupto = user.validupto;
        userPlan.subscription_id = user.subscription_id;
        userPlan.cards = user.paymentMethod;
      }

      return res.status(200).json({
        success: true,
        userPlan: userPlan,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },
};
