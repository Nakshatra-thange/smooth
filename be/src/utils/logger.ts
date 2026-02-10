const isProd = process.env.NODE_ENV === "production";

const format = (
  level: string,
  message: string,
  metadata?: unknown
) => {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ? { metadata } : {}),
  };

  if (isProd) {
    return JSON.stringify(log);
  }

  return `[${log.timestamp}] ${level.toUpperCase()}: ${message}${
    metadata ? `\n${JSON.stringify(metadata, null, 2)}` : ""
  }`;
};

export const logger = {
  info(message: string, metadata?: unknown) {
    console.log(format("info", message, metadata));
  },

  warn(message: string, metadata?: unknown) {
    console.warn(format("warn", message, metadata));
  },

  error(message: string, error?: unknown, metadata?: unknown) {
    console.error(
      format("error", message, {
        error,
        ...((metadata as object) ?? {}),
      })
    );
  },

  debug(message: string, metadata?: unknown) {
    if (!isProd) {
      console.debug(format("debug", message, metadata));
    }
  },
};
