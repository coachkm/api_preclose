/**
 * ChatsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
const db = sails.getDatastore().manager
module.exports = {

    sendGroupMessage: async (req, res) => {

        var data = req.body

        const transactionId = data.transactionId
        const channelId = data.channelId
        var query = {}

        if(transactionId){
            query.transactionId = transactionId
        }
        if(channelId){
            query.channelId = channelId
        }else{
            query.channelId = null
        }
        const sendBy = req.identity.id
        query.type = ''


        try {
            const existedChat = await Chats.findOne(query)
            if (existedChat) {

                var existedMessages = existedChat.messages
                var messageData = {}
                messageData.date_time = new Date()
                messageData.message = data.message
                messageData.sendBy = req.identity.id
                messageData.id = new Date().getTime()
                messageData.likeReaction =[]
                messageData.heartReaction =[]
                messageData.laughReaction =[]
                messageData.surpriseReaction =[]
                messageData.sadReaction =[]
                messageData.angrayReaction =[]
                existedMessages.push(messageData)
                const updatedChat = await Chats.update({ id: existedChat.id }, { messages: existedMessages })


                return res.status(200).json({
                    success: true,
                    message: constantObj.chat.MESSAGE_SENT
                })

            } else {
                dataTocreate = []
                message = {}
                message.date_time = new Date()
                message.message = data.message
                message.sendBy = req.identity.id
                message.id = new Date().getTime()
                message.likeReaction =[]
                message.heartReaction =[]
                message.laughReaction =[]
                message.surpriseReaction =[]
                message.sadReaction =[]
                message.angrayReaction =[]
                if(data.type){
                    message.type = data.type
                }

                dataTocreate.push(message)



                var createdConversation = await Chats.create({ transactionId: transactionId,channelId:channelId, messages: dataTocreate, createdAt: new Date(), updatedAt: new Date() }).fetch()

                return res.status(200).json({
                    success: true,
                    message: constantObj.chat.MESSAGE_SENT
                })
            }
        } catch (err) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }


    },

    getTransactionMessages: async (req, res) => {
        try {
            var transactionId = req.param('transactionId')
            var channelId = req.param('channelId')
            var type = req.param('type')
            var query = {}
            if(type){
                query.type = type
            }
            if(transactionId){
                query.transactionId = ObjectId(transactionId); 
            }
            if(channelId){
                query.channelId = ObjectId(channelId); 
            }else{
                query.channelId = null
            }

            query.type =''
            db.collection('chats')
                .aggregate([
                    {
                        $match: query,
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
                        $unwind: {
                            path: '$messages',

                        },
                    },
          
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'sendBy',
                            foreignField: '_id',
                            as: 'sendBy',
                        },
                    },
                    {
                        $unwind: {
                            path: '$sendBy',
                            preserveNullAndEmptyArrays: true,
                        },
                    },

                    {
                        $project: {
                            transactionId: "$transactionId",
                            channelId:"$channelId",
                            sendBy: "$sendBy",
                            message: "$messages.message",
                            messageId:"$messages.id",
                            date_time: "$messages.date_time",
                            addedBy: '$addedBy',
                            referenceDate: '$referenceDate',
                            addedById: '$addedBy._id',
                            createdAt: '$createdAt',
                            isDeleted: '$isDeleted',
                        },
                    },


                ])
                .toArray((err, totalResult) => {
                    db.collection('chats')
                        .aggregate([
                            {
                                $match: query,
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
                                $unwind: {
                                    path: '$messages',

                                },
                            },
                            // Converting sendBy to object id 
                            { "$addFields": { "sendBy": { "$toObjectId": "$messages.sendBy" } } },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'sendBy',
                                    foreignField: '_id',
                                    as: 'sendBy',
                                },
                            },
                            {
                                $unwind: {
                                    path: '$sendBy',
                                    preserveNullAndEmptyArrays: true,
                                },
                            },

                            {
                                $project: {
                                    transactionId: "$transactionId",
                                    channelId:"$channelId",
                                    sendBy: "$sendBy",
                                    message: "$messages.message",
                                    likeReaction: "$messages.likeReaction",
                                    heartReaction: "$messages.heartReaction",
                                    surpriseReaction: "$messages.surpriseReaction",
                                    sadReaction: "$messages.sadReaction",
                                    laughReaction: "$messages.laughReaction",
                                    angrayReaction: "$messages.angrayReaction",
                                    messageId:"$messages.id",
                                    date_time: "$messages.date_time",
                                    addedBy: '$addedBy',
                                    referenceDate: '$referenceDate',
                                    addedById: '$addedBy._id',
                                    createdAt: '$createdAt',
                                    isDeleted: '$isDeleted',
                                },
                            },

                            {
                                $sort: { date_time: 1 },
                            },

                            //   {
                            //     $skip: Number(skipNo),
                            //   },
                            //   {
                            //     $limit: Number(count),
                            //   },
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
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },

    deleteMessage: async (req, res)=>{
        try {
            const data =req.query

            var findQuery = {}

            if(data.transactionId){
                findQuery.transactionId = data.transactionId
            }
            if(data.channelId){
                findQuery.channelId = data.channelId
            }else{
                findQuery.channelId = null
            }
            findQuery.type =''
            const chat  = await Chats.findOne(findQuery)
          
            if(chat){
                var messages = chat.messages
                const indexOfObject = messages.findIndex(object => {                 
                    return Number(object.id) === Number(data.id);
                  });
                  
              
                  
                  messages.splice(indexOfObject, 1);
                  const updatedChat = await Chats.update({id:chat.id},{messages:messages})
                  return res.status(200).json({
                      success:true,
                      message:constantObj.chat.MESSAGE_DELETED
                  })
            }else{
                return res.status(404).json({
                    success:false,
                    message:constantObj.chat.NOT_FOUND
                })
            }
        } catch (error) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },

    updateMessage: async (req, res)=>{
        try {
            const data =req.body
            var findQuery = {}

            if(data.transactionId){
                findQuery.transactionId = data.transactionId
            }
            if(data.channelId){
                findQuery.channelId = data.channelId
            }else{
                findQuery.channelId = null
            }
            findQuery.type = ''
            const chat  = await Chats.findOne(findQuery)
            if(chat){
                var messages = chat.messages
                const indexOfObject = messages.findIndex(object => {              
                    return Number(object.id) === Number(data.id);
                  });
                  if(data.message){
                    messages[indexOfObject].message = data.message
                  }
                 
                  
                  if(data.likeReaction){
                    messages[indexOfObject].likeReaction =data.likeReaction
                  }
                  if(data.laughReaction){
                    messages[indexOfObject].laughReaction =data.laughReaction
                  }

                  if(data.heartReaction){
                    messages[indexOfObject].heartReaction =data.heartReaction
                  }

                  if(data.surpriseReaction){
                    messages[indexOfObject].surpriseReaction =data.surpriseReaction
                  }

                  if(data.sadReaction){
                    messages[indexOfObject].sadReaction =data.sadReaction
                  }

                  if(data.angrayReaction){
                    messages[indexOfObject].angrayReaction =data.angrayReaction
                  }

                  const updatedChat = await Chats.update({id:chat.id},{messages:messages})
                  return res.status(200).json({
                      success:true,
                      message:constantObj.chat.MESSAGE_UPDATED
                  })
            }else{
                return res.status(404).json({
                    success:false,
                    message:constantObj.chat.NOT_FOUND
                })
            }
        } catch (error) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },


    sendMessage:async (req , res )=>{
        const data = req.body    
          
        try{
            var searchQuery = {}
            searchQuery.id = data.id
            var conversation = await Chats.findOne(searchQuery)
            var existingMesseges = conversation.messages

            let newMessage = {
            "date_time" : new Date(),
            "message" : data.message,
            "sendBy" : req.identity.id,
            "id" : new Date().getTime(),
            "likeReaction" : [],
            "heartReaction" : [],
            "laughReaction" : [],
            "surpriseReaction" : [],
            "sadReaction" : [],
            "angrayReaction" : []}
            existingMesseges.push(newMessage)
                const updatedChat = await Chats.update({id:conversation.id},{messages:existingMesseges})
            return res.status(200).json({
                "success":true,
                "data":updatedChat,
                "message":constantObj.chat.MESSAGE_SENT
            })
            // var users = await Users.find({id:{ in: [sendto, sendBy] }})
         
            // if(users.length == 2){
            //     let members = []
            //     members.push(users[0]['id'])
            //     members.push(users[1]['id'])   
                
            //     var searchQuery = {}
            //   if(data.type){
            //     searchQuery.type = data.type
            //   }else{
            //       data.type = 'normal'
            //   }
            //     var conversation = await Chats.find(searchQuery)
              
            //     var filteredArray = []
            //     if(conversation.length > 0){
            //         conversation.forEach(element => {  
            //             if(element.members){
            //                 if(element.members.length === members.length && element.members.every((value, index) => value === members[index])){
            //                     filteredArray.push(element)
            //                    }else{
            //                         members = [users[1]['id'],users[0]['id']]
            //                         if(element.members.length === members.length && element.members.every((value, index) => value === members[index])){
            //                             filteredArray.push(element)                     
            //                         }
            
            //                     }
            //             }                 
                     
            //         });
            //     }
         
            //     await new Promise(resolve => setTimeout(resolve, 2000));
            //     if(filteredArray && filteredArray.length > 0){
            //         data.date_time = new Date()
            //         let newData = data                   
            //         newData.receiver_readStatus = false
            //         var existedConversation = await Chats.findOne({id:filteredArray[0].id })              
            //         existedConversation.messages.push(newData)
            //         var updatedConversation = await Chats.update({ id: filteredArray[0].id }, {  messages: existedConversation.messages ,updatedAt: new Date()}).fetch()

                    // return res.status(200).json({
                    //     "success":true,
                    //     "data":updatedConversation,
                    //     "message":constantObj.chat.MESSAGE_SENT
                    // })
            //     }else{                
            //         dataTocreate = []
            //         data.date_time = new Date()
            //         let newData = data                   
            //         newData.receiver_readStatus = false                  
            //         dataTocreate.push(newData)
            //         if(!data.type){
            //             data.type = 'normal'
            //         }
            //         var createdConversation = await Chats.create({members: members, messages: dataTocreate,type:data.type ,createdAt:new Date() , updatedAt: new Date()}).fetch()
            //         var userTonotify = await Users.findOne({id:sendto})
           
           
            //         return res.status(200).json({
            //             "success":true,
            //             "data":createdConversation,
            //             "message":constantObj.chat.MESSAGE_SENT
            //         })
            //     }

            // }else{
            //     return ({
            //         "success":false,
            //         "error":{"code":400,"message":"User not found."}
            //     })
            // }
        }catch(err){          
            return ({
                "success":false,
                "error":{"code":400,"message":""+err}
            })
        }

    },
    createDirectChat: async (req, res)=>{
        try{
            var data = req.body
            const members = data.members
            var chatName = ''
         

            for await (const id of members) {
                var user = await Users.findOne({id:id})                
                chatName += user.firstName +" , "
              }
            data.members.push(req.identity.id)

            data.messages = []
            data.type = 'normal'
            data.chatName = chatName
            const createdChat = await Chats.create(data).fetch()

            return res.status(200).json({
                success:true,
                message: "Chat created successfully."
            })

        } catch (err) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }

    },


    getConnectedUsers: (req, res) => {
        var async = require('async');
        var user_id = req.identity.id
        let sortBy =  "updatedAt DESC"

        var transactionId = req.param('transactionId')
        var query = {}
        query.members = {
            'contains': user_id
        }
        query.type = 'normal'

        if(transactionId){
            query.transactionId = transactionId
        }
        Chats.find(query).sort(sortBy).then(connectedUsers => {
            return res.status(200).json({
                "success": true,
                "data": connectedUsers
            })

        })
    },

    getMesseges: (req, res) => {
        var async = require('async');
        var user_id = req.identity.id
        var friend_id = req.param('id')
        let members = [user_id, friend_id]
        var type = req.param('type')
        Chats.find({ members: { contains: user_id }, type: type }).then(connectedUsers => {
            let resData = {}
            if (connectedUsers.length > 0) {
                async.each(connectedUsers, async function (element, callback) {

                    // if(element.members.length === members.length && element.members.every((value, index) => value === members[index])){
                    if (members.every(ai => element.members.includes(ai))) {

                        resData = element
                    } else {
                        members = [friend_id, user_id]
                        if (element.members.length === members.length && element.members.every((value, index) => value === members[index])) {
                            resData = element
                        }

                    }
                    callback()
                }, function (error) {
                    if (error) {
                        return res.status(400).jsonx({
                            "success": false,
                            "error": {
                                "code": 400,
                                "message": error
                            }
                        });
                    } else {
                        return res.status(200).json({
                            "success": true,
                            "data": resData
                        })
                    }

                });
            } else {
                return res.status(200).json({
                    "success": true,
                    "data": resData
                })
            }
        })

    },

    getDirectMessages: async (req, res) => {
        try {
            var id = req.param('id')
  
            var query = {}
         
            if(id){
                query._id = ObjectId(id); 
            }
    
            db.collection('chats')
                .aggregate([
                    {
                        $match: query,
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
                        $unwind: {
                            path: '$messages',

                        },
                    },
                    // Converting sendBy to object id 
                    { "$addFields": { "sendBy": { "$toObjectId": "$messages.sendBy" } } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'sendBy',
                            foreignField: '_id',
                            as: 'sendBy',
                        },
                    },
                    {
                        $unwind: {
                            path: '$sendBy',
                            preserveNullAndEmptyArrays: true,
                        },
                    },

                    {
                        $project: {
                            transactionId: "$transactionId",
                            channelId:"$channelId",
                            sendBy: "$sendBy",
                            message: "$messages.message",
                            messageId:"$messages.id",
                            date_time: "$messages.date_time",
                            addedBy: '$addedBy',
                            referenceDate: '$referenceDate',
                            addedById: '$addedBy._id',
                            createdAt: '$createdAt',
                            isDeleted: '$isDeleted',
                        },
                    },


                ])
                .toArray((err, totalResult) => {
                    db.collection('chats')
                        .aggregate([
                            {
                                $match: query,
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
                                $unwind: {
                                    path: '$messages',

                                },
                            },
                            // Converting sendBy to object id 
                            { "$addFields": { "sendBy": { "$toObjectId": "$messages.sendBy" } } },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'sendBy',
                                    foreignField: '_id',
                                    as: 'sendBy',
                                },
                            },
                            {
                                $unwind: {
                                    path: '$sendBy',
                                    preserveNullAndEmptyArrays: true,
                                },
                            },

                            {
                                $project: {
                                    transactionId: "$transactionId",
                                    channelId:"$channelId",
                                    sendBy: "$sendBy",
                                    message: "$messages.message",
                                    likeReaction: "$messages.likeReaction",
                                    heartReaction: "$messages.heartReaction",
                                    surpriseReaction: "$messages.surpriseReaction",
                                    sadReaction: "$messages.sadReaction",
                                    laughReaction: "$messages.laughReaction",
                                    angrayReaction: "$messages.angrayReaction",
                                    messageId:"$messages.id",
                                    date_time: "$messages.date_time",
                                    addedBy: '$addedBy',
                                    referenceDate: '$referenceDate',
                                    addedById: '$addedBy._id',
                                    createdAt: '$createdAt',
                                    isDeleted: '$isDeleted',
                                },
                            },

                            {
                                $sort: { date_time: 1 },
                            },

                            //   {
                            //     $skip: Number(skipNo),
                            //   },
                            //   {
                            //     $limit: Number(count),
                            //   },
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
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },


    updateDirectMessage: async (req, res)=>{
        try {
            const data =req.body
            var findQuery = {}

           findQuery.id = data.id
            const chat  = await Chats.findOne(findQuery)
            if(chat){
                var messages = chat.messages
                const indexOfObject = messages.findIndex(object => {              
                    return Number(object.id) === Number(data.messageId);
                  });
                  if(data.message){
                    messages[indexOfObject].message = data.message
                  }
                 
                  
                  if(data.likeReaction){
                    messages[indexOfObject].likeReaction =data.likeReaction
                  }
                  if(data.laughReaction){
                    messages[indexOfObject].laughReaction =data.laughReaction
                  }

                  if(data.heartReaction){
                    messages[indexOfObject].heartReaction =data.heartReaction
                  }

                  if(data.surpriseReaction){
                    messages[indexOfObject].surpriseReaction =data.surpriseReaction
                  }

                  if(data.sadReaction){
                    messages[indexOfObject].sadReaction =data.sadReaction
                  }

                  if(data.angrayReaction){
                    messages[indexOfObject].angrayReaction =data.angrayReaction
                  }

                  const updatedChat = await Chats.update({id:chat.id},{messages:messages})
                  return res.status(200).json({
                      success:true,
                      message:constantObj.chat.MESSAGE_UPDATED
                  })
            }else{
                return res.status(404).json({
                    success:false,
                    message:constantObj.chat.NOT_FOUND
                })
            }
        } catch (error) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },

    deleteDirectMessage: async (req, res)=>{
        try {
            const data =req.query

            var findQuery = {}
            findQuery.id = data.id
       

            const chat  = await Chats.findOne(findQuery)

            if(chat){
                var messages = chat.messages
                const indexOfObject = messages.findIndex(object => {                 
                    return Number(object.id) === Number(data.messageId);
                  });
                  
              
                  
                  messages.splice(indexOfObject, 1);
                  const updatedChat = await Chats.update({id:chat.id},{messages:messages})
                  return res.status(200).json({
                      success:true,
                      message:constantObj.chat.MESSAGE_DELETED
                  })
            }else{
                return res.status(404).json({
                    success:false,
                    message:constantObj.chat.NOT_FOUND
                })
            }
        } catch (error) {
            return ({
                "success": false,
                "error": { "code": 400, "message": "" + error }
            })
        }
    },
};

