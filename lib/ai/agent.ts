import "server-only";
import OpenAI from "openai";
import {
  getCourses,
  getCourseDetails,
  getFaqs,
  getAnnouncements,
  getSettings,
  saveLead,
} from "./tools";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  reply: string;
  toolCallsMade: string[];
}

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getCourses",
      description: "Get all active courses with their batches. Call this before answering any general course questions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getCourseDetails",
      description: "Get full details for a specific course including batches and FAQs.",
      parameters: {
        type: "object",
        properties: {
          courseId: { type: "string", description: "The UUID of the course" },
        },
        required: ["courseId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getFaqs",
      description: "Get FAQs. Optionally filter by courseId to get course-specific FAQs plus platform-wide FAQs.",
      parameters: {
        type: "object",
        properties: {
          courseId: { type: "string", description: "Optional course UUID to filter FAQs" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAnnouncements",
      description: "Get current active announcements.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getSettings",
      description: "Get platform settings including institute name, contact info, and escalation message.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "saveLead",
      description: "Save a lead after the user has given explicit consent. Only call this after consent is confirmed.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Chat session UUID" },
          name: { type: "string", description: "User's full name" },
          phone: { type: "string", description: "User's phone number" },
          email: { type: "string", description: "User's email address" },
          interestedCourse: { type: "string", description: "Name of the course they're interested in" },
          consentGiven: { type: "boolean", description: "Must be true" },
        },
        required: ["consentGiven"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "getCourses":
      return getCourses();
    case "getCourseDetails":
      return getCourseDetails(args.courseId as string);
    case "getFaqs":
      return getFaqs(args.courseId as string | undefined);
    case "getAnnouncements":
      return getAnnouncements();
    case "getSettings":
      return getSettings();
    case "saveLead":
      return saveLead(args as Parameters<typeof saveLead>[0]);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function runAgent(
  systemPrompt: string,
  history: Message[],
  userMessage: string
): Promise<AgentResponse> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const toolCallsMade: string[] = [];

  // Agentic loop — continues until no more tool calls
  while (true) {
    console.log("[agent] calling OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    if (choice.finish_reason !== "tool_calls" || !assistantMessage.tool_calls) {
      return {
        reply: assistantMessage.content ?? "",
        toolCallsMade,
      };
    }

    // Execute all tool calls in parallel — errors returned as messages, not thrown
    const toolResults = await Promise.all(
      assistantMessage.tool_calls.map(async (tc) => {
        toolCallsMade.push(tc.function.name);
        let args: Record<string, unknown> = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) as Record<string, unknown> : {};
        } catch {
          args = {};
        }
        let content: string;
        try {
          const result = await executeTool(tc.function.name, args);
          content = JSON.stringify(result);
        } catch (err) {
          content = JSON.stringify({ error: err instanceof Error ? err.message : "Tool unavailable" });
        }
        return {
          tool_call_id: tc.id,
          role: "tool" as const,
          content,
        };
      })
    );

    messages.push(...toolResults);
  }
}
