"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrderSuccessPage() {

  const [order, setOrder] = useState<any>(null);


  useEffect(() => {

    const data = localStorage.getItem("lastOrder");

    if(data){
      setOrder(JSON.parse(data));
    }

  }, []);



  if(!order){

    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải đơn hàng...
      </div>
    );

  }



  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">


        <div className="text-center">

          <div className="
          text-5xl
          text-green-500
          ">
            ✓
          </div>


          <h1 className="
          text-3xl
          font-bold
          text-green-600
          mt-3
          ">
            Đặt hàng thành công!
          </h1>


          <p className="mt-3">
            Mã đơn hàng:
            <b className="ml-2 text-red-500">
              #{order.orderId}
            </b>
          </p>

        </div>



        <hr className="my-6"/>



        <h2 className="font-bold text-xl mb-4">
          🛒 Sản phẩm
        </h2>



        <div className="space-y-3">


        {order.items.map((item:any,index:number)=>(

          <div
          key={index}
          className="
          flex
          justify-between
          border
          rounded-lg
          p-3
          "
          >

            <div>

              <p className="font-semibold">
                {item.TENSP}
              </p>


              <p className="text-gray-500">
                Số lượng: {item.SOLUONG}
              </p>

            </div>


            <div className="font-bold">

              {(item.GIABAN * item.SOLUONG)
              .toLocaleString("vi-VN")}₫

            </div>


          </div>

        ))}


        </div>



        <div className="mt-6 text-right">

          <p>
            Tổng tiền:
          </p>

          <p className="
          text-2xl
          font-bold
          text-red-600
          ">
            {order.total.toLocaleString("vi-VN")}₫
          </p>


        </div>



        <Link
        href="/"
        className="
        block
        text-center
        mt-6
        bg-red-500
        text-white
        py-3
        rounded-lg
        "
        >

          Tiếp tục mua hàng

        </Link>


      </div>

    </div>

  );
}