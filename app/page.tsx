"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Share2,
  Calendar,
  ListTodo,
  FileText,
  Clock,
  Brain,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeMeetingText } from "@/lib/mistral";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<{
    date?: string;
    time?: string;
    participants?: string[];
    summary?: string;
  }>({});

  const recognitionRef = useRef<any | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        interface SpeechRecognitionEvent {
          results: {
            length: number;
            [index: number]: {
              [index: number]: {
                transcript: string;
              };
            };
          };
        }

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            finalTranscript += event.results[i][0].transcript;
          }
          setTranscript(finalTranscript);

          // Debounce the analysis to avoid too many API calls
          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
          }
          analysisTimeoutRef.current = setTimeout(
            () => analyzeTranscript(finalTranscript),
            2000
          );
        };
      }
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const analyzeTranscript = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    const analysis = await analyzeMeetingText(text);

    if (analysis) {
      setActionItems(analysis.actionItems || []);
      setKeyPoints(analysis.keyPoints || []);
      setMeetingDetails((prev) => ({
        ...prev,
        date: analysis.dates?.[0],
        time: analysis.times?.[0],
        summary: analysis.summary,
      }));

      if (analysis.summary?.includes("Please configure your Mistral API key")) {
        setError(
          "Please configure your Mistral API key in the .env file to enable AI analysis."
        );
      }
    }

    setIsAnalyzing(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Smart Voice Assistant
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your intelligent meeting companion powered by AI
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-6 p-6 border-2 border-blue-100 dark:border-blue-900">
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={toggleRecording}
                className="flex items-center gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    Start Recording
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Recording in progress...
                  </span>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Analyzing with AI...
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Tabs defaultValue="transcript" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 gap-2">
              <TabsTrigger
                value="transcript"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript">
              <Card className="border-2 border-gray-100 dark:border-gray-800">
                <ScrollArea className="h-[400px] p-6">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {transcript ||
                      "No transcript available yet. Start recording to see the conversation."}
                  </p>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="actions">
              <Card className="border-2 border-gray-100 dark:border-gray-800">
                <ScrollArea className="h-[400px] p-6">
                  <div className="space-y-4">
                    {actionItems.length > 0 ? (
                      actionItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <ListTodo className="w-5 h-5 text-blue-500 mt-1" />
                          <p className="flex-1 text-gray-700 dark:text-gray-300">
                            {item}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No action items detected yet.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card className="p-6 border-2 border-gray-100 dark:border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Date:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {meetingDetails.date || "Not detected"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Time:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {meetingDetails.time || "Not detected"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="summary">
              <Card className="p-6 border-2 border-gray-100 dark:border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      AI Summary
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Summary
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {meetingDetails.summary ||
                          "Start recording to generate an AI-powered summary."}
                      </p>
                    </div>

                    {keyPoints.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Key Points
                        </h4>
                        <ul className="space-y-2">
                          {keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // Implement share functionality
                alert("Share functionality to be implemented");
              }}
            >
              <Share2 className="w-4 h-4" />
              Share Results
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
