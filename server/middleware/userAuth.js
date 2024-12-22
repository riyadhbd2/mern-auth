import jwt from "jsonwebtoken";

// custom middleware for 
const userAuth = async(req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({ success: false, message: "Not authorized login again" });
  }
  try {

    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
        req.body.userId = tokenDecode.id;
    } else{
        return res.json({success: false, message: 'Not authorized, login again'})
    }

    next();

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;