"use client";


import {
  useState
} from "react";

import {
  chatAPI
} from "@/lib/api";



interface Props {

  room:string;

  adminId:number;

}



export default function AdminInput({

  room,

  adminId

}:Props){


  const [message,setMessage] =
    useState("");

  const [loading,setLoading] =
    useState(false);



  async function sendMessage(){


    if(!message.trim())
      return;



    try{


      setLoading(true);



      const userId =
        Number(
          room.replace(
            "USER_",
            ""
          )
        );



      await chatAPI.sendMessage({

        room,

        sender:adminId,

        receiver:userId,

        message

      });



      setMessage("");



    }
    catch(error){

      console.error(
        "Send message error:",
        error
      );

    }
    finally{

      setLoading(false);

    }

  }




  return (

    <div
      className="
        border-t
        bg-white
        p-4
      "
    >


      <div
        className="
          flex
          gap-3
        "
      >


        <input

          value={message}

          onChange={
            e=>setMessage(
              e.target.value
            )
          }


          onKeyDown={
            e=>{

              if(
                e.key==="Enter"
              ){

                sendMessage();

              }

            }
          }


          disabled={!room}


          placeholder={
            room
            ?
            "Nhập tin nhắn..."
            :
            "Chọn khách hàng"
          }


          className="
            flex-1
            border
            rounded-xl
            px-4
            py-3
            outline-none
            focus:ring-2
            focus:ring-blue-500
          "

        />



        <button

          onClick={sendMessage}

          disabled={
            loading ||
            !room
          }


          className="
            bg-blue-600
            text-white
            px-6
            rounded-xl
            hover:bg-blue-700
            disabled:opacity-50
          "

        >

          {loading
            ?
            "..."
            :
            "Gửi"
          }

        </button>


      </div>


    </div>

  );

}