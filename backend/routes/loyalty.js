const express = require("express");
const router = express.Router();

const {
    executeQuery,
    executeUpdate
} = require("../config/db");
// ======================================
// REDEEM POINT
// POST /api/loyalty/redeem
// ======================================
router.post("/redeem", async (req, res) => {

    try {

        const {
            userId,
            point
        } = req.body;

        if (!userId || !point) {

            return res.status(400).json({
                success: false,
                message: "Thiếu dữ liệu"
            });

        }

        // Lấy điểm hiện tại
        const userResult = await executeQuery(
        `
        SELECT
            LOYALTY_POINTS
        FROM USERS
        WHERE USER_ID=:userId
        `,
        {
            userId
        });

        if (!userResult.rows.length) {

            return res.status(404).json({
                success:false,
                message:"Không tìm thấy người dùng"
            });

        }

        const currentPoint =
            Number(userResult.rows[0].LOYALTY_POINTS || 0);

        if(currentPoint < point){

            return res.status(400).json({

                success:false,
                message:"Không đủ điểm"

            });

        }

        // Quy đổi điểm
        let discount = 0;

        switch(point){

            case 100:
                discount = 10000;
                break;

            case 200:
                discount = 20000;
                break;

            case 500:
                discount = 50000;
                break;

            case 1000:
                discount = 100000;
                break;

            default:

                return res.status(400).json({

                    success:false,
                    message:"Mức đổi không hợp lệ"

                });

        }

        // Sinh mã voucher
        const code =
            "POINT" +
            Math.random()
            .toString(36)
            .substring(2,8)
            .toUpperCase();

        // Thêm voucher
        await executeUpdate(
        `
        INSERT INTO VOUCHERS
        (
            CODE,
            DISCOUNT_VALUE,
            DISCOUNT_TYPE,
            QUANTITY,
            START_DATE,
            END_DATE,
            STATUS
        )
        VALUES
        (
            :code,
            :discount,
            'FIXED',
            1,
            SYSDATE,
            SYSDATE+30,
            'ACTIVE'
        )
        `,
        {
            code,
            discount
        });

        // Lấy voucher vừa tạo
        const voucherResult =
        await executeQuery(
        `
        SELECT
            MAX(VOUCHER_ID) VOUCHER_ID
        FROM VOUCHERS
        `,
        {});

        const voucherId =
            voucherResult.rows[0].VOUCHER_ID;

        // Lưu lịch sử đổi điểm
        await executeUpdate(
        `
        INSERT INTO POINT_REDEMPTION
        (
            USER_ID,
            VOUCHER_ID,
            POINT_USED
        )
        VALUES
        (
            :userId,
            :voucherId,
            :point
        )
        `,
        {
            userId,
            voucherId,
            point
        });

        // Trừ điểm
        await executeUpdate(
        `
        UPDATE USERS

        SET LOYALTY_POINTS=
        NVL(LOYALTY_POINTS,0)-:point

        WHERE USER_ID=:userId
        `,
        {
            point,
            userId
        });

        res.json({

            success:true,

            message:"Đổi điểm thành công",

            voucher:{
                id:voucherId,
                code,
                discount
            }

        });

    }
    catch(err){

        console.error(err);

        res.status(500).json({

            success:false,
            message:err.message

        });

    }

});
// ======================================
// GET LOYALTY POINTS
// GET /api/loyalty/:userId
// ======================================
router.get("/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        const result = await executeQuery(
        `
        SELECT
            LOYALTY_POINTS
        FROM USERS
        WHERE USER_ID = :userId
        `,
        {
            userId
        });

        if (!result.rows.length) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.json({
            success: true,
            points: result.rows[0].LOYALTY_POINTS || 0
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;