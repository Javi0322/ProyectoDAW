const { prisma } = require("../prisma/client");

async function getMe(req, res) {
  const userId = Number(req.user.sub);
if (!userId) {
  return res.status(401).json({ ok: false, error: "invalid token payload" });
}


  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      active: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: "User not found" });
  }

  return res.json({ ok: true, user });
}

module.exports = { getMe };
