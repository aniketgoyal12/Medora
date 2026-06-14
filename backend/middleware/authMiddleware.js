import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

const auth = (req,res,next) =>{
    const authHeader = req.header("Authorization");

    if(!authHeader){
        return res.status(401).json({
            message:"Token Missing",
        })
    };

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(
            token,
            SECRET_KEY
        );
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