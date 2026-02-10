/**
 * Tool definitions exposed to the AI model
 * These define WHAT the AI can request,
 * not HOW the backend executes them.
 */

export const aiTools = [
    {
      name: "get_balance",
      description:
        "Get the current SOL and SPL token balances for the user's connected wallet",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  
    {
      name: "create_transfer",
      description:
        "Create a pending SOL transfer transaction that requires user approval in their wallet",
      input_schema: {
        type: "object",
        properties: {
          recipient: {
            type: "string",
            description: "Recipient Solana wallet address",
          },
          amount: {
            type: "number",
            description: "Amount of SOL to send (not in lamports)",
          },
          memo: {
            type: "string",
            description: "Optional transaction note",
          },
        },
        required: ["recipient", "amount"],
      },
    },
  
    {
      name: "get_transaction_history",
      description:
        "Get recent transaction history for the user's wallet",
      input_schema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of transactions to return (default 10, max 50)",
          },
        },
        required: [],
      },
    },
  
    {
      name: "estimate_fee",
      description:
        "Estimate the network fee for a SOL transfer",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ] as const;
  