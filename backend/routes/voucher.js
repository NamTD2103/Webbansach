const express = require("express");
const router = express.Router();

const {
    executeQuery,
    executeUpdate
} = require("../config/db");

router.post("/apply", async (req, res) => {

    try {

        const { code, subtotal } = req.body;

        const result = await executeQuery(
        `
        SELECT
            VOUCHER_ID,
            CODE,
            DISCOUNT_VALUE,
            DISCOUNT_TYPE,
            QUANTITY,
            STATUS,
            START_DATE,
            END_DATE
        FROM VOUCHERS
        WHERE UPPER(CODE)=UPPER(:code)
        `,
        {
            code
        });

        if (!result.rows.length) {

            return res.status(404).json({
                success:false,
                message:"Voucher không tồn tại"
            });

        }

        const voucher = result.rows[0];

        if (voucher.STATUS !== "ACTIVE") {

            return res.status(400).json({
                success:false,
                message:"Voucher không khả dụng"
            });

        }

        if (voucher.QUANTITY <= 0) {

            return res.status(400).json({
                success:false,
                message:"Voucher đã hết lượt sử dụng"
            });

        }

        let discount = 0;

        if (voucher.DISCOUNT_TYPE === "PERCENT") {

            discount =
                subtotal * voucher.DISCOUNT_VALUE / 100;

        } else {

            discount =
                Number(voucher.DISCOUNT_VALUE);

        }

        if (discount > subtotal) {
            discount = subtotal;
        }

        res.json({

            success:true,

            voucher,

            discount

        });

    } catch(err){

        console.error(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});

module.exports = router;