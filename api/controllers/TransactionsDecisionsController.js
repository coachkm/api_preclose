/**
 * TransactionsDecisionsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
    assignUnassignDecision: async (req, res)=>{
        try{
            const data = req.body

            if(!data.transactionId || !data.descisionId){
                return res.status(400).json({
                    success:false,
                    error:{code:400,message:"Payload missing"}
                })
            }
            var query = {}
            query.transactionId = data.transactionId
            query.descisionId = data.descisionId
            const existed = await TransactionsDecisions.findOne(query)

            if(existed){
                const unassigned = await TransactionsDecisions.destroy({id:existed.id})
                return res.status(200).json({
                    success:true,
                    message:"Descision page un-assigned successfully."
                })
            }else{
                const created = await TransactionsDecisions.create(data)
                return res.status(200).json({
                    success:true,
                    message:"Descision page assigned successfully."
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

