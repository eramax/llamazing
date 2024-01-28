import { KeyboardEvent, useEffect, useState } from "react";
import "./App.css";
import { Button } from "./rac/Button.tsx";
import ollama, { Message } from "ollama";
import {
  Bot,
  CircleUserRound,
  Globe,
  MoonIcon,
  SendHorizonal,
  SunIcon,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer.tsx";
import { Label } from "./rac/Field.tsx";
import { Tooltip } from "./rac/Tooltip.tsx";
import { TextArea, TooltipTrigger } from "react-aria-components";
import { Select } from "./rac/Select.tsx";
import { ListBoxItem } from "./rac/ListBox.tsx";
import { ToggleButton } from "./rac/ToggleButton.tsx";

function App() {
  const [prompt, setPrompt] = useState(``);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a helpful AI assistant trained on a vast amount of human knowledge. Answer as concisely as possible.`,
  );
  const [response, setResponse] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    (async () => {
      const _models = (await ollama.list()).models.map((m) => m.name);
      setModels(_models);
      if (_models.length) {
        setModel(_models[0]);
      }
    })();
  }, []);

  useEffect(() => {
    document.body.classList.remove("dark");
    document.body.classList.remove("light");
    document.body.classList.add(theme);
  }, [theme]);

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

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <div className={theme}>
      <div className="relative flex h-screen bg-white font-sans text-gray-700 dark:bg-neutral-700 dark:text-white">
        <div className="absolute right-4 top-4">
          <ToggleButton onChange={toggleTheme} className="border-none p-2">
            {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </ToggleButton>
        </div>
        <aside className="relative hidden h-screen w-0 flex-col bg-neutral-200 p-6 py-2 drop-shadow-xl dark:bg-neutral-800 md:flex md:w-[350px]  ">
          <h1 className="mx-auto mt-10 flex select-none gap-2 text-3xl">
            <Bot size="34" /> LLaMazing
          </h1>

          <div className="mt-8 flex select-none items-center">
            <Globe
              className="mt-0.5 rounded p-[6px] text-blue-500 dark:text-blue-400"
              size="34"
            />
            <Label className="text-neutral-700">System Prompt:</Label>
          </div>
          <TextArea
            id="system-prompt"
            aria-label="system-prompt"
            className="mt-2 h-32 rounded-xl border-2 border-neutral-300 p-4 text-[0.9rem] outline-none focus:border-neutral-400 dark:border-neutral-400/40 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-neutral-500"
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

        <main className="flex-1 px-6 pt-14">
          <div className="relative m-auto flex h-full flex-col px-8 pb-60">
            <div className="grid grid-cols-[auto_minmax(0,_1fr)] gap-x-6 gap-y-4 overflow-y-auto">
              <Bot
                className="rounded bg-purple-400 p-[4px] text-white dark:bg-yellow-400 dark:text-yellow-900"
                size="38"
              />
              <div className="mt-[7px] flex flex-col gap-2 pr-8">
                How may I help you?
              </div>
              {messages.map((m) => (
                <>
                  {
                    {
                      user: (
                        <CircleUserRound
                          className="rounded bg-blue-400 p-[6px] text-white dark:bg-orange-400 dark:text-orange-900"
                          size="38"
                        />
                      ),
                      assistant: (
                        <Bot
                          className="rounded bg-purple-400 p-[4px] text-white dark:bg-yellow-400 dark:text-yellow-900"
                          size="38"
                        />
                      ),
                    }[m.role]
                  }
                  <div className="prose mt-[7px] flex flex-col gap-2 pr-8">
                    <MarkdownRenderer theme={theme} content={m.content} />
                  </div>
                </>
              ))}
              {response ? (
                <>
                  <Bot
                    className="rounded bg-purple-400 p-[4px] text-white dark:bg-yellow-400 dark:text-yellow-900"
                    size="38"
                  />
                  <div className="prose mt-[7px] flex flex-col gap-2 pr-8">
                    <MarkdownRenderer theme={theme} content={response + "▌"} />
                  </div>
                </>
              ) : (
                ""
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-4 py-8">
              <div className="flex rounded-xl border-2 border-neutral-500/50 p-2 has-[:focus]:border-neutral-500">
                <TextArea
                  id="prompt"
                  aria-label="prompt"
                  className="mr-2 w-full resize-none bg-transparent p-2 text-[0.95rem] text-neutral-700 outline-none dark:text-white"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="Your message here..."
                />
                <TooltipTrigger delay={750} closeDelay={10}>
                  <Button
                    isDisabled={!canSubmit()}
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
    </div>
  );
}

export default App;
