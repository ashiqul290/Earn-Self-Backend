const { apiResponse } = require("../utils/apiResponse")

exports.isAuthoraize = (req,res , next)=>{
    if(req.session.user?.login){
        next()
    }else{
        apiResponse(res, 403 , "try login first")
    
    }
}