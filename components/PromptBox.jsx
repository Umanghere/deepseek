import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import Image from "next/image";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

const PromptBox = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState("");
  const { user, chats, setChats, selectedChat, setSelectedChat } =
    useAppContext();
  const textareaRef = useRef(null);


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };  

  const sendPrompt = async (e) => {
    const promptCopy = prompt;
    try {
      e.preventDefault();
      if (!user) return toast.error("Login to send message");
      if (isLoading) return toast.error("Wait for the previous prompt response");
      if (!prompt.trim()) return toast.error("Please enter a message");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // Immediately update UI with user message
      const updatedChats = chats.map((chat) =>
        chat._id === selectedChat._id
          ? {
              ...chat,
              messages: [...chat.messages, userPrompt],
            }
          : chat
      );
      setChats(updatedChats);

      // Update selected chat
      const updatedSelectedChat = {
        ...selectedChat,
        messages: [...selectedChat.messages, userPrompt],
      };
      setSelectedChat(updatedSelectedChat);

      // Send request to API
      const { data } = await axios.post("/api/chat/ai", {
        chatId: selectedChat._id,
        prompt: promptCopy,
      });

      if (data.success) {
        console.log("AI response:", data.data);
        
        // Create initial assistant message placeholder
        const assistantMessage = {
          role: "assistant",
          content: " ",
          timestamp: Date.now(),
        };

        // Add assistant message placeholder to UI
        setSelectedChat((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { 
                  ...chat, 
                  messages: [...chat.messages, assistantMessage]
                }
              : chat
          )
        );

        // Display message word by word
        const message = data.data.content;
        const messageTokens = message.split(" ");

        for (let i = 0; i < messageTokens.length; i++) {
          setTimeout(() => {
            const updatedContent = messageTokens.slice(0, i + 1).join(" ");
            
            // Update selected chat with new content
            setSelectedChat((prev) => {
              const updatedMessages = [...prev.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: updatedContent,
              };
              return { ...prev, messages: updatedMessages };
            });

            // Update chats array with new content
            setChats((prevChats) =>
              prevChats.map((chat) => {
                if (chat._id === selectedChat._id) {
                  const chatMessages = [...chat.messages];
                  chatMessages[chatMessages.length - 1] = {
                    ...chatMessages[chatMessages.length - 1],
                    content: updatedContent,
                  };
                  return { ...chat, messages: chatMessages };
                }
                return chat;
              })
            );
          }, i * 100);
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full ${
        selectedChat && selectedChat?.messages.length > 0 ? "max-w-3xl" : "max-w-2xl"
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Message DeepSeek"
        required
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white"
        onChange={(e) => {setPrompt(e.target.value), adjustHeight()}}
        value={prompt}
      />

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.deepthink_icon} alt="" />
            DeepThink (R1)
          </p>
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.search_icon} alt="" />
            Search
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="" />
          <button
            type="submit"
            className={`${
              prompt ? "bg-primary" : "bg-[#71717a]"
            } rounded-full p-2 cursor-pointer`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
              alt=""
            />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;