import { verifyAccessToken } from '../utils/jwt.js';


const auth = (req,res,next) =>{
    const authHeader = req.header("Authorization");

    if(!authHeader){
        return res.status(401).json({
            message:"Token Missing",
        })
    };

    const token = authHeader.split(" ")[1];


    if(!token){
        return res.status(401).json({
            success:false,
            message:"Invalid Authorization Header"
        })
    }
    try{
        const decoded = verifyAccessToken(token)
        req.user = decoded;
        next();
    } catch(err){
        res.status(401).json({
            message : err.message
        })
    }
}


const authorizeRoles = (...roles) =>{
    return (req,res,next) =>{
        if(!req.user || !roles.includes(req.user.role)){
            return res.status(400).json({
                success:false,
                message : "Access Denied"
            })
        }
        next();
    };
};

export { auth, authorizeRoles };