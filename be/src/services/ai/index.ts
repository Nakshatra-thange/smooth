import { prisma } from "../../config/database";
import { aiChat } from "../../config/ai";
import { aiTools } from "./tools";
import { generateSystemPrompt } from "./prompts";
import {
  executeGetBalance,
  executeCreateTransfer,
  executeGetTransactionHistory,
  executeEstimateFee,
} from "./executors";
import { logger } from "../../utils/logger";



/**
 * =========================
 * Types
 * =========================
 */
const MAX_HISTORY_MESSAGES = 10;

type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: any;
};

type ProcessChatResult = {
  message: string;
  conversationId: string;
  transactionId?: string;
  requiresApproval: boolean;
};

/**
 * =========================
 * Main AI Chat Processor
 * =========================
 */
export const processChat = async (
  userId: string,
  conversationId: string | null,
  message: string
): Promise<ProcessChatResult> => {
  try {
    /**
     * =========================
     * Load user
     * =========================
     */
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    /**
     * =========================
     * Load or create conversation
     * =========================
     */
    const conversation = conversationId
      ? await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            userId,
            isActive: true,
          },
        })
      : await prisma.conversation.create({
          data: {
            userId,
            title: message.slice(0, 50),
          },
        });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    /**
     * =========================
     * Load conversation history
     * =========================
     */
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY_MESSAGES,
    });

    const orderedHistory = [...history].reverse();


    /**
     * =========================
     * Build system prompt
     * =========================
     */
    let balance:
      | { sol: number; tokens?: unknown[] }
      | { error: string }
      | undefined;

    try {
      balance = await executeGetBalance(userId, user.walletAddress);
    } catch {
      balance = undefined;
    }

    const systemPrompt = generateSystemPrompt(
      { walletAddress: user.walletAddress },
      balance && !("error" in balance) ? { sol: balance.sol } : undefined
    );

    /**
     * =========================
     * Build messages array
     * =========================
     */
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...orderedHistory.map((m) => ({
        role: m.role as "user"|"assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    /**
     * =========================
     * Call AI (tool loop)
     * =========================
     */
    let aiResponse = await aiChat({
      messages,
      tools: aiTools,
    });

    const toolCalls: any[] = [];
    let finalText = "";
    let transactionId: string | undefined;

    while (true) {
      const toolUseBlocks = aiResponse.content?.filter(
        (block): block is ToolUseBlock =>
          typeof block === "object" &&
          block !== null &&
          block.type === "tool_use"
      );

      // No more tools → final response
      if (!toolUseBlocks || toolUseBlocks.length === 0) {
        finalText =
          aiResponse.content
            ?.filter((b: any) => b.type === "text")
            ?.map((b: any) => b.text)
            ?.join("\n") ?? "";
        break;
      }

      for (const toolCall of toolUseBlocks) {
        const { name, input, id } = toolCall;

        logger.info("Executing tool", { name, input });

        let result: any;

        switch (name) {
          case "get_balance":
            result = await executeGetBalance(
              userId,
              user.walletAddress
            );
            break;

          case "create_transfer":
            result = await executeCreateTransfer(
              userId,
              user.walletAddress,
              input.recipient,
              input.amount,
              input.memo
            );
            if (result?.transactionId) {
              transactionId = result.transactionId;
            }
            break;

          case "get_transaction_history":
            result = await executeGetTransactionHistory(
              userId,
              user.walletAddress,
              input.limit
            );
            break;

          case "estimate_fee":
            result = await executeEstimateFee();
            break;

          default:
            result = { error: "Unknown tool" };
        }

        toolCalls.push({ name, input, result });

        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: id,
              content: JSON.stringify(result),
            },
          ],
        });
      }

      // Call AI again with tool results
      aiResponse = await aiChat({
        messages,
        tools: aiTools,
      });
    }

    /**
     * =========================
     * Save messages
     * =========================
     */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: finalText,
        metadata: { toolCalls },
      },
    });

    /**
     * =========================
     * Return response
     * =========================
     */
    return {
      message: finalText,
      conversationId: conversation.id,
      transactionId,
      requiresApproval: Boolean(transactionId),
    };
  } catch (error) {
    logger.error("processChat failed", error);
    return {
      message:
        "Sorry, something went wrong while processing your request. Please try again.",
      conversationId: conversationId ?? "",
      requiresApproval: false,
    };
  }
};
