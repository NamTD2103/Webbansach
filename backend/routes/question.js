const express = require("express");
const router = express.Router();

const {
    executeQuery,
    executeUpdate
} = require("../config/db");



// =========================
// USER GỬI CÂU HỎI
// POST /api/question
// =========================

router.post("/", async(req,res)=>{

try{

const {
    userId,
    masp,
    question
}=req.body;


if(!userId || !masp || !question){

    return res.status(400).json({
        success:false,
        message:"Thiếu dữ liệu"
    });

}


await executeUpdate(
`
INSERT INTO CUSTOMER_QUESTION
(
    QUESTION_ID,
    USER_ID,
    MASP,
    QUESTION_TEXT,
    STATUS,
    CREATED_AT
)
VALUES
(
    QUESTION_SEQ.NEXTVAL,
    :p_userId,
    :p_masp,
    :p_question,
    'PENDING',
    SYSDATE
)
`,
{
    p_userId: userId,
    p_masp: masp,
    p_question: question
});


res.json({
success:true,
message:"Gửi câu hỏi thành công"
});


}catch(err){

console.error(err);

res.status(500).json({
success:false,
message:err.message
});

}

});





// =========================
// ADMIN LẤY TẤT CẢ CÂU HỎI
// GET /api/admin/questions
// =========================


router.get("/admin",async(req,res)=>{


try{


const result =
await executeQuery(
`
SELECT

q.QUESTION_ID,
q.USER_ID,
u.USERNAME,
q.MASP,
p.TENSP,
q.QUESTION_TEXT,
q.ANSWER_TEXT,
q.STATUS,
q.CREATED_AT


FROM CUSTOMER_QUESTION q


JOIN USERS u
ON q.USER_ID=u.USER_ID


JOIN SANPHAM p
ON q.MASP=p.MASP


ORDER BY q.CREATED_AT DESC

`
);



res.json({

success:true,

data:result.rows

});



}catch(err){

console.error(err);

res.status(500).json({

success:false,

message:err.message

});


}


});






// =========================
// ADMIN TRẢ LỜI
// PUT /api/admin/questions/:id
// =========================


router.put("/admin/:id",async(req,res)=>{


try{


const {
answer
}=req.body;



if(!answer){

return res.status(400).json({

success:false,

message:"Nội dung trả lời trống"

});

}



await executeUpdate(
`
UPDATE CUSTOMER_QUESTION

SET

ANSWER_TEXT = :p_answer,
STATUS = 'ANSWERED',
ANSWERED_AT = SYSDATE
WHERE QUESTION_ID = :p_id
`,
{
    p_answer: answer,
    p_id: req.params.id
});



res.json({

success:true,

message:"Đã trả lời"

});



}catch(err){

console.error(err);


res.status(500).json({

success:false,

message:err.message

});


}


});






// =========================
// USER XEM CÂU HỎI THEO SP
// GET /api/question/:masp
// =========================


router.get("/:masp",async(req,res)=>{


try{


const result =
await executeQuery(
`
SELECT

q.QUESTION_ID,

u.USERNAME,

q.QUESTION_TEXT,

q.ANSWER_TEXT,

q.STATUS,

q.CREATED_AT


FROM CUSTOMER_QUESTION q


JOIN USERS u

ON q.USER_ID=u.USER_ID



WHERE q.MASP=:masp


ORDER BY q.CREATED_AT DESC

`,
{
masp:req.params.masp
});


res.json({

success:true,

data:result.rows

});



}catch(err){


res.status(500).json({

success:false,

message:err.message

});


}


});





module.exports=router;