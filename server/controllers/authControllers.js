const userModel = require('../model/user.model');
const refreshTokenModel = require('../model/refreshToken.model');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, name, pwd } = req.body;
  const role = "user"; // Mặc định role là "user"
  if (!email || !name || !pwd) {
    return res
      .status(400)
      .json({ message: "Email, name and password are required." });
  }

  const duplicateCheck = await userModel.findUserByEmail(email);

  if (duplicateCheck.length > 0) {
    return res.status(409).json({ message: "Email already exists." });
  }
  try {
    const hashedPassword = await bcrypt.hash(pwd, 10);
    await userModel.createUser(email, name, hashedPassword, role);
    return res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

exports.login = async (req, res) => {
  try {
    const cookies = req.cookies;
    const { email, pwd } = req.body;

    if (!email || !pwd) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // 1. Tìm user
    const userRows = await userModel.findUserByEmail(email);

    if (userRows.length === 0) return res.sendStatus(401);

    const foundUser = userRows[0];

    // 2. Check password
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (!match) return res.sendStatus(401);

    const oldRefreshToken = cookies?.token;

    // 3. HANDLE REUSE + ROTATION
    if (oldRefreshToken) {
      const tokenRows = await refreshTokenModel.findRefreshToken(oldRefreshToken);

      // ❗ REUSE DETECTED
      if (tokenRows.length === 0) {
        console.log("⚠️ Refresh token reuse detected at login");
        const foundUserId = foundUser.id;

        await refreshTokenModel.deleteUserRefreshToken(foundUserId);
      } else {
        // ✔️ token hợp lệ → xoá để rotation
        await refreshTokenModel.deleteRefreshToken(oldRefreshToken);
      }

      // clear cookie cũ
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
    }

    // 4. Tạo access token (NHẸ)
    const accessToken = jwt.sign(
      {
        id: foundUser.id,
        role: foundUser.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    // 5. Tạo refresh token
    const newRefreshToken = jwt.sign(
      { id: foundUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" },
    );

    // 6. Lưu DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const foundUserId = foundUser.id;

    await refreshTokenModel.saveRefreshToken(foundUserId, newRefreshToken, expiresAt);

    // 7. Set cookie
    res.cookie("token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 8. Return
    return res.json({
      role: foundUser.role,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

exports.logout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.token) return res.sendStatus(204);
  
  const refreshToken = cookies.token;

  const foundUser = await refreshTokenModel.findRefreshToken(refreshToken);
  if(foundUser.length === 0) {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    return res.sendStatus(204);
  }
  await refreshTokenModel.deleteRefreshToken(refreshToken);
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  return res.sendStatus(204);
};

exports.refreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.token) {
      return res.sendStatus(401);
    }

    const refreshToken = cookies.token;
    console.log('Refreshtoken start', refreshToken);

    // clear cookie cũ
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    // 1. check DB
    const rows = await refreshTokenModel.findValidRefreshToken(refreshToken);
    console.log('found rows', rows.length);

    // ❗ REUSE DETECT
    if (rows.length === 0) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
        );

        console.log("⚠️ Token reuse detected");
        const decodedId = decoded.id;

        await refreshTokenModel.deleteUserRefreshToken(decodedId);
      } catch (err) {
        return res.sendStatus(403);
      }

      return res.sendStatus(403);
    }

    const userId = rows[0].user_id;

    // 2. verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // token hết hạn → xoá
      await refreshTokenModel.deleteRefreshToken(refreshToken);
      return res.sendStatus(403);
    }

    // 3. rotation: xoá token cũ
    await refreshTokenModel.deleteRefreshToken(refreshToken);

    // 4. lấy user
    const userRows = await userModel.findUserById(userId);

    if (userRows.length === 0) {
      return res.sendStatus(403);
    }

    const user = userRows[0];

    // 5. tạo access token (ngắn hạn)
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    // 6. tạo refresh token mới
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" },
    );

    // 7. lưu DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    const UserId = user.id;

    await refreshTokenModel.saveRefreshToken(UserId, newRefreshToken, expiresAt);

    // 8. set cookie mới
    res.cookie("token", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 9. trả accessToken
    return res.json({ role: user.role, accessToken });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};
