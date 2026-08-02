  "use client";

  import { useEffect, useRef, useState } from "react";

  import ChatHeader from "./ChatHeader";
  import ChatMessages from "./ChatMessages";
  import ChatInput from "./ChatInput";

  import { authAPI, chatAPI } from "@/lib/api";
  import { socket } from "@/lib/socket";


  interface ChatMessage {
    MESSAGE_ID?: number;
    ROOM_ID: string;
    SENDER_ID: number;
    RECEIVER_ID: number;
    MESSAGE: string;
    CREATED_AT?: string;
  }


  export default function ChatWindow() {

    const [user,setUser] = useState<any>(null);

    const [messages,setMessages] = useState<ChatMessage[]>([]);

    const [loading,setLoading] = useState(true);

    const bottomRef = useRef<HTMLDivElement>(null);



    // ======================
    // GET USER
    // ======================

    useEffect(()=>{

      setUser(authAPI.getCurrentUser());

    },[]);



    const room = user 
      ? `USER_${user.userId}`
      : "";



    // ======================
    // LOAD MESSAGE
    // ======================

    useEffect(()=>{

      if(!user) return;


      async function load(){

        try{

          const data =
            await chatAPI.getMessages(room);


          setMessages(
            Array.isArray(data)
            ? data
            : data.rows || []
          );


        }
        catch(err){

          console.log(err);

        }
        finally{

          setLoading(false);

        }

      }


      load();


    },[user,room]);





    // ======================
    // SOCKET
    // ======================

    useEffect(()=>{

      if(!user) return;


      socket.connect();


      socket.emit(
        "join",
        room
      );


      const handler =
        (msg:ChatMessage)=>{

          setMessages(prev=>[
            ...prev,
            msg
          ]);

        };


      socket.on(
        "newMessage",
        handler
      );



      return ()=>{

        socket.off(
          "newMessage",
          handler
        );

      };


    },[user,room]);





    // ======================
    // SCROLL
    // ======================

    useEffect(()=>{

      bottomRef.current?.scrollIntoView({
        behavior:"smooth"
      });


    },[messages]);





    async function sendMessage(
      text:string
    ){

      if(!user || !text.trim())
        return;


      await chatAPI.sendMessage({

        room,

        sender:user.userId,

        receiver:1,

        message:text

      });

    }





    if(!user){

      return null;

    }





    return (

      <div
        className="
        w-[360px]
        sm:w-[400px]

        h-[600px]

        max-h-[80vh]

        bg-white

        rounded-3xl

        shadow-2xl

        overflow-hidden

        flex

        flex-col

        border

        "
      >



        {/* HEADER */}

        <div className="shrink-0">

          <ChatHeader/>

        </div>





        {/* MESSAGE */}

        <div
          className="
          flex-1

          min-h-0

          overflow-y-auto

          bg-gray-50

          "
        >

          {
            loading ?

            <div
              className="
              h-full
              flex
              items-center
              justify-center
              text-gray-400
              "
            >

              Đang tải...

            </div>

            :

            <ChatMessages

              messages={messages}

              userId={user.userId}

            />

          }


          <div ref={bottomRef}/>


        </div>






        {/* INPUT FIXED */}

        <div
          className="
          shrink-0

          bg-white

          border-t

          "
        >

          <ChatInput

            onSend={sendMessage}

          />


        </div>



      </div>

    );

  }