"use client";

import {useState} from "react";


interface Props{

questions:any[];

onAnswer:(id:number,text:string)=>void;

}


export default function QuestionTable({
questions,
onAnswer
}:Props){


const [answers,setAnswers]=useState<any>({});


return (

<div className="bg-white rounded-xl shadow overflow-hidden">


<table className="min-w-full">


<thead className="bg-gray-100">

<tr>

<th className="px-6 py-3">
Khách hàng
</th>

<th className="px-6 py-3">
Sản phẩm
</th>


<th className="px-6 py-3">
Câu hỏi
</th>


<th className="px-6 py-3">
Trả lời
</th>


<th className="px-6 py-3">
Thao tác
</th>


</tr>


</thead>



<tbody>


{
questions.length===0 ?

<tr>

<td
colSpan={5}
className="text-center py-8"
>

Chưa có câu hỏi

</td>

</tr>


:


questions.map(q=>(


<tr
key={q.QUESTION_ID}
className="border-b"
>


<td className="px-6 py-3">

{q.USERNAME}

</td>


<td className="px-6 py-3">

{q.TENSP || "-"}

</td>


<td className="px-6 py-3">

{q.QUESTION_TEXT}

</td>



<td className="px-6 py-3">


<input

className="border rounded px-2 py-1"

placeholder="Nhập trả lời"

value={
answers[q.QUESTION_ID] || q.ANSWER_TEXT || ""
}


onChange={(e)=>

setAnswers({

...answers,

[q.QUESTION_ID]:
e.target.value

})

}


/>


</td>


<td className="px-6 py-3">


<button

onClick={()=>


onAnswer(
q.QUESTION_ID,
answers[q.QUESTION_ID]
)


}


className="bg-blue-600 text-white px-3 py-1 rounded"

>


Lưu


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