/**
  * @DESC:  In this class/files category related functions (add, update, delete)
  * @Request param: Authorization and form data values
  * @Return : Success message with required data
  * @Author: JCsoftware Solution Pvt. Ltd.
*/

var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var ObjectID = require('mongodb').ObjectID;


module.exports = {
    // Used to update Content
    updateContent:  (data, context, req, res)=> {
        //console.log("In ContentManagment Update")
        let query = {};
        query.slug = data.slug
        data.updatedBy = context.identity.id
         ContentManagment.findOne(query).then( (contentExist)=> {
            if (contentExist) {
                 ContentManagment.update(query, data).then((updatedContent)=> {
                    return res.status(200).json({
                        success: true,
                        code: 200,
                        message: "Content updated successfully."
                    });
                });
            } else {
                return res.status(400).json({ success: false,error:{code: 400, message: "Some issue occur in updating content"} });
            }
        });
    },



}; // End Delete service class
