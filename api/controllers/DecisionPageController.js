/**
 * DecisionPageController
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
     * @description Used to add decisionPage
     */
    createDecisionPage: async (req, res) => {
        try {
            const data = req.body
            data.addedBy = req.identity.id
            const createdNote = await DecisionPage.create(data)

            return res.status(200).json({
                success: true,
                message: constantObj.decisionPage.CREATED
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @description Used to update the DecisionPage
     */
    updateDecisionPage: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
            const updatedNote = await DecisionPage.update({ id: id }, data)

            return res.status(200).json({
                success: true,
                message: constantObj.decisionPage.UPDATED
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns
     * @description Used to get the detail of DecisionPage using id 
     */

    getDecisionPage: async (req, res) => {
        try {
            const id = req.param('id')
            const data = await DecisionPage.findOne({ id: id })
            return res.status(200).json({
                success: true,
                data: data
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                error: { code: 400, message: "" + err }
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
    destroyDecisionPage: async (req, res) => {
        try {
            const id = req.param('id')

            const deletedNote = await DecisionPage.destroy({ id: id })

            const deleteTransactionDesion = await TransactionsDecisions.destroy({ transactionId: id })

            return res.status(200).json({
                success: true,
                message: constantObj.decisionPage.DELETED
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },


    getDecisionPageListing: async (req, res) => {
        try {
            var search = req.param('search');
            var page = req.param('page');
            var sortBy = req.param('sortBy');
            var transactionId = req.param("transactionId")

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

            if (transactionId) {
                transactionContact = await Contacts.findOne({ transaction: transactionId, isDeleted: false, user_id: req.identity.id })
                if (transactionContact && transactionContact.roles && transactionContact.roles.length > 0) {
                    var buyer = transactionContact.roles.includes("Buyer")
                    if (buyer == true) {
                        delete query.isDeleted
                        query.transactionId = ObjectId(transactionId)
                        db.collection('transactionsdecisions')
                            .aggregate([
                                {
                                    $lookup: {
                                        from: 'decisionpage',
                                        localField: 'descisionId',
                                        foreignField: '_id',
                                        as: 'descisionId',
                                    },
                                },
                                {
                                    $unwind: {
                                        path: '$descisionId',
                                        preserveNullAndEmptyArrays: true,
                                    },
                                },

                                {
                                    $project: {
                                        descisionId: '$descisionId',
                                        transactionId: '$transactionId',
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
                                if (err) {
                                    return res.status(400).json({
                                        success: false,
                                        error: {
                                            code: 400,
                                            error: '' + err,
                                        },
                                    });
                                }
                                db.collection('transactionsdecisions')
                                    .aggregate([
                                        {
                                            $lookup: {
                                                from: 'decisionpage',
                                                localField: 'descisionId',
                                                foreignField: '_id',
                                                as: 'descisionId',
                                            },
                                        },
                                        {
                                            $unwind: {
                                                path: '$descisionId',
                                                preserveNullAndEmptyArrays: true,
                                            },
                                        },

                                        {
                                            $project: {
                                                descisionId: '$descisionId',
                                                transactionId: '$transactionId',
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

                                        if (err) {
                                            return res.status(400).json({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    error: '' + err,
                                                },
                                            });
                                        }

                                        return res.status(200).json({
                                            success: true,
                                            role: "Buyer",
                                            data: result,
                                            total: totalResult.length,
                                        });
                                    });
                            });
                    } else {
                        query.addedById = ObjectId(req.identity.id)

                        db.collection('decisionpage')
                            .aggregate([

                                {
                                    $lookup: {
                                        from: 'decisionpage',
                                        localField: 'descisionId',
                                        foreignField: '_id',
                                        as: 'descisionId',
                                    },
                                },
                                {
                                    $unwind: {
                                        path: '$descisionId',
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
                                    $project: {
                                        title: '$title',
                                        instruction: '$instruction',
                                        descisionId: "$descisionId",
                                        video_url: '$video_url',
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
                                if (err) {
                                    return res.status(400).json({
                                        success: false,
                                        error: {
                                            code: 400,
                                            error: '' + err,
                                        },
                                    });
                                }
                                db.collection('decisionpage')
                                    .aggregate([
                                        {
                                            $lookup: {
                                                from: 'decisionpage',
                                                localField: 'descisionId',
                                                foreignField: '_id',
                                                as: 'descisionId',
                                            },
                                        },
                                        {
                                            $unwind: {
                                                path: '$descisionId',
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
                                            $project: {
                                                title: '$title',
                                                instruction: '$instruction',
                                                video_url: '$video_url',

                                                descisionId: "$descisionId",
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

                                        if (err) {
                                            return res.status(400).json({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    error: '' + err,
                                                },
                                            });
                                        }

                                        console.log("Here")

                                        if (result && result.length > 0 && transactionId && transactionId != undefined) {


                                            for await (const itm of result) {
                                                const transactionDecisions = await TransactionsDecisions.findOne({ transactionId: transactionId, descisionId: String(itm._id) })

                                                if (transactionDecisions) {
                                                    itm.assigned = true
                                                } else {
                                                    itm.assigned = false
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
                    }
                } else {
                    return res.status(200).json({
                        success: true,
                        data: [],
                        total: 0,
                    });
                }
            } else {
                query.addedById = ObjectId(req.identity.id)

                db.collection('decisionpage')
                    .aggregate([
                        {
                            $lookup: {
                                from: 'decisionpage',
                                localField: 'descisionId',
                                foreignField: '_id',
                                as: 'descisionId',
                            },
                        },
                        {
                            $unwind: {
                                path: '$descisionId',
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
                            $project: {
                                title: '$title',
                                instruction: '$instruction',
                                video_url: '$video_url',
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
                        if (err) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 400,
                                    error: '' + err,
                                },
                            });
                        }
                        db.collection('decisionpage')
                            .aggregate([
                                {
                                    $lookup: {
                                        from: 'decisionpage',
                                        localField: 'descisionId',
                                        foreignField: '_id',
                                        as: 'descisionId',
                                    },
                                },
                                {
                                    $unwind: {
                                        path: '$descisionId',
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
                                    $project: {
                                        title: '$title',
                                        instruction: '$instruction',
                                        video_url: '$video_url',
                                        descisionId:"$descisionId",
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

                                if (err) {
                                    return res.status(400).json({
                                        success: false,
                                        error: {
                                            code: 400,
                                            error: '' + err,
                                        },
                                    });
                                }

                                if (result && result.length > 0 && transactionId && transactionId != undefined) {


                                    for await (const itm of result) {
                                        const transactionDecisions = await TransactionsDecisions.findOne({ transactionId: transactionId, descisionId: String(itm._id) })

                                        if (transactionDecisions) {
                                            itm.assigned = true
                                        } else {
                                            itm.assigned = false
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
            }


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

