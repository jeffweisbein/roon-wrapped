export class RoonError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'RoonError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If it's a non-recoverable error, throw immediately
      if (error instanceof RoonError && !error.recoverable) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
}

export class EventEmitter {
  private handlers = new Map<string, Set<Function>>();

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data: any) {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  clear() {
    this.handlers.clear();
  }
}

// Image cache implementation
export class ImageCache {
  private cache = new Map<string, {
    data: Buffer;
    contentType: string;
    timestamp: number;
  }>();
  
  private readonly maxAge = 3600000; // 1 hour in milliseconds
  private readonly maxSize = 100; // Maximum number of cached images

  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache entry
    }
    return null;
  }

  set(key: string, data: Buffer, contentType: string) {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < entries.length / 2; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, {
      data,
      contentType,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
} 