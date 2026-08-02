"use client";

import { useState } from "react";
import ChatWindow from "./ChatWindow";


export default function ChatButton(){

const [open,setOpen]=useState(false);


return (

<>


{
open && (

<div
className="
fixed

bottom-24

right-5

z-50

animate-in

fade-in

slide-in-from-bottom-5
"
>

<ChatWindow/>

</div>

)

}




<button

onClick={()=>setOpen(!open)}

className="
fixed

bottom-6

right-6

w-16

h-16

rounded-full

bg-gradient-to-r

from-blue-500

to-indigo-600

text-white

text-3xl

shadow-2xl

hover:scale-110

transition

z-50

flex

items-center

justify-center
"

>

{
open
?
"✕"
:
"💬"
}


</button>



</>

);

}