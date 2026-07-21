"use client";


export default function LoadingSkeleton(){


return (

<div className="
min-h-screen
bg-gray-100
py-10
">


<div className="
max-w-7xl
mx-auto
bg-white
rounded-xl
p-6
animate-pulse
">


<div className="
h-8
bg-gray-200
rounded
w-64
mb-6
">


</div>



{
[1,2,3].map((item)=>(


<div

key={item}

className="
border
rounded-xl
p-5
mb-5
"


>


<div className="
h-5
bg-gray-200
rounded
w-40
mb-4
">


</div>


<div className="
h-20
bg-gray-200
rounded
">


</div>


</div>


))

}



</div>


</div>


);


}