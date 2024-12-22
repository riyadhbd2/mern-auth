import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import userModel from "../models/userModel.js";

// user register function
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "User is already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    // token create
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // set token in the cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "node" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // sending welcome email
    const mailOptionsWelcome = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to my-dream",
      text: `welcome to my-dream. Your account has been created with email id: ${email}`,
    };

    await transporter.sendMail(mailOptionsWelcome);

    // success message of successful register
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// user login function
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Password" });
    }
    // token create
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // set token in the cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "node" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// logout function
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "node" : "strict",
    });
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// send verify OTP function
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account Already verified" });
    }

    // generate OTP 6 digit
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // set otp for the user in database
    user.verifyOtp = otp;
    // set the expire time of the otp
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    //send email for otp
    const mailOptionOtp = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP`,
    };

    await transporter.sendMail(mailOptionOtp);

    res.json({ success: true, message: 'Verification OTP send on Email'});


  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// veryfy email function
export const verifyEmail = async(req, res)=>{

    const {userId, otp} = req.body;

    if(!userId || !otp){
        return res.json({success: false, message: 'Missing Details'})
    }

    try {

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({success: false, message: 'User not found'})
        }

        if (user.verifyOtp === "" || user.verifyOtp !== otp) {
            return res.json({success: false, message: 'Invalid OTP'})
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({success: false, message: 'OTP expired'})
        }
        
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: 'Email verified successfully'});

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
