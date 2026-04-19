/**
 * SignaturesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
    addSignature: async (req, res)=>{
        try{
            var data = req.body
            data.createdBy = req.identity.id
            const existed = await Signatures.findOne({createdBy:req.identity.id,isDeleted:false})

            if(existed){
                const createdSignature = await Signatures.update({id:existed.id},data)

                return res.status(200).json({
                    success:true,
                    message:"Signature updated successfully."
                })
            }else{
                const createdSignature = await Signatures.create(data)

                return res.status(200).json({
                    success:true,
                    message:"Signature created successfully."
                })
            }
         
        }catch(err){
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    },


    getSignature: async (req, res)=>{
        try{
            var query = {}
            query.createdBy = req.identity.id
            query.isDeleted = false
            const signatures = await Signatures.findOne(query)

            if(signatures){
                return res.status(200).json({
                    success:true,
                    data: signatures
                })
            }else{
                return res.status(200).json({
                    success:true,
                    data: {}
                })
            }
        }catch(err){
            return res.status(400).json({
                success:false,
                error:{code:400,message:""+err}
            })
        }
    }
};

