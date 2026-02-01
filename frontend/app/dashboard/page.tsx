"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Phone,
  Clock,
  Ban,
  RefreshCw,
  FileText,
} from "lucide-react";

interface CallEvent {
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

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "SCAM") {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        SCAM
      </Badge>
    );
  }
  if (verdict === "SAFE") {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700">
        <ShieldCheck className="h-3 w-3" />
        VERIFIED
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <HelpCircle className="h-3 w-3" />
      UNCERTAIN
    </Badge>
  );
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CallEvent | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/call-status?limit=50");
      const data = await res.json();
      if (data.ok) {
        setEvents(data.events || []);
        setBlocklist(data.blocklist || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll every 5 seconds
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBlock = async (number: string) => {
    try {
      await fetch("/api/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      setBlocklist((prev) => [...prev, number]);
    } catch (err) {
      console.error("Failed to block:", err);
    }
  };

  const handleUnblock = async (number: string) => {
    try {
      await fetch("/api/blocklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      setBlocklist((prev) => prev.filter((n) => n !== number));
    } catch (err) {
      console.error("Failed to unblock:", err);
    }
  };

  const stats = {
    total: events.length,
    scams: events.filter((e) => e.verdict === "SCAM").length,
    safe: events.filter((e) => e.verdict === "SAFE").length,
    blocked: blocklist.length,
  };

  return (
    <div className="min-h-screen bg-[#000]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.total}</p>
                  <p className="text-xs text-white/50">Total Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.scams}</p>
                  <p className="text-xs text-white/50">Scams Detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.safe}</p>
                  <p className="text-xs text-white/50">Verified Safe</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">{stats.blocked}</p>
                  <p className="text-xs text-white/50">Numbers Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-white/50">Loading...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No calls yet</p>
                <p className="text-sm mt-1">Calls will appear here as they come in</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.callId}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center gap-4">
                        <VerdictBadge verdict={event.verdict} />
                        <div>
                          <p className="text-white font-medium">{event.caller}</p>
                          <p className="text-white/40 text-sm">
                            {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {blocklist.includes(event.caller) ? (
                          <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                            Blocked
                          </Badge>
                        ) : event.verdict === "SCAM" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlock(event.caller);
                            }}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Block
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" className="text-white/60">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Call Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <VerdictBadge verdict={selectedEvent?.verdict || "UNCERTAIN"} />
              <span>{selectedEvent?.caller}</span>
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedEvent && formatDate(selectedEvent.timestamp)} at{" "}
              {selectedEvent && formatTime(selectedEvent.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6 mt-4">
              {/* Analysis */}
              {selectedEvent.analysis?.reasons && selectedEvent.analysis.reasons.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-2">Analysis</h4>
                  <ul className="space-y-1">
                    {selectedEvent.analysis.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-white/60 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {selectedEvent.analysis.confidence !== undefined && (
                    <p className="text-sm text-white/40 mt-2">
                      Confidence: {Math.round(selectedEvent.analysis.confidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              <Separator className="bg-white/10" />

              {/* Transcript */}
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-2">Transcript</h4>
                <ScrollArea className="h-[200px] rounded-lg bg-white/5 p-4">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">
                    {selectedEvent.transcript || "No transcript available"}
                  </p>
                </ScrollArea>
              </div>

              <Separator className="bg-white/10" />

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {blocklist.includes(selectedEvent.caller) ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(selectedEvent.caller)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Unblock Number
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => handleBlock(selectedEvent.caller)}>
                    <Ban className="h-4 w-4 mr-2" />
                    Block This Number
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
