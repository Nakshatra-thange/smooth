
import type { ChatCompletionTool } from "openai/resources/chat/completions";
export const aiTools :ChatCompletionTool[]= [
  {
    type: "function",
    function: {
      name: "get_balance",
      description:
        "Get the current SOL and SPL token balances for the user's connected wallet",
      parameters: {
        type: "object",
        properties: {},
        required:[],
      },
    },
  },
  {
    type: "function" ,
    function: {
      name: "create_transfer",
      description: "Create a pending SOL transfer transaction that requires user approval",
      parameters: {
        type: "object",
        properties: {
          recipient: { 
            type: "string",
            description: "The recipient's wallet address"
          },
          amount: { 
            type: "number",
            description: "Amount of SOL to transfer"
          },
          memo: { 
            type: "string",
            description: "Optional memo for the transaction"
          },
        },
        required: ["recipient", "amount"],
      },
    },
  },
  {
    type: "function" ,
    function: {
      name: "get_transaction_history",
      description: "Get recent transaction history for the user's wallet",
      parameters: {
        type: "object",
        properties: {
          limit: { 
            type: "number",
            description: "Number of transactions to return (default: 10)"
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_fee",
      description: "Estimate network fee for SOL transfer",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];