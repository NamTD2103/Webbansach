"use client";


import {
  useEffect,
  useRef,
  useState
} from "react";


import {
  chatAPI
} from "@/lib/api";


import {
  socket
} from "@/lib/socket";



interface Message {

  MESSAGE_ID?:number;

  ROOM_ID:string;

  SENDER_ID:number;

  RECEIVER_ID:number;

  MESSAGE:string;

  CREATED_AT?:string;

}



interface Props{

  room:string;

}



export default function AdminMessages({

  room

}:Props){


  const [messages,setMessages] =
    useState<Message[]>([]);



  const bottomRef =
    useRef<HTMLDivElement>(null);



  // Load lịch sử

  useEffect(()=>{


    if(!room)
      return;



    async function load(){


      try{


        const data =
          await chatAPI.getMessages(room);



        if(Array.isArray(data)){

          setMessages(data);

        }
        else if(data.rows){

          setMessages(data.rows);

        }


      }
      catch(err){

        console.error(err);

      }


    }


    load();



  },[room]);






  // Socket realtime

  useEffect(()=>{


    if(!room)
      return;



    socket.connect();



    socket.emit(
      "join",
      room
    );



    socket.on(
      "newMessage",
      (msg:Message)=>{


        setMessages(
          prev=>[
            ...prev,
            msg
          ]
        );


      }
    );



    return ()=>{


      socket.off(
        "newMessage"
      );


    };



  },[room]);





  // Auto scroll

  useEffect(()=>{


    bottomRef.current
    ?.scrollIntoView({
      behavior:"smooth"
    });


  },[messages]);




  if(!room){

    return (

      <div
        className="
          flex-1
          flex
          items-center
          justify-center
          text-gray-400
        "
      >

        Chọn khách hàng

      </div>

    );

  }



  return (

    <div
      className="
        flex-1
        overflow-y-auto
        bg-gray-100
        p-5
      "
    >



      {
        messages.map(
          msg=>{


            const isAdmin =
              msg.SENDER_ID===1;



            return (

              <div

                key={
                  msg.MESSAGE_ID ??
                  Math.random()
                }


                className={`
                  flex
                  mb-3
                  ${
                    isAdmin
                    ?
                    "justify-end"
                    :
                    "justify-start"
                  }
                `}

              >


                <div

                  className={`
                    max-w-[70%]
                    px-4
                    py-3
                    rounded-2xl
                    shadow

                    ${
                      isAdmin
                      ?
                      "bg-blue-600 text-white"
                      :
                      "bg-white"
                    }

                  `}

                >


                  <p>
                    {msg.MESSAGE}
                  </p>



                  <span
                    className="
                      text-xs
                      opacity-70
                    "
                  >

                    {msg.CREATED_AT}

                  </span>


                </div>


              </div>

            );


          }
        )
      }



      <div ref={bottomRef}/>


    </div>

  );

}