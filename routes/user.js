const user = require("../models/user");
const {
  verifyToken,
  verifyTokenAuthorisation,
  verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

// UPDATE
router.put("/:id", verifyTokenAuthorisation, async (req, res) => {
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString();
  }
  try {
    const updatedUser = await user.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete("/:id", verifyTokenAuthorisation, async (req, res) => {
  try {
    await user.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET USER
router.get("/find/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const userDoc = await user.findById(req.params.id);
    const { password, ...others } = userDoc._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL USER
router.get("/", verifyTokenAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const userDoc = query
      ? await user.find().sort({ _id: -1 }).limit(1)
      : await user.find();
    res.status(200).json(userDoc);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET USER STATS
router.get("/stats", verifyTokenAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
  try {
    const data = await user.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
