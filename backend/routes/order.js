const express = require("express");
const router = express.Router();

const {
  executeQuery,
  executeUpdate,
  getConnection,
} = require("../config/db");
const sendOrderEmail = require("../utils/sendMail");

const oracledb = require("oracledb");
const PDFDocument = require("pdfkit");


// ======================================================
// GET ADMIN ORDER DETAIL
// GET /api/order/admin/:id
// ======================================================

router.get("/admin/:id", async (req, res) => {

  try {

    const { id } = req.params;


    const orderQuery = `
      SELECT
        o.ORDER_ID,
        o.USER_ID,
        o.STATUS,
        o.TOTAL_AMOUNT,
        o.PAYMENT_METHOD,
        o.ORDER_DATE,

        u.USERNAME,
        u.FULLNAME,
        u.EMAIL,
        u.PHONE,

        o.SHIPPING_ADDRESS AS ADDRESS

      FROM ORDERS o

      LEFT JOIN USERS u
      ON o.USER_ID = u.USER_ID

      WHERE o.ORDER_ID = :id
    `;


    const orderResult = await executeQuery(
      orderQuery,
      {
        id
      }
    );


    if (
      !orderResult.rows ||
      orderResult.rows.length === 0
    ) {

      return res.status(404).json({

        success:false,

        message:"Không tìm thấy đơn hàng"

      });

    }



    const itemsQuery = `

      SELECT

        oi.ITEM_ID,

        oi.MASP,

        sp.TENSP,

        sp.HINHANH AS IMAGE_URL,

        oi.SOLUONG,

        oi.PRICE,

        (oi.SOLUONG * oi.PRICE) AS TOTAL


      FROM ORDER_ITEMS oi


      LEFT JOIN SANPHAM sp

      ON oi.MASP = sp.MASP


      WHERE oi.ORDER_ID = :orderId


      ORDER BY oi.ITEM_ID

    `;



    const itemsResult = await executeQuery(
      itemsQuery,
      {
        orderId:id
      }
    );



    res.json({

      success:true,

      data:{

        ...orderResult.rows[0],

        ITEMS:itemsResult.rows || []

      }

    });



  }
  catch(error){

    console.error(
      "[ADMIN ORDER DETAIL ERROR]",
      error.message
    );


    res.status(500).json({

      success:false,

      message:error.message

    });

  }

});




// ======================================================
// CREATE ORDER
// POST /api/order/create
// ======================================================


