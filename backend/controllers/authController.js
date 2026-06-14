import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const registerUser = async (req, res) => {
  try {
    const { name,username, email, password, mobileno, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).josn({
        success: false,
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      mobileno,
      role,
    });
    res.status(201).json({
      success: true,
      message: "User successfully created",
      user: {
        _id: user._id,
        username:user.username,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
    console.log(message)
  }
};

const loginUser = async (req, res) => {
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).josn({
                success:false,
                message :"User does not exist"
            })
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect Password!"
            })
        }

        const token = jwt.sign({
            _id:user.id,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn : '7d'
        }
        );
        res.status(200).json({
            success:true,
            message:"Login Successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                token,
            },
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    };
};
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export  {registerUser,loginUser,getMe};
