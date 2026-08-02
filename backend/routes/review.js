const express = require("express");
const router = express.Router();

const {
    executeQuery,
    executeUpdate
} = require("../config/db");



/*
====================================
 USER CREATE REVIEW
 POST /api/review
====================================
*/

router.post("/", async (req,res)=>{

try{

const {
    userId,
    orderId,
    masp,
    rating,
    comment
}=req.body;

console.log({
      userId,
      orderId,
      masp,
      rating,
      comment,
    });

if(!userId || !masp || !rating){

return res.status(400).json({

success:false,
message:"Thiếu dữ liệu đánh giá"

});

}



/*
 Kiểm tra đã mua hàng
*/

const checkOrder = await executeQuery(
`
SELECT COUNT(*) AS TOTAL
FROM ORDERS o
JOIN ORDER_ITEMS oi
ON o.ORDER_ID = oi.ORDER_ID
WHERE o.ORDER_ID = :orderId
AND o.USER_ID = :userId
AND oi.MASP = :masp
AND o.STATUS = 'COMPLETED'
`,
{
orderId,
userId,
masp
}
);

console.log("CHECK ORDER:", checkOrder.rows);

if(checkOrder.rows[0].TOTAL==0){

return res.status(400).json({

success:false,

message:
"Bạn chỉ được đánh giá sau khi hoàn thành đơn hàng"

});

}




/*
 Kiểm tra review tồn tại
*/


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
}
);



if(existed.rows[0].TOTAL>0){

return res.status(400).json({

success:false,

message:"Bạn đã đánh giá sản phẩm này"

});

}





/*
 INSERT REVIEW
*/


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
    :p_userId,
    :p_masp,
    :p_rating,
    :p_comment,
    'ACTIVE',
    SYSDATE
)
`,
{
    p_userId: userId,
    p_masp: masp,
    p_rating: rating,
    p_comment: comment
}
);



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






/*
====================================
 GET REVIEW PRODUCT
 GET /api/review/product/:masp
====================================
*/


router.get("/product/:masp",async(req,res)=>{


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


LEFT JOIN USERS u

ON r.USER_ID=u.USER_ID


WHERE r.MASP=:masp


AND r.STATUS='ACTIVE'


ORDER BY r.CREATED_AT DESC

`,
{
masp
}

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





/*
====================================
 CHECK USER REVIEW
 GET /api/review/user/:userId/:masp
====================================
*/


router.get("/user/:userId/:masp",
async(req,res)=>{


try{


const {
userId,
masp
}=req.params;



const result = await executeQuery(

`
SELECT

REVIEW_ID,

RATING,

COMMENT_TEXT,

STATUS


FROM PRODUCT_REVIEW


WHERE USER_ID=:userId

AND MASP=:masp

`,
{
userId,
masp
}

);



res.json({

success:true,

data:
result.rows[0] || null

});



}
catch(err){


res.status(500).json({

success:false,

message:err.message

});


}


});/*
====================================
 ADMIN GET ALL REVIEWS
 GET /api/review/admin/all
====================================
*/


router.get("/admin/all", async(req,res)=>{


try{


const result = await executeQuery(

`
SELECT

r.REVIEW_ID,

r.USER_ID,

r.MASP,

u.USERNAME,

p.TENSP AS TENSP,

r.RATING,

r.COMMENT_TEXT,

r.STATUS,

r.CREATED_AT


FROM PRODUCT_REVIEW r


LEFT JOIN USERS u

ON r.USER_ID=u.USER_ID


LEFT JOIN SANPHAM p

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


console.error("[ADMIN REVIEW ERROR]",err);


res.status(500).json({

success:false,

message:err.message

});


}


});







/*
====================================
 ADMIN HIDE REVIEW
 PUT /api/review/admin/:id
====================================
*/


router.put("/admin/:id",async(req,res)=>{


try{


const {id}=req.params;



await executeUpdate(

`
UPDATE PRODUCT_REVIEW

SET STATUS='HIDDEN'

WHERE REVIEW_ID=:id

`,
{
id
}

);



res.json({

success:true,

message:"Đã ẩn đánh giá"

});



}
catch(err){


console.error("[HIDE REVIEW ERROR]",err);


res.status(500).json({

success:false,

message:err.message

});


}


});





module.exports = router;