router.post("/create", async(req,res)=>{


let connection;


try{


const {

userId,

customerInfo,

shippingAddress,

paymentMethod


}=req.body;



if(!paymentMethod){

return res.status(400).json({

success:false,

message:"Missing payment method"

});

}




// Lấy giỏ hàng


const cartQuery = `

SELECT
ci.MASP,
sp.TENSP,
sp.GIABAN,
ci.SOLUONG,
(ci.SOLUONG * sp.GIABAN) AS ITEM_TOTAL,
c.CART_ID
FROM CART_ITEM ci
JOIN CART c
ON ci.CART_ID = c.CART_ID
JOIN SANPHAM sp
ON ci.MASP = sp.MASP
WHERE c.USER_ID = :userId

`;



const cartResult = await executeQuery(

cartQuery,

{
userId
}

);



if(
!cartResult.rows ||
cartResult.rows.length===0
){

return res.status(400).json({

success:false,

message:"Cart is empty"

});

}




const cartItems = cartResult.rows;


const totalAmount =
cartItems.reduce(

(sum,item)=>

sum + Number(item.ITEM_TOTAL),

0

);



const cartId =
cartItems[0].CART_ID;




connection = await getConnection();



// ================================
// Lấy ORDER_ID từ sequence
// ================================


const orderSeq =
await connection.execute(

`
SELECT SEQ_ORDER_ID.NEXTVAL AS ORDER_ID
FROM DUAL
`,

[],

{
outFormat:
oracledb.OUT_FORMAT_OBJECT
}

);



const orderId =
orderSeq.rows[0].ORDER_ID;



// ================================
// Insert ORDERS
// ================================


await connection.execute(

`

INSERT INTO ORDERS

(

ORDER_ID,

USER_ID,

STATUS,

TOTAL_AMOUNT,

PAYMENT_METHOD,

ORDER_DATE,

CUSTOMER_NAME,

CUSTOMER_PHONE,

CUSTOMER_EMAIL,

SHIPPING_ADDRESS

)

VALUES

(

:orderId,

:userId,

'PENDING',

:totalAmount,

:paymentMethod,

SYSDATE,

:customerName,

:customerPhone,

:customerEmail,

:shippingAddress

)

`,

{


orderId,

userId,

totalAmount,

paymentMethod,


customerName:
customerInfo?.fullname || null,


customerPhone:
customerInfo?.phone || null,


customerEmail:
customerInfo?.email || null,


shippingAddress:

`${shippingAddress.street},
${shippingAddress.district},
${shippingAddress.province}`


},


{
autoCommit:false
}


);





// ================================
// Insert ORDER_ITEMS
// ================================


for(const item of cartItems){



const itemSeq =
await connection.execute(

`

SELECT SEQ_ORDER_ITEM_ID.NEXTVAL AS ITEM_ID

FROM DUAL

`,

[],

{
outFormat:
oracledb.OUT_FORMAT_OBJECT
}

);



const itemId =
itemSeq.rows[0].ITEM_ID;




await connection.execute(

`

INSERT INTO ORDER_ITEMS

(

ITEM_ID,

ORDER_ID,

MASP,

SOLUONG,

PRICE

)

VALUES

(

:itemId,

:orderId,

:masp,

:soluong,

:price

)

`,

{

itemId,

orderId,

masp:item.MASP,

soluong:item.SOLUONG,

price:item.GIABAN

},


{
autoCommit:false
}

);



}


// ================================
// Xóa giỏ hàng
// ================================


await connection.execute(

`
DELETE FROM CART_ITEM
WHERE CART_ID=:cartId
`,

{
cartId
},

{
autoCommit:false
}

);


// ================================
// CỘNG ĐIỂM TÍCH LŨY
// ================================

const loyaltyPoints = Math.floor(totalAmount / 10000);

await connection.execute(
`
UPDATE USERS
SET LOYALTY_POINTS =
NVL(LOYALTY_POINTS,0) + :points
WHERE USER_ID = :userId
`,
{
    points: loyaltyPoints,
    userId
},
{
    autoCommit: false
}
);

// Commit transaction

await connection.commit();

// ================================
// Gửi email xác nhận đơn hàng
// ================================

try {
  await sendOrderEmail({
    to: customerInfo.email,
    customerName: customerInfo.fullname,
    orderId,
    total: totalAmount,
    paymentMethod,
    items: cartItems.map(item => ({
      name: item.TENSP,
      quantity: item.SOLUONG,
      price: item.GIABAN,
    })),
  });

  console.log("✅ Đã gửi email xác nhận");
} catch (err) {
  console.error("❌ Gửi email thất bại:", err.message);
}

console.log(
`[ORDER] Created order ${orderId}`
);



res.json({

success:true,

message:"Order created successfully",

orderId,

totalAmount,

itemCount:cartItems.length

});



}
catch(error){


if(connection){

try{

await connection.rollback();

}
catch(e){

console.error(
"Rollback error:",
e.message
);

}

}



console.error(
"[CREATE ORDER ERROR]",
error.message
);



res.status(500).json({

success:false,

message:error.message

});


}
finally{


if(connection){

try{

await connection.close();

}
catch(e){

console.error(
"Close connection error:",
e.message
);

}

}


}


});







// ======================================================
// ADD ITEM TO ORDER
// POST /api/order/add-item
// ======================================================


