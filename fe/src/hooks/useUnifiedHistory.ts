import { useEffect, useState } from "react";
import { getConversations, getConversation } from "@/services/chatService";

export function useUnifiedHistory() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const conversations = await getConversations();

      const allMessages: any[] = [];

      for (const c of conversations) {
        const full = await getConversation(c.id);

        for (const m of full.messages || []) {
          allMessages.push({
            type: m.metadata?.toolCalls?.includes("create_transfer")
              ? "transaction"
              : "chat",
            ...m,
          });
        }
      }

      setItems(
        allMessages.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
    }

    load();
  }, []);

  return items;
}
