const requiredEnv = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "SOLANA_RPC_URL",
    "SOLANA_NETWORK",
    "JWT_SECRET",
    "JWT_EXPIRY",
    "ALLOWED_ORIGINS",
    "AI_PROVIDER",
  ];
  
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  export const config = {
    server: {
      port: Number(process.env.PORT) || 3001,
      env: process.env.NODE_ENV!,
    },
  
    database: {
      url: process.env.DATABASE_URL!,
    },
  
    solana: {
      rpcUrl: process.env.SOLANA_RPC_URL!,
      network: process.env.SOLANA_NETWORK!,
    },
  
    ai: {
      provider: process.env.AI_PROVIDER!,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MODEL,
    },
  
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiry: process.env.JWT_EXPIRY!,
    },
  
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS!.split(","),
    },
  
    rateLimit: {
      window: process.env.RATE_LIMIT_WINDOW,
      max: process.env.RATE_LIMIT_MAX
        ? Number(process.env.RATE_LIMIT_MAX)
        : undefined,
    },
  } as const;
  