/**
 * FAQController
 *
 * @description :: Server-side logic for managing categories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// var _request = require('request');
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager

module.exports = {
    save: async (req, res)=> {
        var data = req.body
        if ((!data.question) || typeof data.question == undefined) {
            return res.status(404).json({ 'success': false, 'code': 404, 'message': constantObj.faq.QUESTION_REQUIRED });
        }

        let query = {}

       
        query.question = data.question;
        data.addedBy = req.identity.id

        var typeExist = await FAQ.findOne(query)

        if (typeExist) {
            return res.status(404).json({ success: false, error: { code: 404, message: constantObj.faq.FAQ_ALREADY_EXIST } });
        } else {
            const savedFAQ = await FAQ.create(data).fetch()
            return res.status(200).json({
                success: true,
                code: 200,
                faq: savedFAQ,
                message: constantObj.faq.FAQ_SAVED

            });

        }
    },

    update: function (req, res) {
        var data = req.body
        let query = {};
        const id = req.param('id')
        query.id = id
        data.updatedBy = req.identity.id

        if(!id || id == undefined){
            return res.status(404).json({
                "success":false,
                "error":{"code":400,"message":constantObj.faq.ID_REQUIRED}
            })
        }

        FAQ.findOne(query).then((userExist) => {

            if (userExist) {

                FAQ.update({id:id}, data).then((updatedFAQ) => {
                    return res.status(200).json({
                        success: true,                        
                        FAQ: updatedFAQ,
                        message: constantObj.faq.FAQ_UPDATED

                    });
                })
            } else {
                return res.status(400).json({ success: false, code: 400, message: constantObj.faq.ISSUE_IN_UPDATE });
            }
        })
    },


    getAllFAQs: function (req, res, next) {

      
        try {
            var search = req.param('search');
            var page = req.param('page');
            var status = req.param('status')
            var isDeleted = req.param('isDeleted')
            
            if (!page) {
                page = 1
            }
            var count = parseInt(req.param('count'));
            if (!count) {
                count = 10
            }
            var skipNo = (page - 1) * count;
            var query = {};
            if (search) {
                query.$or = [
                    { question: { $regex: search, '$options': 'i' } },
                    { answer: { $regex: search, '$options': 'i' } },
                   
                ]
            }
            if (status) {
                query.status = status;
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
         
            db.collection('faq').aggregate([
                {
                    $lookup: {
                      from: 'users',
                      localField: 'deletedBy',
                      foreignField: '_id',
                      as: "deletedBy"
                    }
                  },
                  {
                    $unwind: {
                      path: '$deletedBy',
                      preserveNullAndEmptyArrays: true
                    }
                  },


                {
                    $project: {
                        question: "$question",                      
                        answer: "$answer",                        
                        status: "$status",
                        createdAt: "$createdAt",
                        isDeleted: "$isDeleted",                      
                        deletedBy: "$deletedBy.fullName",
                        deletedAt: '$deletedAt'

                    }
                },
                {
                    $match: query
                },
            ]).toArray((err, totalResult) => {

                db.collection('faq').aggregate([
                    {
                        $lookup: {
                          from: 'users',
                          localField: 'deletedBy',
                          foreignField: '_id',
                          as: "deletedBy"
                        }
                      },
                      {
                        $unwind: {
                          path: '$deletedBy',
                          preserveNullAndEmptyArrays: true
                        }
                      },

                    {
                        $project: {
                            question: "$question",                      
                            answer: "$answer",                        
                            status: "$status",
                            createdAt: "$createdAt",
                            isDeleted: "$isDeleted",                      
                            deletedBy: "$deletedBy.fullName",
                            deletedAt: '$deletedAt'
    
                        }
                    },
                    {
                        $match: query
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },

                    {
                        $skip: Number(skipNo)
                    },
                    {
                        $limit: Number(count)
                    }
                ]).toArray((err, result) => {
                    return res.status(200).json({
                        "success": true,
                        "code": 200,
                        "data": result,
                        "total": totalResult.length,
                    });
                })

            })
        } catch (error) {
            //console.log(error)
            return res.status(400).json({
                "success": false,
                "code": 400,
                "error": ""+error,
            });
        }
    },

    getSingleFAQ: (req,res)=>{
        var id = req.param('id')

        if(!id || id == undefined){
            return res.status(404).json({
                success:false,
                "error": {code:404, message: "ID required"}
            })
        }else{
            FAQ.findOne({id:id}).then(faq=>{
                return res.json({
                    success:true,
                    code:200,
                    faq:faq
                })
            })
        }
    }



};