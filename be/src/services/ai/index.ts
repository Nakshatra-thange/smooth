import { aiTools } from "./tools";
import { generateSystemPrompt } from "./prompts";
import {
  executeGetBalance,
  executeCreateTransfer,
  executeGetTransactionHistory,
  executeEstimateFee,
} from "./executors";
import { prisma } from "../../config/database";
import { aiClient } from "./openrouter";

export async function processChat(
  userId: string,
  conversationId: string | null,
  message: string
) {
  let conversation;

  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new Error("Conversation not found");
  } else {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        title: message.slice(0, 50),
        isActive: true,
      },
    });
  }

  const convId = conversation.id;

  await prisma.message.create({
    data: {
      conversationId: convId,
      role: "user",
      content: message,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.walletAddress) throw new Error("Wallet not connected");

    const walletAddress = user.walletAddress;
    const systemPrompt = generateSystemPrompt(walletAddress);

    const completion = await aiClient.chat.completions.create({
      model: "openai/gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      tools: aiTools,
      tool_choice: "auto",
      max_tokens: 512,
    });

    const aiMessage = completion.choices?.[0]?.message;
    console.log("🔍 AI MESSAGE:", JSON.stringify(aiMessage, null, 2));
    
    if (!aiMessage) {
      return { 
        message: "No response.", 
        conversationId: convId,
        transactionId: undefined,
        requiresApproval: false,
        unsignedTx: undefined
      };
    }

    // NO TOOL CASE
    if (!aiMessage.tool_calls?.length) {
      const finalReply = aiMessage.content ?? "No reply.";

      await prisma.message.create({
        data: {
          conversationId: convId,
          role: "assistant",
          content: finalReply,
        },
      });

      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      return {
        message: finalReply,
        conversationId: convId,
        transactionId: undefined,
        requiresApproval: false,
        unsignedTx: undefined,
      };
    }

    console.log("🛠️ TOOL CALLS DETECTED:", aiMessage.tool_calls.length);

    const toolCall = aiMessage.tool_calls[0] as any;
    const toolName = toolCall?.function?.name;
    console.log("🔧 TOOL NAME EXACTLY:", toolName);
    console.log("🔧 TOOL NAME LENGTH:", toolName?.length);

    let toolResult: any = null;

    // Execute the appropriate tool
    if (toolName === "get_balance") {
      toolResult = await executeGetBalance(walletAddress);
    }
    
    if (toolName === "create_transfer") {
      const args = JSON.parse(toolCall.function.arguments);
      console.log("📦 CREATE TRANSFER ARGS:", args);
      
      toolResult = await executeCreateTransfer(
        userId,
        walletAddress,
        args.recipient,
        args.amount,
        args.memo
      );
    }
    
    if (toolName === "get_transaction_history") {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      toolResult = await executeGetTransactionHistory();
    }
    
    if (toolName === "estimate_fee") {
      toolResult = await executeEstimateFee();
    }

    // Second AI call with tool results
    const secondCompletion = await aiClient.chat.completions.create({
      model: "openai/gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
        aiMessage,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        },
      ],
      tools: aiTools,
      max_tokens: 512,
    });

    const finalReply =
      secondCompletion.choices?.[0]?.message?.content ?? "No response.";

    // Save assistant message with metadata
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: finalReply,
        metadata: {
          toolCalls: [toolName],
          toolResult: toolResult?.success === false ? toolResult.error : undefined,
        },
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Return with transaction data if this was a transfer
    return {
      message: finalReply,
      conversationId: convId,
      transactionId:
        toolName === "create_transfer" && toolResult?.success
          ? toolResult.transactionId
          : undefined,
      requiresApproval: toolName === "create_transfer" && toolResult?.success,
      unsignedTx:
        toolName === "create_transfer" && toolResult?.success
          ? toolResult.unsignedTx
          : undefined,
    };
    
  } catch (err) {
    console.error("CHAT ERROR:", err);
    
    // Save error message to conversation
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
        metadata: {
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
    }).catch(console.error);
    
    throw err;
  }
}