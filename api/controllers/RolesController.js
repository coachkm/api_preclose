/**
 * RolesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager;
module.exports = {
  addRole: async (req, res) => {
    var data = req.body;
    try {
      const role = await Roles.findOne({ role: data.name });
      if (role) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constantObj.Role.ALREADY_EXIST,
          },
        });
      } else {
        data.addedBy = req.identity.id;
        const createdRole = await Roles.create(data).fetch();
        return res.status(200).json({
          success: true,
          message: constantObj.Role.CREATED,
        });
      }
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

  updateRole: async (req, res) => {
    var data = req.body;
    const id = req.param('id');

    try {
      const role = await Roles.findOne({ role: data.name, id: { '!=': id } });
      if (role) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: constantObj.Role.ALREADY_EXIST,
          },
        });
      } else {
        const updated = await Roles.update({ id: id }, data);
        return res.status(200).json({
          success: true,
          message: constantObj.Role.UPDATED,
        });
      }
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

  viewRole: async (req, res) => {
    try {
      const role = await Roles.findOne({ id: req.param('id') });
      return res.status(200).json({
        success: true,
        data: role,
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

  getAllRoles: function (req, res, next) {
    try {
      var search = req.param('search');
      var page = req.param('page');

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
        query.$or = [{ role: { $regex: search, $options: 'i' } }];
      }

      if (isDeleted) {
        if (isDeleted === 'true') {
          isDeleted = true;
        } else {
          isDeleted = false;
        }
        query.isDeleted = isDeleted;
      }

      db.collection('roles')
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
              name: '$name',
              permission: '$permission',
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
          db.collection('roles')
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
                  name: '$name',
                  permission: '$permission',
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

  roleListing: async (req, res)=>{

    var search = req.param('search')
    var defaultRoles = [

{title:"Admin"},
{title:"All Cash Appraiser"},
{title:"Appraiser"},
{title:"Asbestos Inspector"},
{title:"Buyer"},
{title:"Buyer Attorney"},
{title:"Buyer's Agent"},
{title:"Buyer's Coordinator"},
{title:"Buying Broker"},
{title:"Chimney Inspector"},
{title:"Closer"},
{title:"Closing Attorney"},
{title:"Co-List agent"},
{title:"Coastal Feature Inspector"},
{title:"Crawl Space Inspector"},
{title:"Deeds Restrictions and Zoning Inspector"},
{title:"Drywall Inspector"},
{title:"Electric Inspector"},
{title:"Environmental Site Assessor"},
{title:"Escrow Agent"},
{title:"Escrow Title Rep"},
{title:"Escrowee"},
{title:"Flood Insurance Provider"},
{title:"Flood Plain Zone Determination Inspector"},
{title:"Gas Inspector"},
{title:"Ground Water Inspector"},
{title:"Hazardous Substance Inspector"},
{title:"HOA"},
{title:"Home Improvement Provider"},
{title:"Home Inspector"},
{title:"Home Inspector Company"},
{title:"Home Insurance Provider"},
{title:"Home Security Provider"},
{title:"Home Warranty Provider"},
{title:"HVAC Inspector"},
{title:"Inspector"},
{title:"Land Insurance Provider"},
{title:"Landlord"},
{title:"Lawn Care/Landscape Provider"},
{title:"Lawn Irrigation System Provider"},
{title:"Lead Contamination Inspector"},
{title:"Lead Inspector"},
{title:"Lender"},
{title:"Listing Agent Assistant"},
{title:"Listing Agent Office Manager"},
{title:"Listing Broker"},
{title:"Loan Officer"},
{title:"Loan Officer Assistant"},
{title:"Loans Processor"},
{title:"Locksmith"},
{title:"Managing Broker"},
{title:"Mechanical Inspector"},
{title:"Meth Inspector"},
{title:"Mold Inspector"},
{title:"Moving and Storage"},
{title:"Municipality Building Inspector"},
{title:"My Team"},
{title:"New Role Not Defined"},
{title:"Nonrefundable Deposit"},
{title:"Operations Manager"},
{title:"Other"},
{title:"OWTS Design Approval"},
{title:"Paralegal"},
{title:"Percolation Inspector"},
{title:"Pest Inspector"},
{title:"Photographer"},
{title:"Pool Inspector"},
{title:"Pre-Closer"},
{title:"Production assistant"},
{title:"Property Manager"},
{title:"Radon Inspector"},
{title:"Ribbon Representative"},
{title:"Roof Inspector"},
{title:"Seller"},
{title:"Seller Attorney"},
{title:"Seller's Agent"},
{title:"Seller's Coordinator"},
{title:"Septic Inspector"},
{title:"Service Provider"},
{title:"Settlement"},
{title:"Sewer Lateral Inspector"},
{title:"Sewer Scope Inspector"},
{title:"Sewer System Inspector"},
{title:"Smoke Detector Compliance"},
{title:"Structural Inspector"},
{title:"Stucco Inspector"},
{title:"Surveyor"},
{title:"Tenant"},
{title:"Tenant Agent"},
{title:"Termite Inspector"},
{title:"Third Part Requirements"},
{title:"Title Agent"},
{title:"Transaction Coordinator"},
{title:"Utilities Provider"},
{title:"Water Inspector"},
{title:"Well Inspector"},
{title:"Well Water Inspector"},
{title:"Wetlands Determination Inspector"},
{title:"Wind Mitigation Inspector"},
{title:"Wood Destroying Insects Inspector"},
{title:"WoodPecker Surveyor"},

    ]
    if (search) {
      const regexp = new RegExp(search, 'i');
      filterTest = defaultRoles.filter(x => regexp.test(x.title))
      return res.status(200).json({
        success:true,
        data:filterTest
      })
    }else{
      return res.status(200).json({
        success:true,
        data:defaultRoles
      })
    }

    
  }
};
