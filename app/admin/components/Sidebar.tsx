"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  TicketPercent,
  House,
  Star,
  MessageCircle,
  MessagesSquare,
} from "lucide-react";


type Tab =
  | "dashboard"
  | "products"
  | "accounts"
  | "orders"
  | "vouchers"
  | "reviews"
  | "questions";


type MenuItem = {
  key: string;
  title: string;
  icon: any;
};


interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}



const menus: MenuItem[] = [

  {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    key: "products",
    title: "Sản phẩm",
    icon: Package,
  },

  {
    key: "accounts",
    title: "Khách hàng",
    icon: Users,
  },

  {
    key: "orders",
    title: "Đơn hàng",
    icon: ShoppingCart,
  },

  {
    key: "vouchers",
    title: "Mã khuyến mãi",
    icon: TicketPercent,
  },

  {
    key: "reviews",
    title: "Đánh giá sản phẩm",
    icon: Star,
  },

  {
    key: "questions",
    title: "Hỏi đáp khách hàng",
    icon: MessageCircle,
  },

  {
    key: "chat",
    title: "Chat khách hàng",
    icon: MessagesSquare,
  },

];




export default function Sidebar({
  activeTab,
  onChange,
}: Props) {


return (

<aside
className="
fixed
left-0
top-0
h-screen
w-72
bg-white
border-r
border-slate-200
shadow-xl
flex
flex-col
"
>



{/* LOGO */}

<div
className="
p-8
border-b
shrink-0
"
>

<h1
className="
text-3xl
font-black
bg-gradient-to-r
from-blue-600
to-purple-600
bg-clip-text
text-transparent
"
>
📚 CloudyBook
</h1>


<p className="text-sm text-slate-500 mt-2">
Admin Dashboard
</p>


</div>





{/* MENU */}

<div
className="
flex-1
overflow-y-auto
p-4
space-y-2
"
>


{
menus.map((menu)=>{


const Icon = menu.icon;



return (

<button

key={menu.key}

onClick={()=>{


if(menu.key==="chat"){

window.location.href="/admin/chat";

return;

}


onChange(menu.key as Tab);


}}


className={`

w-full

flex

items-center

gap-4

rounded-2xl

px-5

py-4

transition-all


${
activeTab === menu.key

?

"bg-blue-600 text-white shadow-lg"

:

"hover:bg-slate-100 text-slate-700"

}

`}

>


<Icon size={22}/>


<span className="font-medium">
{menu.title}
</span>


</button>


);


})

}



</div>







{/* FOOTER */}

<div

className="
shrink-0
p-4
border-t
border-slate-200
space-y-2
bg-white
"

>


<Link

href="/"

className="
w-full
flex
items-center
gap-4
rounded-2xl
px-5
py-4
hover:bg-green-100
text-green-700
transition
"

>

<House size={22}/>


<span className="font-medium">
Quay lại trang chủ
</span>


</Link>





<button

className="
w-full
flex
items-center
gap-4
rounded-2xl
px-5
py-4
hover:bg-slate-100
transition
"

>

<Settings size={22}/>


<span className="font-medium">
Cài đặt
</span>


</button>



</div>




</aside>


);

}