"use client";

import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  XCircle,
} from "lucide-react";


interface Props {

  status:string;

}



export default function OrderTimeline({
  status
}:Props){


const steps = [

{
key:"PENDING",
label:"Chờ xác nhận",
icon:<Clock size={22}/>
},

{
key:"PROCESSING",
label:"Đang xử lý",
icon:<Package size={22}/>
},

{
key:"SHIPPING",
label:"Đang giao",
icon:<Truck size={22}/>
},

{
key:"DELIVERED",
label:"Đã giao",
icon:<CheckCircle size={22}/>
},

];



const currentIndex =
steps.findIndex(
(step)=>step.key===status
);



return (

<div className="
space-y-5
">


{
steps.map((step,index)=>(


<div

key={step.key}

className="
flex
items-center
gap-4
"

>


<div
className={`
w-10
h-10
rounded-full
flex
items-center
justify-center

${
index<=currentIndex
?
"bg-green-500 text-white"
:
"bg-gray-200 text-gray-500"
}

`}
>

{step.icon}

</div>



<div>


<p className={`
font-semibold

${
index<=currentIndex
?
"text-green-600"
:
"text-gray-400"
}

`}>

{step.label}

</p>


</div>


</div>


))
}



{
status==="CANCELLED" && (

<div className="
flex
items-center
gap-4
">


<div className="
w-10
h-10
rounded-full
bg-red-500
text-white
flex
items-center
justify-center
">

<XCircle size={22}/>

</div>


<p className="
font-semibold
text-red-600
">

Đơn hàng đã hủy

</p>


</div>

)

}


</div>

);


}