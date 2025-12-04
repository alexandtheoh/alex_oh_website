import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngineInterface | null = null;

export async function initLLM(onProgress?: (text: string) => void) {
  if (engine) return;

  engine = await webllm.CreateWebWorkerMLCEngine(
    new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    {
      initProgressCallback: (progress) => {
        if (onProgress) onProgress(progress.text);
        console.log("LLM loading:", progress);
      }
    }
  );

}

export async function sendPrompt(messages: webllm.ChatCompletionMessageParam[]) {
  if (!engine) throw new Error("LLM not initialized");
  console.log(messages)

  const request: webllm.ChatCompletionRequest = {
    messages,
    stream: true
  };

  const completion = await engine.chat.completions.create(request);
  console.log(completion)
  return completion
}
