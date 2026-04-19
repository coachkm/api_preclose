/**
 * ExpenseController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {
  

    addExpense: async (req, res)=>{
        try {
            var data = req.body
            data.addedBy = req.identity.id
            const created = await Expense.create(data).fetch()

            return res.status(200).json({
                success:true,
                "message":"Entery created successfully."
            })
        } catch (error) {
            return res.status(200).json({
                success:false,
                error:{code:400,message:""+error}
            })
        }
    },


    updateDetail: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
      
                const updated =await Expense.update({id:id},data)
                return res. status(200).json({
                    "success":true,
                    "message": "Entry updated successfully."
                })
         
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getListing: async(req, res)=>{
        try {
            var search = req.param('search');
            var page = req.param('page');
         
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
                    { name: { $regex: search, '$options': 'i' } },
                  
                   
                ]
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

              query.addedBy = ObjectId(req.identity.id)
         
            db.collection('expense').aggregate([
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
                        amount: "$amount",  
                        who:"$who", 
                        "note":"$note",
                        date:"$date",
                        payment:"$payment", 
                        addedBy:"$addedBy",                   
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

                db.collection('expense').aggregate([
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
                            amount: "$amount",  
                            who:"$who", 
                            "note":"$note",
                            date:"$date",
                            payment:"$payment",    
                            addedBy:"$addedBy",                          
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
           
            return res.status(400).json({
                "success": false,
                "error":{
                    "code": 400,
                    "error": ""+error,
                }
               
            });
        }
    }

};

