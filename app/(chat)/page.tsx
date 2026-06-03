import ChatInterface from "@/components/chat/ChatInterface";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <main className="h-screen flex flex-col bg-white">
      <ChatInterface />
    </main>
  );
}
