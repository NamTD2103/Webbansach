// "use client";

// import {useEffect,useState} from "react";
// import {reviewAPI} from "@/lib/api";


// export default function ReviewList({
// masp
// }:{
// masp:string
// }){


// const [reviews,setReviews]=
// useState<any[]>([]);



// useEffect(()=>{


// loadReview();


// },[]);



// const loadReview=async()=>{

// try{

// const res =
// await reviewAPI.getByProduct(masp);


// setReviews(
// res.data.data || []
// );


// }
// catch(err){

// console.log(err);

// }


// };



// return (

// <div className="
// space-y-5
// ">


// {
// reviews.length===0 ?

// (

// <div className="
// text-gray-500
// ">

// Chưa có đánh giá

// </div>

// )

// :

// reviews.map((item)=>(


// <div

// key={item.REVIEW_ID}

// className="
// bg-gray-50
// rounded-2xl
// p-5
// "

// >


// <h3 className="
// font-bold
// ">

// {item.USERNAME}

// </h3>



// <div className="
// text-yellow-500
// ">

// {"⭐".repeat(item.RATING)}

// </div>



// <p className="
// text-gray-600
// mt-2
// ">

// {item.COMMENT_TEXT}

// </p>


// </div>


// ))


// }


// </div>

// );


// }