const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP code." });
  }

  try {
    const totalUsers = await prisma.user.count();
    let user = await prisma.user.findUnique({ where: { mobileNumber } });

    if (!user) {
      const assignedRole = (totalUsers === 0) ? "SUPER_ADMIN" : "TRAINER";
      user = await prisma.user.create({
        data: { mobileNumber, role: assignedRole }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'golds_secret_key',
      { expiresIn: '1d' }
    );

    return res.status(200).json({ success: true, token, role: user.role });
  } catch (err) {
    return res.status(500).json({ error: "Database error." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Gold's Gym backend running on port ${PORT}`));
