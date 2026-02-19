const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma/client");
const { verifyPassword } = require("../services/password.service");

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "email and password required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.active === false) {
    return res.status(401).json({ ok: false, error: "invalid credentials" });
  }

  const passOk = await verifyPassword(password, user.password);
  if (!passOk) {
    return res.status(401).json({ ok: false, error: "invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  return res.json({ ok: true, accessToken: token });
}

module.exports = { login };
