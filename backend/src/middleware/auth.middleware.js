const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma/client");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, error: "missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, role: true, active: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ ok: false, error: "invalid token" });
    }

    req.user = { sub: user.id, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "invalid token" });
  }
}

module.exports = { requireAuth };
