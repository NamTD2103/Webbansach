"use client";

import {
  useState
} from "react";


interface Props {

  onSend: (
    message:string
  ) => void;

}



export default function ChatInput({

  onSend

}:Props){


  const [
    message,
    setMessage
  ] = useState("");



  const [
    sending,
    setSending
  ] = useState(false);





  async function handleSend(){


    const text =
      message.trim();



    if(!text)
      return;



    try{


      setSending(true);



      await onSend(text);



      setMessage("");



    }
    finally{


      setSending(false);


    }

  }





  return (

    <div
      className="
      w-full
      p-3

      bg-white

      border-t

      flex

      items-center

      gap-2
      "
    >



      <input


        value={message}


        onChange={(e)=>
          setMessage(e.target.value)
        }


        onKeyDown={(e)=>{


          if(
            e.key==="Enter"
            &&
            !e.shiftKey
          ){

            e.preventDefault();

            handleSend();

          }


        }}



        placeholder="Nhập tin nhắn..."


        className="
        min-w-0

        flex-1

        h-11

        rounded-full

        border

        px-4

        text-sm

        outline-none

        focus:ring-2

        focus:ring-blue-500
        "

      />





      <button


        onClick={handleSend}


        disabled={sending}


        className="
        shrink-0

        h-11

        px-5

        rounded-full

        bg-blue-600

        text-white

        text-sm

        font-medium

        hover:bg-blue-700

        disabled:opacity-50

        transition
        "

      >

        {
          sending
          ?
          "..."
          :
          "Gửi"
        }


      </button>



    </div>

  );

}