const express = require("express");
const router = express.Router();
const { executeQuery, executeUpdate } = require("../config/db");



/**
 * POST /api/review
 * Người dùng đánh giá sản phẩm sau khi hoàn thành đơn
 */
router.post("/", async (req, res) => {

    try {

        const {
            userId,
            masp,
            rating,
            comment
        } = req.body;



        if(!userId || !masp || !rating){

            return res.status(400).json({
                success:false,
                message:"Thiếu dữ liệu đánh giá"
            });

        }



        // ============================
        // KIỂM TRA ĐÃ MUA VÀ HOÀN THÀNH
        // ============================

        const checkOrder = await executeQuery(
        `
        SELECT COUNT(*) AS TOTAL

        FROM ORDERS o

        JOIN ORDER_ITEMS oi
        ON o.ORDER_ID = oi.ORDER_ID


        WHERE o.USER_ID = :userId

        AND oi.MASP = :masp

        AND o.STATUS='COMPLETED'

        `,
        {
            userId,
            masp
        });



        if(checkOrder.rows[0].TOTAL == 0){

            return res.status(400).json({

                success:false,

                message:
                "Bạn chỉ có thể đánh giá sản phẩm sau khi hoàn thành đơn hàng"

            });

        }



        // ============================
        // KIỂM TRA ĐÃ REVIEW CHƯA
        // ============================


        const existed = await executeQuery(
        `
        SELECT COUNT(*) AS TOTAL

        FROM PRODUCT_REVIEW

        WHERE USER_ID=:userId

        AND MASP=:masp

        `,
        {
            userId,
            masp
        });



        if(existed.rows[0].TOTAL > 0){

            return res.status(400).json({

                success:false,

                message:"Bạn đã đánh giá sản phẩm này rồi"

            });

        }




        // ============================
        // INSERT REVIEW
        // ============================


        await executeUpdate(
        `
        INSERT INTO PRODUCT_REVIEW
        (
            REVIEW_ID,
            USER_ID,
            MASP,
            RATING,
            COMMENT_TEXT,
            STATUS,
            CREATED_AT
        )

        VALUES
        (
            REVIEW_SEQ.NEXTVAL,
            :userId,
            :masp,
            :rating,
            :comment,
            'VISIBLE',
            SYSDATE
        )

        `,
        {
            userId,
            masp,
            rating,
            comment
        });



        res.json({

            success:true,

            message:"Đánh giá thành công"

        });



    }
    catch(err){

        console.error("[REVIEW ERROR]",err);


        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});





/**
 * GET review theo sản phẩm
 * GET /api/review/product/:masp
 */
router.get("/product/:masp", async(req,res)=>{


    try{

        const {masp}=req.params;


        const result = await executeQuery(
        `
        SELECT

        r.REVIEW_ID,

        u.USERNAME,

        r.RATING,

        r.COMMENT_TEXT,

        r.CREATED_AT


        FROM PRODUCT_REVIEW r


        JOIN USERS u

        ON r.USER_ID=u.USER_ID


        WHERE r.MASP=:masp


        AND r.STATUS='VISIBLE'


        ORDER BY r.CREATED_AT DESC

        `,
        {
            masp
        });



        res.json({

            success:true,

            data:result.rows

        });


    }
    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }


});

/**
 * GET review của user theo sản phẩm
 */
router.get("/user/:userId/:masp", async (req, res) => {
  try {

    const { userId, masp } = req.params;

    const result = await executeQuery(
      `
      SELECT
          REVIEW_ID,
          RATING,
          COMMENT_TEXT
      FROM PRODUCT_REVIEW
      WHERE USER_ID = :userId
      AND MASP = :masp
      `,
      {
        userId,
        masp
      }
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});




/**
 * ADMIN lấy tất cả đánh giá
 * GET /api/admin/reviews
 */
router.get("/admin/all", async(req,res)=>{


try{


const result = await executeQuery(
`
SELECT

r.REVIEW_ID,

r.USER_ID,

u.USERNAME,

r.MASP,

p.TENSP,

r.RATING,

r.COMMENT_TEXT,

r.STATUS,

r.CREATED_AT


FROM PRODUCT_REVIEW r


JOIN USERS u

ON r.USER_ID=u.USER_ID


JOIN SANPHAM p

ON r.MASP=p.MASP


ORDER BY r.CREATED_AT DESC

`
);



res.json({

success:true,

data:result.rows

});


}
catch(err){


res.status(500).json({

success:false,

message:err.message

});


}


});






/**
 * ADMIN ẩn đánh giá
 * PUT /api/admin/reviews/:id
 */
router.put("/admin/:id", async(req,res)=>{


try{


await executeUpdate(
`
UPDATE PRODUCT_REVIEW

SET STATUS='HIDDEN'

WHERE REVIEW_ID=:id

`,
{
id:req.params.id
});



res.json({

success:true,

message:"Đã ẩn đánh giá"

});


}
catch(err){


res.status(500).json({

success:false,

message:err.message

});


}


});




module.exports = router;