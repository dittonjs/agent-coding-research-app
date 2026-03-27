import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are a code-writing assistant for a programming exercise. Your ONLY job is to translate the user's explicit structural instructions into code changes in the language they are using. You are NOT a tutor, NOT a problem solver, and NOT an algorithm expert.

RULES YOU MUST FOLLOW:

1. ONLY accept instructions that describe specific code constructs:
   - "Add a for loop that iterates from 0 to arr.length"
   - "Declare a variable called minIndex and set it to i"
   - "Add an if statement that checks if arr[j] < arr[minIndex]"
   - "Swap arr[i] and arr[minIndex]"
   - "Add a return statement that returns arr"
   - "Delete line 3"
   - "Move the if statement inside the for loop"

2. REFUSE any of the following:
   - Questions about algorithms ("how does selection sort work?", "what is selection sort?")
   - Requests to implement algorithms ("implement selection sort", "write a sorting function", "sort this array")
   - Requests for explanations ("explain this code", "what does this do?")
   - Requests for debugging help ("why isn't this working?", "find the bug")
   - Requests for general coding advice ("what should I do next?", "what's the next step?")
   - Any prompt that implies the user wants YOU to decide what code to write
   - Any prompt referencing a named algorithm (selection sort, bubble sort, insertion sort, merge sort, quick sort, etc.)

3. When you REFUSE a request, respond with:
   - code: return the current code UNCHANGED
   - message: "I can only help you write specific code constructs. Tell me exactly what to add, like 'add a for loop from 0 to arr.length' or 'declare a variable called x'."

4. When you ACCEPT a request:
   - Apply ONLY the specific change the user described
   - Do NOT add anything the user did not ask for
   - Do NOT fix other issues you might notice in the code
   - Do NOT add comments unless the user asks for them
   - Do NOT restructure or refactor code unless explicitly asked
   - Return the COMPLETE updated code (not a diff)

5. If the user has selected/highlighted specific code, apply the instruction to that selection. If no selection, use your best judgment about where to place the new code, but ONLY place what was explicitly requested.

6. Keep your message response brief -- just confirm what you did (e.g., "Added a for loop iterating from 0 to arr.length").

You must respond with valid JSON in this exact format and nothing else:
{"code": "<the full updated code>", "message": "<brief description of what you did>"}`;

const BLOCKED_PATTERNS = [
  /selection\s*sort/i,
  /bubble\s*sort/i,
  /insertion\s*sort/i,
  /merge\s*sort/i,
  /quick\s*sort/i,
  /heap\s*sort/i,
  /implement\s+(a\s+)?sort/i,
  /sort\s+(the\s+)?array/i,
  /how\s+(do|does|to)\s/i,
  /what\s+(is|are|does)\s/i,
  /explain/i,
  /write\s+(the\s+)?(code|function|algorithm|program)/i,
  /solve/i,
  /complete\s+(the|this)/i,
  /what\s+should\s+i/i,
  /next\s+step/i,
  /help\s+me\s+(write|code|implement|create|build|make)/i,
];

const REFUSAL_MESSAGE =
  "I can only help you write specific code constructs. Tell me exactly what to add, like 'add a for loop from 0 to arr.length' or 'declare a variable called x'.";

export function isBlocked(prompt) {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(prompt));
}

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0,
});

const AgentState = Annotation.Root({
  currentCode: Annotation({ reducer: (_, v) => v, default: () => "" }),
  language: Annotation({ reducer: (_, v) => v, default: () => "javascript" }),
  userPrompt: Annotation({ reducer: (_, v) => v, default: () => "" }),
  selection: Annotation({ reducer: (_, v) => v, default: () => null }),
  chatHistory: Annotation({ reducer: (_, v) => v, default: () => [] }),
  result: Annotation({ reducer: (_, v) => v, default: () => null }),
});

async function agentNode(state) {
  const systemMsg = new SystemMessage(SYSTEM_PROMPT);

  // Build user context message
  const parts = [
    `Language: ${state.language}`,
    `Current code:\n\`\`\`${state.language}\n${state.currentCode}\n\`\`\``,
  ];

  if (state.selection) {
    parts.push(
      `Selected code (lines ${state.selection.startLine}-${state.selection.endLine}):\n\`\`\`\n${state.selection.text || ""}\n\`\`\``
    );
  }

  parts.push(`Instruction: ${state.userPrompt}`);

  // Build chat history (last 20 messages for context)
  const recentHistory = state.chatHistory.slice(-20);
  const historyMessages = recentHistory.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  const messages = [
    systemMsg,
    ...historyMessages,
    new HumanMessage(parts.join("\n\n")),
  ];

  const response = await model.invoke(messages);

  let parsed;
  try {
    const content = response.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    parsed = {
      code: state.currentCode,
      message: "I couldn't process that instruction. Please try rephrasing.",
    };
  }

  return { result: parsed };
}

const graph = new StateGraph(AgentState)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile();

export async function invokeAgent({ currentCode, language, userPrompt, selection, chatHistory }) {
  // Pre-filter check
  if (isBlocked(userPrompt)) {
    return { code: currentCode, message: REFUSAL_MESSAGE };
  }

  const result = await graph.invoke({
    currentCode,
    language: language || "javascript",
    userPrompt,
    selection,
    chatHistory,
  });

  return result.result;
}
