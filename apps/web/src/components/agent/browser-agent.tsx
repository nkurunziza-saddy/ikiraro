import { useState } from "react";
import { useDomObserver } from "../../hooks/use-dom-observer";
import { useIkiraro } from "../../lib/ikiraro";
import { Button } from "../ui/button";
import { Mic, MicOff, MousePointerClick, Search } from "lucide-react";

export function BrowserAgent() {
  const [isActive, setIsActive] = useState(false);
  const [command, setCommand] = useState("");

  // Start observing the DOM for focus events
  const { focusedElement } = useDomObserver(isActive);
  const { translate } = useIkiraro();

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command) return;

    const lowerCmd = command.toLowerCase();

    // Naive action execution logic
    if (lowerCmd.startsWith("click ")) {
      const targetName = lowerCmd.replace("click ", "").trim();
      const elements = Array.from(document.querySelectorAll("button, a"));
      const targetElement = elements.find((el) => {
        const text = (el.textContent || "").toLowerCase();
        const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
        return text.includes(targetName) || ariaLabel.includes(targetName);
      }) as HTMLElement;

      if (targetElement) {
        translate(`Clicking ${targetName}`);
        // Add a small delay so the user sees the sign before the click happens
        setTimeout(() => targetElement.click(), 1500);
      } else {
        translate(`Could not find ${targetName}`);
      }
    } else if (lowerCmd.includes("scroll down")) {
      translate("Scrolling down");
      setTimeout(() => window.scrollBy({ top: 500, behavior: "smooth" }), 1000);
    } else if (lowerCmd.includes("scroll up")) {
      translate("Scrolling up");
      setTimeout(() => window.scrollBy({ top: -500, behavior: "smooth" }), 1000);
    } else {
      translate("I don't understand that command");
    }

    setCommand("");
  };

  return (
    <div className="bg-card border border-border p-4 rounded-xl space-y-4 max-w-sm mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Accessibility Agent
          </h3>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Observing DOM..." : "Agent is paused"}
          </p>
        </div>
        <Button
          variant={isActive ? "default" : "outline"}
          onClick={() => setIsActive(!isActive)}
          className="rounded-full px-3 h-8"
        >
          {isActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
      </div>

      {isActive && (
        <form onSubmit={handleCommand} className="flex gap-2">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a command (e.g., 'click button')"
            className="flex-1 bg-secondary text-foreground text-[13px] rounded-md px-3 py-1.5 outline-none border border-transparent focus:border-border"
          />
          <Button type="submit" variant="outline" className="px-3">
            <MousePointerClick className="w-4 h-4" />
          </Button>
        </form>
      )}

      {isActive && focusedElement && (
        <div className="text-[13px] text-muted-foreground p-2 bg-secondary rounded-md border border-border/50 truncate">
          <strong>Focused:</strong> {focusedElement.tagName.toLowerCase()}
          {focusedElement.id ? `#${focusedElement.id}` : ""}
          {focusedElement.className ? `.${focusedElement.className.split(" ").join(".")}` : ""}
        </div>
      )}
    </div>
  );
}
