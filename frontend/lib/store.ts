// Shared in-memory store for MVP demo
// In production, this would be replaced with database calls

export interface CallEvent {
  callId: string;
  caller: string;
  verdict: "SCAM" | "SAFE" | "UNCERTAIN";
  status: string;
  transcript: string;
  analysis: {
    label?: string;
    confidence?: number;
    reasons?: string[];
  };
  timestamp: string;
  blocked?: boolean;
}

class Store {
  private static instance: Store;
  private callEvents: CallEvent[] = [];
  private blocklist: Set<string> = new Set();
  private readonly MAX_EVENTS = 100;

  private constructor() {
    // Seed with demo data
    this.callEvents.push({
      callId: "demo-1",
      caller: "+15551234567",
      verdict: "SCAM",
      status: "completed",
      transcript: "Hello, I am calling from the IRS. You owe back taxes and will be arrested if you do not pay immediately with gift cards.",
      analysis: {
        label: "SCAM",
        confidence: 0.95,
        reasons: ["Claimed to be IRS", "Demanded immediate payment", "Asked for gift cards"],
      },
      timestamp: new Date().toISOString(),
      blocked: false,
    });
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  // Call Events
  addEvent(event: Omit<CallEvent, "blocked">): CallEvent {
    const fullEvent: CallEvent = {
      ...event,
      blocked: this.blocklist.has(event.caller),
    };
    this.callEvents.unshift(fullEvent);
    if (this.callEvents.length > this.MAX_EVENTS) {
      this.callEvents.pop();
    }
    return fullEvent;
  }

  getEvents(limit: number = 50): CallEvent[] {
    return this.callEvents.slice(0, limit).map((e) => ({
      ...e,
      blocked: this.blocklist.has(e.caller),
    }));
  }

  // Blocklist
  blockNumber(number: string): void {
    this.blocklist.add(number);
  }

  unblockNumber(number: string): void {
    this.blocklist.delete(number);
  }

  isBlocked(number: string): boolean {
    return this.blocklist.has(number);
  }

  getBlocklist(): string[] {
    return Array.from(this.blocklist);
  }
}

export const store = Store.getInstance();
