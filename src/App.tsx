import { KeyboardEvent, useEffect, useState } from "react";
import "./App.css";
import { Button } from "./rac/Button.tsx";
import ollama, { Message } from "ollama";
import { Bot, CircleUserRound, Globe, SendHorizonal } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer.tsx";
import { Label } from "./rac/Field.tsx";
import { Tooltip } from "./rac/Tooltip.tsx";
import { TextArea, TooltipTrigger } from "react-aria-components";
import { Select } from "./rac/Select.tsx";
import { ListBoxItem } from "./rac/ListBox.tsx";

function App() {
  const [prompt, setPrompt] = useState(``);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a helpful AI assistant trained on a vast amount of human knowledge. Answer as concisely as possible.`,
  );
  const [response, setResponse] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    (async () => {
      const _models = (await ollama.list()).models.map((m) => m.name);
      setModels(_models);
      if (!model && _models.length) {
        setModel(_models[0]);
      }
    })();
  }, []);

  const chat = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setResponse(" ");

    const res = await ollama.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: message },
      ],
      stream: true,
      options: {
        stop: ["<|im_start|>", "<|im_end|>", "<s>", "</s>", "<|system|>"],
        // temperature: 0.5,
        // num_ctx: 2048,
      },
    });

    let resp = "";
    for await (const part of res) {
      resp += part.message.content;
      setResponse(resp);
    }
    setResponse("");

    setMessages((prev) => [...prev, { role: "assistant", content: resp }]);
  };

  const submit = async () => {
    if (prompt) {
      setPrompt("");
      await chat(prompt.trim());
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit()) {
        await submit();
      } else {
        alert("Please pick a model first");
      }
    }
  };

  function canSubmit() {
    return !!(prompt && model);
  }

  return (
    <div className="flex h-screen bg-neutral-800 font-sans text-white">
      <aside className="relative hidden h-screen w-0 flex-col p-6 py-2 md:flex md:w-[350px]">
        <h1 className="mx-auto mt-10 flex select-none gap-2 text-3xl">
          <Bot size="32" /> LLaMazing
        </h1>

        <div className="mt-8 flex select-none items-center">
          <Globe className="mt-0.5 rounded p-[6px] text-blue-400" size="30" />
          <Label className="">System Prompt:</Label>
        </div>
        <TextArea
          id="system-prompt"
          aria-label="system-prompt"
          className="mt-2 h-32 rounded-xl border-2 border-neutral-400/40 bg-neutral-800 p-4 text-[0.9rem] text-neutral-200 outline-none focus:border-neutral-400"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />

        <div className="absolute bottom-0 left-0 w-full p-4">
          <Select
            selectedKey={model}
            aria-label="select-model"
            onSelectionChange={(s) => setModel(String(s))}
          >
            {models.map((m) => (
              <ListBoxItem id={m}>{m}</ListBoxItem>
            ))}
          </Select>
        </div>
      </aside>

      <main className="flex-1 bg-neutral-700 px-16 py-4">
        <div className="relative m-auto flex h-full flex-col gap-2 px-8 pb-60 pt-20">
          <div className="mt-4 grid grid-cols-[auto_minmax(0,_1fr)] gap-x-4 gap-y-10 overflow-y-auto">
            <Bot
              className="rounded bg-yellow-400 p-[4px] text-yellow-900"
              size="32"
            />
            <div className="mt-[3px] flex flex-col gap-2 pr-8">
              How may I help you?
            </div>
            {messages.map((m) => (
              <>
                {
                  {
                    user: (
                      <CircleUserRound
                        className="rounded bg-orange-400 p-[6px] text-orange-900"
                        size="32"
                      />
                    ),
                    assistant: (
                      <Bot
                        className="rounded bg-yellow-400 p-[4px] text-yellow-900"
                        size="32"
                      />
                    ),
                  }[m.role]
                }
                <div className="prose mt-[3px] flex flex-col gap-2 pr-8">
                  <MarkdownRenderer content={m.content} />
                </div>
              </>
            ))}
            {response ? (
              <>
                <Bot
                  className="rounded bg-yellow-400 p-[4px] text-yellow-900"
                  size="32"
                />
                <div className="prose mt-[3px] flex flex-col gap-2 pr-8">
                  <MarkdownRenderer content={response + "▌"} />
                </div>
              </>
            ) : (
              ""
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-14 py-8">
            <div className="flex rounded-xl border-2 border-neutral-500/50 p-2 has-[:focus]:border-neutral-400">
              <TextArea
                id="prompt"
                aria-label="prompt"
                className="mr-2 w-full resize-none bg-transparent p-2 text-[0.95rem] text-white outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Your message here..."
              />
              <TooltipTrigger delay={750} closeDelay={10}>
                <Button
                  isDisabled={canSubmit()}
                  className={`${canSubmit() ? "bg-black hover:cursor-pointer hover:bg-neutral-800" : "bg-neutral-500 hover:bg-neutral-200"}`}
                  onPress={submit}
                >
                  <SendHorizonal
                    size="20"
                    className={`-rotate-90 font-bold ${canSubmit() ? "text-white" : "text-gray-400"}`}
                  />
                </Button>
                <Tooltip>Send</Tooltip>
              </TooltipTrigger>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
