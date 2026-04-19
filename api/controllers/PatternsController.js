/**
 * PatternsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
 var constantObj = sails.config.constants;
module.exports = {

    addPattern: async (req, res)=>{
        try{
            const data = req.body
            const created = await Patterns.create(data).fetch()
            return res.status(200).json({
                "success":true,
                "message": constantObj.messages.PATTEREN_ADDED
            })
        }catch(err){
            return res.status(200).json({
                "success":false,
                "error":{"code":400,"message":""+err}
            })
        }
    },
  
    getPatterns: async (req, res)=>{
        try{
            let query = {}
            query.isDeleted = false
            const data = await Patterns.find(query)
            return res.status(200).json({
                "success":true,
                "data": data
            })
        }catch(err){
            return res.status(200).json({
                "success":false,
                "error":{"code":400,"message":""+err}
            })
        }
    }
};

