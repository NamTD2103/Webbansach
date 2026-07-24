"use client";

interface Props {
  reviews:any[];
  onDelete:(id:number)=>void;
}


export default function ReviewTable({
  reviews,
  onDelete
}:Props){

return (

<div className="bg-white rounded-xl shadow overflow-hidden">

<table className="min-w-full">

<thead className="bg-gray-100">

<tr>

<th className="px-6 py-3 text-left">
Người dùng
</th>

<th className="px-6 py-3 text-left">
Sản phẩm
</th>

<th className="px-6 py-3">
Đánh giá
</th>

<th className="px-6 py-3 text-left">
Nội dung
</th>

<th className="px-6 py-3">
Ngày
</th>

<th className="px-6 py-3">
Thao tác
</th>

</tr>

</thead>


<tbody>


{
reviews.length===0 ?

<tr>
<td
colSpan={6}
className="text-center py-8 text-gray-500"
>
Chưa có đánh giá
</td>
</tr>


:

reviews.map((item)=>(


<tr
key={item.REVIEW_ID}
className="border-b hover:bg-gray-50"
>


<td className="px-6 py-3">
{item.USERNAME}
</td>


<td className="px-6 py-3">
{item.TENSP}
</td>



<td className="px-6 py-3">

<span className="text-yellow-500 font-bold">

{"★".repeat(item.RATING)}

</span>

</td>



<td className="px-6 py-3">

{item.COMMENT_TEXT || "-"}

</td>



<td className="px-6 py-3">

{
item.CREATED_AT
?
new Date(item.CREATED_AT)
.toLocaleDateString("vi-VN")
:
"-"
}

</td>


<td className="px-6 py-3">

<button

onClick={()=>onDelete(item.REVIEW_ID)}

className="bg-red-500 text-white px-3 py-1 rounded"

>

Xóa

</button>

</td>


</tr>


))

}


</tbody>


</table>


</div>

);

}