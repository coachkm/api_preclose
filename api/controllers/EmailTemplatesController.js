/**
 * EmailTemplatesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

 var ObjectId = require('mongodb').ObjectID;
 var constantObj = sails.config.constants;
 const db = sails.getDatastore().manager

 const imap = require('imap-simple');
 const { convert } = require('html-to-text');
 const { simpleParser } = require('mailparser');
 const { find } = require('lodash');
 var nodemailer = require('nodemailer');
 var smtpTransport = require('nodemailer-smtp-transport');
 const sanitizeHtml = require('sanitize-html');
module.exports = {

    addTemplate: async (req, res) => {
        var data = req.body
        try {
            data.name = data.name.toLowerCase()
            // const emailTemplates = await EmailTemplates.findOne({name:data.name,addedBy:req.identity.id})
            // if(emailTemplates){
            //     return res.status(400).json({
            //         "success":false,
            //         "error":{
            //             "code":400,
            //             "message": constantObj.emailTemplates.ALREADY_EXIST
            //         }
            //     })
            // }else{
                data.addedBy = req.identity.id
                const createdTemplate = await EmailTemplates.create(data).fetch()
                return res.status(200).json({
                    "success":true,
                    "message":constantObj.emailTemplates.CREATED
                })
            // }
        } catch (err) {
            //console.log(err)
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    getDetail: async (req, res) => {
        try {
            const {id} = req.query
            const detail = await EmailTemplates.findOne({id:id})
            return res.status(200).json({
                "success":true,
                "data":detail
            })
        } catch (err) {
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },

    updateDetail: async (req, res) => {
        try {
            const id = req.param('id')
            const data = req.body
            data.name = data.name.toLowerCase()
            // const emailTemplates = await EmailTemplates.findOne({name: data.name,id:{'!=':id}}) 
            // if(emailTemplates){
            //   return res.status(400).json({
            //       "success":false,
            //       "error":{
            //           "code":400,
            //           "message": constantObj.emailTemplates.ALREADY_EXIST
            //       }
            //   })
            // }else{
                const updated =await EmailTemplates.update({id:id},data)
                return res. status(200).json({
                    "success":true,
                    "message": constantObj.emailTemplates.UPDATED
                })
            // }
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
              const contacts = await Users.find({addedBy:req.identity.id,isDeleted:false})
              var user_ids = []
              user_ids.push(ObjectId(req.identity.id))
              if(contacts && contacts.length > 0){
                  for await (let user of contacts){
                    user_ids.push(ObjectId(user.id))
                  }
              }
              query.addedBy = {$in:user_ids}
         
            db.collection('emailtemplates').aggregate([
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
                        name: "$name",  
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

                db.collection('emailtemplates').aggregate([
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
                            name: "$name",   
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
    },

    deleteEmailTemplates: async (req, res)=>{
        try{
            const id = req.param('id')
            var deleted = await EmailTemplates.update({id:id},{isDeleted:true})
            return res. status(200).json({
                "success":true,
                "message": constantObj.emailTemplates.SOFT_DELETED
            })
        }catch(err){
            return res.status(400).json({
                "success": false,
                "error": { "code": 400, "message": "" + err }
            })
        }
    },



    getInbox: async (req, res)=>{            
        try {
            var transactionId = req.param('transactionId')
            if(!req.identity.imapEmail){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:constantObj.emailTemplates.EMAIL_NOT_CONNECTED}
                })
            }
        const result = [];
        var config = {
        imap: {
        user: req.identity.imapEmail,
        password: req.identity.imap,
        host: req.identity.imapHost,
        port: Number.parseInt(993),
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
        }
        };
        const connection = await imap.connect(config);
    //console.log('CONNECTION SUCCESSFUL', new Date().toString());
    const box = await connection.openBox('INBOX');
     var d = new Date();
        d.setDate(d.getDate() - 20);
    const searchCriteria =['ALL',['SINCE', d.toISOString()]];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
    };
    
    if(transactionId){
            response = []
            var results = []
            var hiddenText = transactionId
     results = await connection.search(searchCriteria, fetchOptions);
        console.log(result.length)
    results.forEach((res) => {
      const text = res.parts.filter((part) => {
        return part.which === 'TEXT';
      });
        if (text[0] && text[0].body) {
            let emailHTML = text[0].body;
            let emailText = convert(emailHTML);
            if (emailText.includes(`${hiddenText}`) == true) {
                // //console.log("in");
                response.push(res)
            }
        }
    //   //console.log(emailText);
    });
    connection.end();
    return res.status(200).json({
                "success":true,
                data:response,
                total:response.length
            })
    
//   } catch (error) {
//     //console.log(error);
//   }
        // const connection = await imap.connect(config);
        // await connection.openBox('INBOX');
        // var d = new Date();
        // d.setDate(d.getDate() - 20);
        // const messages = await connection.search(['All', ['SINCE', d.toISOString()]], { bodies: ['HEADER', 'TEXT']});
        // for (const item of messages) {
        // const all = find(item.parts, { 'which': 'TEXT' });
        // const header = find(item.parts, { which: 'HEADER' });
        // const id = item.attributes.uid;
        // const idHeader = 'Imap-Id: '+id+'\r\n';
        // const { html, textAsHtml, text } = await simpleParser(idHeader+all.body);
        // result.push({ html, id, textAsHtml, text, from: header.body.from });
        // }
        // result.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));

        // if(transactionId){
        //     response = []
        //     var hiddenText = `<p style="display: none;">${transactionId}</p>`
        //     for await (let itm of result){
        //         //console.log(itm);
        //         if(itm.textAsHtml.includes(`${hiddenText}`) == true){
        //             response.push(itm)
        //         }
        //     }

        //     return res.status(200).json({
        //         "success":true,
        //         data:response,
        //         total:response.length
        //     })
        }else{
            console.log("here")
            return res.status(200).json({
                "success":true,
                data:result,
                total:result.length
            })
        }
        
       
        // exits.success({ message: 'success', data: result });
        } catch (err) {
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err.message}
            })
        
        }
              
              
       
    },
    


    addEmailSMTP:async (req, res)=>{
        const data = req.body
     
        try {
            const result = [];
            var config = {
            imap: {
            user: data.email,
            password: data.password,
            host: data.host,
            port: Number.parseInt(993),
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
            }
            };
            const connection = await imap.connect(config);
            await connection.openBox('INBOX');
            var d = new Date();
            d.setDate(d.getDate() - 1);
            const messages = await connection.search(['All', ['SINCE', d.toISOString()]], { bodies: ['HEADER', 'TEXT']});
            dataToUpdate = {}
            dataToUpdate.imapEmail = data.email
            dataToUpdate.imap = data.password
            dataToUpdate.imapHost= data.host
            dataToUpdate.emailConnected = true
            const updatedUser = await Users.update({id:req.identity.id},dataToUpdate)
            return res.status(200).json({
                success:true,
                message:constantObj.emailTemplates.EMAIL_CONNECTED
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
    },

    replacingEmailTemplate: async (req, res)=>{
        try{
            const transactionId = req.param('transactionId')
            const emailTemplateId = req.param('emailTemplateId')

            const emailTemplate =await EmailTemplates.findOne({id:emailTemplateId})
            //console.log("transac",transactionId)
            let query = {}
            query.transaction = transactionId

            //console.log(query)
            const transactionData = await TransactionData.find(query)
            body = emailTemplate.body
            for await (let data of transactionData){
                var valueToReplace = `@${data.title}`

                if(data.time && data.time != ''){
                    valueToReplace = data.time
                }
                if(data.value  && data.value != "" ){
                    valueToReplace = data.value
                }

                if(data.date && data.date != ''){
                    valueToReplace = data.date
                }
                
                 emailTemplate.body = emailTemplate.body.replace(`@${data.title}`, valueToReplace);
            }
            // //console.log(emailTemplate)

            return res.status(200).json({
                success:true,
                data:emailTemplate
            })
        }catch(err){
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },

    sendEmail: async (req, res)=>{
        try{
            // var data = req.body

            if(!req.body.subject || req.body.subject == undefined){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:"Email subject required."}
                })
            }
            if(req.identity.imapEmail == '' || req.identity.imapEmail == undefined){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:"Please add smtp credentials first."}
                })
            }
            transport = nodemailer.createTransport(smtpTransport({
                host: req.identity.imapHost,
                port: 587,      
                debug: true,
                sendmail: true,
                requiresAuth: true,
                auth: {
                    user: req.identity.imapEmail, 
                    pass: req.identity.imap
                },
                tls: {
                    rejectUnauthorized: false
                }
            }));



            var myVar;

 
            myVar = setTimeout(() => {
                //console.log("sending res")
                return res.status(400).json({
                    success:false,
                    "error": {"code": 400, "message" : "SMTP credentials are not valid."}
                })
            
            }, 10000);
      

            //console.log(removeTags(req.body.subject))
            var attachments = []

            if(req.body.attachments && req.body.attachments.length > 0){
                attachments = req.body.attachments
            }
            var from = `${req.identity.fullName} < ${req.identity.imapEmail} >`
            transport.sendMail({
                from: from,
                to: req.body.to,
                subject: removeTags(req.body.subject),
                html: req.body.message,
                cc: req.body.cc,
                bcc: req.body.bcc,
                parentEmailId :req.body.parentEmailId,

                attachments: attachments
            }, async (err, info)=> {
               
                console.log(info)
                clearTimeout(myVar);
                
                if(err){
                    return res.status(400).json({
                        success:false,
                        "error": {"code": 400, "message" : ""+err}
                    })
                }else{

                    var data = {}
                    data.to = req.body.to
                    data.from = req.identity.imapEmail
                    data.subject = req.body.subject
                    data.message = req.body.message
                    data.attachments = req.body.attachments
                    data.transactionId = req.body.transactionId
                    data.sendBy = req.identity.id
                    data.cc = req.body.cc
                    data.bcc = req.body.bcc
                    parentEmailId = req.body.parentEmailId

                    const sentEmail = await Email.create(data)
                    return res.status(200).json({
                        "success": true,
                        "code":200,               
                        "message":"Email sent successfully."
                
                    })
                    
                }
                
            });
        }catch(err){
            console.log(err)
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    }
};

function removeTags(str) {
    if ((str===null) || (str==='') || (str == undefined))
        return false;
    else
        str = str.toString();
          
    // Regular expression to identify HTML tags in 
    // the input string. Replacing the identified 
    // HTML tag with a null string.
    var newStr = str.replace(/\&nbsp;/g, '');
    return newStr.replace( /(<([^>]+)>)/ig, '');
}
