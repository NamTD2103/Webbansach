"use client";

import { useState } from "react";
import { reviewAPI } from "@/lib/api";


interface OrderItem {

    MASP:string;
    TENSP:string;

}


interface Order {

    ORDER_ID:number;

    USER_ID:number;

    items:OrderItem[];

}



interface Props {

    order:Order;

    onClose:()=>void;

    onSuccess:()=>void;

}



export default function ReviewModal({
    order,
    onClose,
    onSuccess
}:Props){


const [selectedProduct,setSelectedProduct]=useState<OrderItem | null>(null);

const [rating,setRating]=useState(5);

const [comment,setComment]=useState("");

const [loading,setLoading]=useState(false);



const submitReview=async()=>{


if(!selectedProduct){

alert("Vui lòng chọn sản phẩm");

return;

}



try{


setLoading(true);



await reviewAPI.createReview({

userId:order.USER_ID,

masp:selectedProduct.MASP,

rating,

comment

});



alert("Đánh giá thành công");


onSuccess();


}
catch(err:any){

alert(err.message || "Lỗi đánh giá");

}
finally{

setLoading(false);

}



};



return (

<div className="
fixed inset-0
bg-black/50
flex
items-center
justify-center
z-50
">


<div className="
bg-white
rounded-2xl
p-6
w-[450px]
">


<h2 className="
text-xl
font-bold
mb-4
">

⭐ Đánh giá đơn #{order.ORDER_ID}

</h2>



<p className="font-semibold mb-2">

Chọn sản phẩm:

</p>



<div className="space-y-2 mb-4">


{
order.items?.map(item=>(

<button

key={item.MASP}

onClick={()=>setSelectedProduct(item)}

className={`
w-full
text-left
border
p-3
rounded-lg

${
selectedProduct?.MASP===item.MASP
?
"bg-blue-100 border-blue-500"
:
""
}

`}

>

{item.TENSP}

</button>


))

}


</div>





<div className="
flex
gap-2
text-3xl
mb-4
">


{
[1,2,3,4,5].map(star=>(

<button

key={star}

onClick={()=>setRating(star)}

className={
star<=rating
?
"text-yellow-400"
:
"text-gray-300"
}

>

★

</button>


))

}


</div>





<textarea

className="
border
w-full
rounded-lg
p-3
h-28
"

placeholder="
Nhập nhận xét...
"

value={comment}

onChange={
e=>setComment(e.target.value)
}

/>





<div className="
flex
justify-end
gap-3
mt-5
">


<button

onClick={onClose}

className="
border
px-4
py-2
rounded-lg
"

>

Hủy

</button>




<button

disabled={loading}

onClick={submitReview}

className="
bg-yellow-500
text-white
px-4
py-2
rounded-lg
"

>

{
loading
?
"Đang gửi..."
:
"Gửi đánh giá"
}

</button>



</div>



</div>


</div>


);


}