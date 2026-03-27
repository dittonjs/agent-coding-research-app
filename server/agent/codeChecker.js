import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are a code checker. You will be given code that is supposed to implement the selection sort algorithm. Your job is to determine if the code correctly implements selection sort.

Selection sort works by:
1. Finding the minimum element in the unsorted portion of the array
2. Swapping it with the first element of the unsorted portion
3. Repeating until the array is sorted

Analyze the code and respond with valid JSON in this exact format and nothing else:
{"correct": true/false, "message": "<brief explanation of what is correct or what is wrong>"}

If the code is correct, say so briefly. If incorrect, explain what is wrong or missing without giving the solution.`;

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0,
});

export async function checkCode(code, language) {
  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(`Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``),
  ];

  const response = await model.invoke(messages);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { correct: false, message: "Unable to check the code. Please try again." };
  }
}
