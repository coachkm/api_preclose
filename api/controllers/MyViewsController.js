/**
 * MyViewsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

 const constantObj = sails.config.constants;
 var ObjectId = require("mongodb").ObjectID;
module.exports = {
  
    createView: async (req, res)=>{
        try{
            const data = req.body 
            data.addedBy = req.identity.id 
            const createdView = await MyViews.create(data)

            return res.status(200).json({
                success:true,
                message:constantObj.Views.CREATED
            })
        }catch(err){
            return res.status(400).json({
                success:true,
                error:{code:400,message:""+err}
            })
        }
    },

    viewDetail: async (req, res)=>{
        try{
            const view = await MyViews.findOne({id:req.param('id')})

            return res.status(200).json({
                success:true,
                data:view
            })
        }catch(err){
            return res.status(400).json({
                success:true,
                error:{code:400,message:""+err}
            })
        }
    },

    editView: async (req, res)=>{
        try{
           const data = req.body
            const view = await MyViews.update({id:req.param('id')},data)

            return res.status(200).json({
                success:true,
                message:constantObj.Views.UPDATED
            })
        }catch(err){
            return res.status(400).json({
                success:true,
                error:{code:400,message:""+err}
            })
        }
    },

    getMyViews: async (req, res)=>{
        try{
            const views = await MyViews.find({addedBy:req.identity.id})
            if(views.length == 0){
                const data = {}
                data.name ="My default view" 
            data.addedBy = req.identity.id 
            const createdView = await MyViews.create(data)
            const myviews = await MyViews.find({addedBy:req.identity.id})
            return res.status(200).json({
                success:true,
                data:myviews
            })
            }else{
                return res.status(200).json({
                    success:true,
                    data:views
                })
            }

            
        }catch(err){
            //console.log(err)
            return res.status(400).json({
                success:true,
                error:{code:400,message:""+err}
            })
        }
    },

    deleteView: async (req, res)=>{
        try{
           
            const view = await MyViews.destroy({id:req.param('id')})

            return res.status(200).json({
                success:true,
                message:constantObj.Views.DELETED
            })
        }catch(err){
            return res.status(400).json({
                success:true,
                error:{code:400,message:""+err}
            })
        }
    },
};