router.post("/add-item", async(req,res)=>{


try{


const {

orderId,

masp,

soluong,

price


}=req.body;



if(
!orderId ||
!masp ||
!soluong ||
!price
){

return res.status(400).json({

success:false,

message:"Missing required fields"

});

}




const idResult =
await executeQuery(

`

SELECT NVL(MAX(ITEM_ID),0)+1 AS ITEM_ID

FROM ORDER_ITEMS

`

);



const itemId =
idResult.rows[0].ITEM_ID;




await executeUpdate(

`

INSERT INTO ORDER_ITEMS

(

ITEM_ID,

ORDER_ID,

MASP,

SOLUONG,

PRICE

)

VALUES

(

:itemId,

:orderId,

:masp,

:soluong,

:price

)

`,

{

itemId,

orderId,

masp,

soluong,

price

}

);




await executeUpdate(

`

UPDATE ORDERS

SET TOTAL_AMOUNT =
TOTAL_AMOUNT + (:soluong * :price)

WHERE ORDER_ID=:orderId

`,

{

soluong,

price,

orderId

}

);



res.json({

success:true,

message:"Added item successfully",

itemId

});



}
catch(error){


console.error(
"[ADD ITEM ERROR]",
error.message
);



res.status(500).json({

success:false,

message:error.message

});


}


});







// ======================================================
// GET ORDER DETAIL USER
// GET /api/order/:orderId
// ======================================================


router.get("/:orderId", async(req,res)=>{


try{


const {

orderId

}=req.params;




const orderQuery = `


SELECT

ORDER_ID,

USER_ID,

STATUS,

TOTAL_AMOUNT,

PAYMENT_METHOD,

ORDER_DATE


FROM ORDERS


WHERE ORDER_ID=:orderId


`;



const orderResult =
await executeQuery(

orderQuery,

{
orderId
}

);




if(
!orderResult.rows ||
orderResult.rows.length===0
){

return res.status(404).json({

success:false,

message:"Order not found"

});

}



const itemsQuery = `


SELECT

oi.ITEM_ID,

oi.MASP,

sp.TENSP,

sp.HINHANH AS IMAGE_URL,

oi.SOLUONG,

oi.PRICE,

(oi.SOLUONG * oi.PRICE) AS TOTAL


FROM ORDER_ITEMS oi


LEFT JOIN SANPHAM sp

ON oi.MASP = sp.MASP


WHERE oi.ORDER_ID=:orderId


ORDER BY oi.ITEM_ID


`;




const itemsResult =
await executeQuery(

itemsQuery,

{
orderId
}

);





res.json({

success:true,


data:{


...orderResult.rows[0],


items:
itemsResult.rows || []


}


});




}
catch(error){


console.error(

"[GET ORDER DETAIL ERROR]",

error.message

);



res.status(500).json({

success:false,

message:error.message

});


}


});







// ======================================================
// GET ORDER HISTORY USER
// GET /api/order/user/:userId
// ======================================================


router.get("/user/:userId", async(req,res)=>{


try{


const {

userId

}=req.params;



const {

page=1,

limit=10


}=req.query;



const offset =
(parseInt(page)-1)
*
parseInt(limit);




const countResult =
await executeQuery(

`

SELECT COUNT(*) AS TOTAL

FROM ORDERS

WHERE USER_ID=:userId

`,

{
userId
}

);



const total =
countResult.rows[0].TOTAL;




const ordersResult =
await executeQuery(

`

SELECT

ORDER_ID,

USER_ID,

STATUS,

TOTAL_AMOUNT,

ORDER_DATE


FROM ORDERS


WHERE USER_ID=:userId


ORDER BY ORDER_DATE DESC


OFFSET :offset ROWS

FETCH NEXT :limit ROWS ONLY


`,

{

userId,

offset,

limit:
parseInt(limit)

}

);




res.json({

success:true,

data:
ordersResult.rows || [],


total,


page:
parseInt(page),


limit:
parseInt(limit)


});



}
catch(error){


console.error(

"[USER ORDER ERROR]",

error.message

);



res.status(500).json({

success:false,

message:error.message

});


}


});
// ======================================================
// CANCEL ORDER
// PUT /api/order/:orderId/cancel
// ======================================================


