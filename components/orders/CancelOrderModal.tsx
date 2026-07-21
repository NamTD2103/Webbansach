"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";


interface Order {

  ORDER_ID:number;

}


interface Props {

  order:Order;

  onClose:()=>void;

  onConfirm:(reason:string)=>void;

}



export default function CancelOrderModal({

  order,

  onClose,

  onConfirm

}:Props){


  const [reason,setReason] = useState("");



  function submit(){

    if(!reason.trim()){

      alert("Vui lòng nhập lý do hủy đơn");

      return;

    }


    onConfirm(reason);

  }



return (

<div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-50
">


<div className="
bg-white
rounded-xl
w-full
max-w-md
p-6
shadow-xl
">


<div className="
flex
justify-between
items-center
mb-5
">


<h2 className="
text-xl
font-bold
">

Hủy đơn hàng #{order.ORDER_ID}

</h2>


<button
onClick={onClose}
>

<XCircle/>

</button>


</div>



<p className="
text-gray-600
mb-3
">

Bạn có chắc muốn hủy đơn hàng này?

</p>



<textarea

value={reason}

onChange={(e)=>setReason(e.target.value)}

placeholder="
Nhập lý do hủy đơn...
"

className="
w-full
border
rounded-lg
p-3
h-28
outline-none
"

/>



<div className="
flex
justify-end
gap-3
mt-6
">


<button

onClick={onClose}

className="
px-4
py-2
rounded-lg
border
"

>

Đóng

</button>



<button

onClick={submit}

className="
px-4
py-2
rounded-lg
bg-red-600
text-white
"

>

Xác nhận hủy

</button>



</div>



</div>


</div>

);


}