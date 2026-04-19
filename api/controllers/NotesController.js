/**
 * NotesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager;
 var ObjectId = require('mongodb').ObjectID;

module.exports = {
  
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to add Notes
     */
    addNote: async (req, res)=>{
        try{
            const data = req.body
            data.addedBy = req.identity.id
            const createdNote = await Notes.create(data)

            return res.status(200).json({
                success:true,
                message: constantObj.notes.CREATED
            })
        }catch(err){
            return res.status(200).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to update the Notes
     */
    updateNote: async (req, res)=>{
        try{
            const id = req.param('id')
            const data = req.body
            const updatedNote = await Notes.update({id:id},data)

            return res.status(200).json({
                success:true,
                message: constantObj.notes.UPDATED
            })
        }catch(err){
            return res.status(200).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns
     * @description Used to get the detail of note using id 
     */

    getNote: async (req, res)=>{
        try{
            const id = req.param('id')
              const data  = await Notes.find({id:id})
              return res.status(200).json({
                  success:true,
                  data:data
              })
        }catch(err){
            return res.status(200).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to delete the note
     */
    destroyNote: async(req, res)=>{
        try{
            const id = req.param('id')
     
            const deletedNote = await Notes.destroy({id:id})

            return res.status(200).json({
                success:true,
                message: constantObj.notes.DELETED
            })
        }catch(err){
            return res.status(200).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },

    
  getNotesListing: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      var isDeleted = req.param('isDeleted');
      var transactionId = req.param('transactionId')
      var transactionDataId = req.param('transactionDataId')

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
          { note: { $regex: search, $options: 'i' } }
        ];
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
      if(transactionId){
        query.transactionId = ObjectId(transactionId);
      }

      if(transactionDataId){
        query.transactionData = ObjectId(transactionDataId)
      }
     
     
      db.collection('notes')
        .aggregate([
          {
            $lookup: {
              from: 'transactions',
              localField: 'transaction',
              foreignField: '_id',
              as: 'transaction_id',
            },
          },
          {
            $unwind: {
              path: '$transaction_id',
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
              from: 'transactiondata',
              localField: 'transactionData',
              foreignField: '_id',
              as: 'transactionData',
            },
          },
          {
            $unwind: {
              path: '$transactionData',
              preserveNullAndEmptyArrays: true,
            },
          },  

          {
            $project: {
              note: '$note',         
              transaction: '$transaction_id',
              transactionId: '$transaction_id._id', 
              transactionData:"$transactionData",
              status: '$status',
              addedBy: '$addedBy',
              addedById: '$addedBy._id',
              createdAt: '$createdAt',
              isDeleted: '$isDeleted',
       
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          db.collection('notes')
            .aggregate([
                {
                    $lookup: {
                      from: 'transactions',
                      localField: 'transaction',
                      foreignField: '_id',
                      as: 'transaction_id',
                    },
                  },
                  {
                    $unwind: {
                      path: '$transaction_id',
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
                      from: 'transactiondata',
                      localField: 'transactionData',
                      foreignField: '_id',
                      as: 'transactionData',
                    },
                  },
                  {
                    $unwind: {
                      path: '$transactionData',
                      preserveNullAndEmptyArrays: true,
                    },
                  },       
          
        
                  {
                    $project: {
                      note: '$note',         
                      transaction: '$transaction_id',
                      transactionId: '$transaction_id._id', 
                      transactionData:"$transactionData",
                      status: '$status',
                      clientStatus:"$clientStatus",
                      addedBy: '$addedBy',
                      addedById: '$addedBy._id',
                      createdAt: '$createdAt',
                      isDeleted: '$isDeleted',
               
                    },
                  },
                  {
                    $match: query,
                  },
              {
                $sort: sortquery,
              },

              // {
              //   $skip: Number(skipNo),
              // },
              // {
              //   $limit: Number(count),
              // },
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