router.put("/:orderId/cancel", async(req,res)=>{


try{


const {

orderId

}=req.params;



const result =
await executeQuery(

`

SELECT STATUS

FROM ORDERS

WHERE ORDER_ID=:orderId

`,

{
orderId
}

);




if(
!result.rows ||
result.rows.length===0
){

return res.status(404).json({

success:false,

message:"Order not found"

});

}




if(
result.rows[0].STATUS !== "PENDING"
){

return res.status(400).json({

success:false,

message:"Không thể hủy đơn hàng"

});

}




await executeUpdate(

`

UPDATE ORDERS

SET STATUS='CANCELLED'

WHERE ORDER_ID=:orderId

`,

{
orderId
}

);




res.json({

success:true,

message:"Đã hủy đơn hàng"

});



}
catch(error){


console.error(

"[CANCEL ORDER ERROR]",

error.message

);



res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================================
// REORDER
// POST /api/order/:orderId/reorder
// ======================================================


router.post("/:orderId/reorder", async(req,res)=>{


try{


const {

orderId

}=req.params;




const result =
await executeQuery(

`

SELECT

MASP,

SOLUONG

FROM ORDER_ITEMS

WHERE ORDER_ID=:orderId


`,

{
orderId
}

);




if(
result.rows.length===0
){

return res.status(404).json({

success:false,

message:"Không có sản phẩm"

});

}



res.json({

success:true,

items:
result.rows

});



}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================================
// REPAY ORDER
// POST /api/order/:orderId/pay
// ======================================================


router.post("/:orderId/pay", async(req,res)=>{


try{


const {

orderId

}=req.params;




await executeUpdate(

`

UPDATE ORDERS

SET STATUS='PAID'

WHERE ORDER_ID=:orderId

AND STATUS='PENDING'


`,

{
orderId
}

);




res.json({

success:true,

message:"Thanh toán thành công"

});



}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================================
// DOWNLOAD INVOICE PDF
// GET /api/order/:orderId/invoice
// ======================================================


router.get("/:orderId/invoice", async(req,res)=>{


try{


const {

orderId

}=req.params;




const doc =
new PDFDocument();




res.setHeader(

"Content-Type",

"application/pdf"

);



res.setHeader(

"Content-Disposition",

`attachment; filename=invoice-${orderId}.pdf`

);




doc.pipe(res);



doc.fontSize(20)

.text(
"BOOK STORE",
{
align:"center"
}
);



doc.moveDown();



doc.fontSize(14)

.text(
`Invoice Order: ${orderId}`
);



doc.moveDown();



const result =
await executeQuery(

`

SELECT

ORDER_ID,

TOTAL_AMOUNT,

STATUS,

ORDER_DATE


FROM ORDERS


WHERE ORDER_ID=:orderId


`,

{
orderId
}

);



if(result.rows.length){


const order =
result.rows[0];


doc.text(
`Status: ${order.STATUS}`
);


doc.text(
`Total: ${order.TOTAL_AMOUNT} VNĐ`
);


doc.text(
`Date: ${order.ORDER_DATE}`
);


}



doc.end();



}
catch(error){


console.error(

"[INVOICE ERROR]",

error.message

);



res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================================
// TRACK ORDER
// GET /api/order/:orderId/tracking
// ======================================================


router.get("/:orderId/tracking", async(req,res)=>{


try{


const {

orderId

}=req.params;



const result =
await executeQuery(

`

SELECT

STATUS,

ORDER_DATE


FROM ORDERS


WHERE ORDER_ID=:orderId


`,

{
orderId
}

);



if(
result.rows.length===0
){

return res.status(404).json({

success:false,

message:"Không tìm thấy đơn hàng"

});

}




res.json({

success:true,

data:
result.rows[0]

});



}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}


});







// ======================================================
// EXPORT ROUTER
// ======================================================


module.exports = router;