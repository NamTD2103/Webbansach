"use client";


import Link from "next/link";
import { Package } from "lucide-react";



export default function EmptyOrders(){


return (

<div className="
min-h-screen
bg-gray-100
flex
items-center
justify-center
">


<div className="
bg-white
rounded-xl
shadow
p-10
text-center
max-w-md
">


<Package

size={80}

className="
mx-auto
text-gray-400
"

/>



<h2 className="
text-2xl
font-bold
mt-5
">

Chưa có đơn hàng

</h2>



<p className="
text-gray-500
mt-3
">

Bạn chưa thực hiện đơn mua nào.

</p>



<Link

href="/products"

className="
inline-block
mt-6
bg-blue-600
text-white
px-6
py-3
rounded-lg
"

>

Mua sắm ngay

</Link>



</div>


</div>


);


}