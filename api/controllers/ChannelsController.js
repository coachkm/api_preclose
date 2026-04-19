/**
 * ChannelsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager
module.exports = {

    createChannel: async (req, res) => {
        try {
            const data = req.body
            var query = {}
            query.channel = data.channel.toLowerCase()
            query.transactionId = data.id
            // const existed = await Channels.findOne(query)
            data.channel = data.channel.toLowerCase()
            data.addedBy = req.identity.id
            // if (existed) {
            //     return res.status(200).json({
            //         success: false,
            //         error: { code: 400, message: "Channel already exist." }
            //     })
            // } else {
                const created = await Channels.create(data).fetch()

                if(data.contacts && data.contacts.length > 0){
                    data.contacts.forEach(async element => {
                        let dataToCreate = {}
                        dataToCreate.contact = element
                        dataToCreate.channelId = created.id

                        const createContact = await ChannelContacts.create(dataToCreate)
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "Channel created succesfully."
                })
            // }
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: { code: 400, message: "" + err }
            })
        }
    },

    updateChannel: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
            data.channel =  data.channel.toLowerCase()
            // const contractType = await Channels.findOne({ name: data.name, id: { '!=': id } })
            // if (contractType) {
            //     return res.status(400).json({
            //         "success": false,
            //         "error": {
            //             "code": 400,
            //             "message": "Channel already exist."
            //         }
            //     })
            // } else {
                delete data.transactionId
                const updated = await Channels.update({ id: id }, data)
                if(data.contacts && data.contacts.length > 0){
                    const deleted = await ChannelContacts.destroy({channelId:id})
                    data.contacts.forEach(async element => {
                        let dataToCreate = {}
                        dataToCreate.contact = element
                        dataToCreate.channelId = id

                        const createContact = await ChannelContacts.create(dataToCreate)
                    });
                }
                return res.status(200).json({
                    "success": true,
                    "message": "Channel updated successfully."
                })
            // }
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getDetail: async (req, res) => {
        try {
            const { id } = req.query
            const detail = await Channels.findOne({ id: id })
            const contacts = await ChannelContacts.find({channelId:id}).populate('contact')
            detail.contacts = contacts
            return res.status(200).json({
                "success": true,
                "data": detail
            })
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getListing: async (req, res) => {
        try {
            var search = req.param('search');
            var page = req.param('page');

            var isDeleted = req.param('isDeleted')
            var transactionId = req.param('transactionId')
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
            if(transactionId){
                query.transactionId = ObjectId(transactionId)
            }else{
                query.addedBy = ObjectId(req.identity.id)
            }

            if (isDeleted) {
                if (isDeleted === 'true') {
                    isDeleted = true;
                } else {
                    isDeleted = false;
                }
                query.isDeleted = isDeleted;
            }

            db.collection('channels').aggregate([
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
                        channel: "$channel",
                        transactionId: "$transactionId",
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

                db.collection('channels').aggregate([
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
                            channel: "$channel",
                            transactionId: "$transactionId",
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
                "error": {
                    "code": 400,
                    "error": "" + error,
                }

            });
        }
    },

    deleteChannel: async (req, res)=>{
        try{
            var id = req.param('id')

            const deleted = await Channels.destroy({id:id})
            return res.status(200).json({
                success:true,
                message:"Channel removed successfully."
            })
        }catch(err){
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    }
};

