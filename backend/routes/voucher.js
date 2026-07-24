const express = require("express");
const router = express.Router();

router.post("/apply", async (req, res) => {
    const { code, subtotal } = req.body;

    // TODO: kiểm tra voucher trong Oracle

    return res.json({
        success: true,
        voucher: {
            CODE: code,
            DISCOUNT_TYPE: "PERCENT",
            DISCOUNT_VALUE: 10,
            VOUCHER_ID: 1
        },
        discount: subtotal * 0.1
    });
});

module.exports = router;