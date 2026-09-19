import type { Metadata } from "next";
import { CopyBox } from "./copy-box";
import { STARTER_PROMPT } from "@/lib/starter-prompt";
import { ClaudeMark } from "@/app/live/claude-mark";

export const metadata: Metadata = {
  title: "Your Val — The Equipped Agent",
  description: "Copy the prompt, paste it into Claude, and your own assistant builds itself.",
  robots: { index: false },
};

export default function PromptPage() {
  return (
    <main className="stage invite pz">
      <p className="pz-eyebrow">
        <ClaudeMark size={26} />
        The Equipped Agent
      </p>

      <h1 className="display pz-h">Build your own Val.</h1>
      <p className="pz-lede">
        Two taps and a paste. It takes about a minute and you keep it forever.
      </p>

      <CopyBox prompt={STARTER_PROMPT} />

      <ol className="pz-steps">
        <li>
          <span>1</span>
          <p>
            <b>Copy the prompt.</b> The button above puts it on your clipboard.
          </p>
        </li>
        <li>
          <span>2</span>
          <p>
            <b>Open Claude</b> and paste it into the message box. Free account
            is fine.
          </p>
        </li>
        <li>
          <span>3</span>
          <p>
            <b>Press enter.</b> It writes you a file, you save it as{" "}
            <code>my-val.html</code> and double-click it. That is your mark,
            running on your own machine.
          </p>
        </li>
      </ol>

      <p className="pz-after">
        Then it asks you three questions and turns into your assistant. Stuck on
        any of it? Put your hand up.
      </p>
    </main>
  );
}
