/**
 * SmtpController
 *
 * @description :: Server-side logic for managing Smtp
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 var nodemailer = require('nodemailer');
 var smtpTransport = require('nodemailer-smtp-transport');


 module.exports = {

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @description Used to get smtp detail
 * @createdAt 24/10/2021
 */
smtp : (req,res)=>{    
    Smtp.find({}).then(smtp=>{
        if(smtp.length >0){
            return res.status(200).json({
                "success": true,
                "code":200,
                "data":smtp[0],
            })
        }else{
            return res.status(200).json({
                "success": true,
                "code":200,
                "data":{},
            })
        }        
    });
},
/**
 * 
 * @param {*} req {id:""}
 * @param {*} res 
 * @description Used to update the smtp details
 * @createdAt 24/10/2021
 * @returns {success:"",code:"",data:""}
 */
edit : (req,res)=>{
    var id = req.param('id')  
  
    data = req.body
    Smtp.updateOne({id:id},data).then(updatedSmtp=>{
        return res.status(200).json({
            "success": true,
            "code":200,
            "data":updatedSmtp,
            "message":"SMTP updated successfully."
    
        })
    })

   
   
},
/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
testSMTP : (req, res)=>{
    data = req.body
    transport = nodemailer.createTransport(smtpTransport({
        host: data.host,
        port: data.port,      
        debug: true,
        sendmail: true,
        requiresAuth: true,
        auth: {
            user: data.user, 
            pass: data.pass
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
  
        
   
    transport.sendMail({
        from: 'jcsoftwaresolution  <' + data.user + '>',
        to: "test@yopmail.com",
        subject: "SMTP TESTING",
        html: "This is a test messege for SMTP check.SMTP credentials working fine."
    }, function (err, info) {
       
        
        clearTimeout(myVar);
        
        if(err){
            return res.status(400).json({
                success:false,
                "error": {"code": 400, "message" : ""+err}
            })
        }else{
            return res.status(200).json({
                "success": true,
                "code":200,               
                "message":"SMTP working successfully."
        
            })
            
        }
        
    });
},

sendEmail: ((to, subject, message, next)=>{

    Smtp.find({}).then(smtp=>{        
        if(smtp.length >0){
            transport = nodemailer.createTransport(smtpTransport({
                host: smtp[0].host,
                port: smtp[0].port,
                debug: true,
                sendmail: true,
                requiresAuth: true,
                auth: {
                    user: smtp[0].user, 
                    pass: smtp[0].pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            }));
            transport.sendMail({
                from: 'Smart Cloze  <' + smtp[0].user + '>',
                to: to,
                subject: subject,
                html: message
            }, function (err, info) {
                console.log('err', err, info)
                
            });

            
        }
    });

})
  


};
