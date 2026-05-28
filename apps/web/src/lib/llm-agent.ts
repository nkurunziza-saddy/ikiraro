import { PRODUCTS } from "../components/store/mock-storefront";
import { ARTICLES } from "../components/demo/mock-news";
import { useStorefrontStore } from "../store/storefront";
import { useNewsStore } from "../store/news";

export interface AgentDecision {
  thought: string;
  response: string;
  actionId: string | null;
}

export interface IAutonomousAgent {
  perceive(): string;
  think(userInput: string): Promise<AgentDecision>;
  execute(actionId: string): Promise<void>;
}

function buildPageContext(): { scene: string; content: string; actions: Record<string, string> } {
  const isStore = !!document.querySelector("[data-scene='store']");
  const isNews = !!document.querySelector("[data-scene='news']");

  if (isStore) {
    const { cart } = useStorefrontStore.getState();
    const total = cart.reduce((sum, p) => sum + p.price, 0);

    const productList = PRODUCTS.map(
      (p, i) => `  ${i + 1}. ${p.name} — $${p.price.toFixed(2)}. ${p.description}`,
    ).join("\n");

    const actions: Record<string, string> = {};
    PRODUCTS.forEach((p) => {
      actions[`add-to-cart-${p.id}`] = `Add "${p.name}" ($${p.price.toFixed(2)}) to cart`;
    });
    actions["global-checkout"] = "Checkout — complete the purchase";
    actions["global-clear-cart"] = "Clear all items from the cart";
    actions["view-cart-button"] = "Open the cart panel";

    const cartLine =
      cart.length === 0
        ? "Cart is empty."
        : `Cart has ${cart.length} item${cart.length > 1 ? "s" : ""} — ${cart.map((p) => p.name).join(", ")} — total $${total.toFixed(2)}.`;

    return {
      scene: "e-commerce store (TechNova)",
      content: `Products available:\n${productList}\n\n${cartLine}`,
      actions,
    };
  }

  if (isNews) {
    const { readArticles, activeCategory } = useNewsStore.getState();

    const articleList = ARTICLES.map(
      (a, i) =>
        `  ${i + 1}. [${a.category}] "${a.title}" — ${a.readTime} min read. ${a.summary}${readArticles.has(a.id) ? " (already read)" : ""}`,
    ).join("\n");

    const actions: Record<string, string> = {};
    ARTICLES.forEach((a) => {
      actions[`read-${a.id}`] = `Open article: "${a.title}"`;
      actions[`mark-read-${a.id}`] = `Mark "${a.title}" as read`;
    });
    actions["filter-all"] = "Show all articles";
    actions["filter-ai"] = "Filter to AI articles only";
    actions["filter-accessibility"] = "Filter to Accessibility articles only";
    actions["mark-all-read"] = "Mark all articles as read";

    return {
      scene: "tech news feed (TechPulse)",
      content: `Active filter: ${activeCategory}\n\nArticles:\n${articleList}`,
      actions,
    };
  }

  return { scene: "unknown page", content: "No content detected.", actions: {} };
}

const SYSTEM_PROMPT = `You are Ikiraro, a warm and knowledgeable accessibility guide.
You help people with visual, motor, or hearing impairments navigate a website.
Users speak to you via voice, sign language, or text.

Your personality: friendly, clear, warm — like a helpful friend showing someone around, not a voice assistant reading a manual.

What you help with:
- Telling users what's on the page (products, articles) in natural, conversational language
- Giving details about specific items when asked
- Performing actions on their behalf (add to cart, checkout, open article, filter content)

STRICT RESPONSE RULES:
1. NEVER say: button, click, ID, element, HTML, "#...", or any technical term
2. NEVER describe what you are doing mechanically ("I will now click...")
3. When adding to cart: "Done! I've added the [name] to your cart for $[price]."
4. When opening an article: "Opening that for you now."
5. When listing products: give a friendly numbered list with name and price
6. When listing articles: give a friendly numbered list with category and title
7. When giving details: be conversational — "The headphones are $349. They have noise cancellation and a 40-hour battery."
8. When the cart is empty and someone tries to checkout: gently let them know
9. Keep responses under 50 words unless the user is asking for a full list
10. Use "actionId": null when no action is needed (just answering a question)

Respond ONLY with valid JSON: {"thought": "...", "response": "...", "actionId": "id-or-null"}
The actionId must be one of the keys from the available actions list, or null.`;

export class IkiraroAgent implements IAutonomousAgent {
  // Rolling conversation history — user text + assistant response only (no page context per turn)
  private history: Array<{ role: "user" | "assistant"; content: string }> = [];
  private readonly maxHistoryTurns = 6;

  perceive(): string {
    const { scene, content, actions } = buildPageContext();
    const actionLines = Object.entries(actions)
      .map(([id, desc]) => `  "${id}" → ${desc}`)
      .join("\n");
    return `Scene: ${scene}\n\n${content}\n\nAvailable actions:\n${actionLines}`;
  }

  async think(userInput: string): Promise<AgentDecision> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("VITE_GROQ_API_KEY is missing");

    const pageContext = this.perceive();

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      // Inject history (last N turns, no page context — saves tokens)
      ...this.history.slice(-(this.maxHistoryTurns * 2)),
      // Current turn: fresh page context + user input
      {
        role: "user" as const,
        content: `Page context:\n${pageContext}\n\nUser said: "${userInput}"`,
      },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) throw new Error("Agent reasoning failed");

    const data = await response.json();
    const decision = JSON.parse(data.choices[0].message.content) as AgentDecision;

    // Store turn in history (compact: no page context)
    this.history.push(
      { role: "user", content: userInput },
      { role: "assistant", content: decision.response },
    );

    return decision;
  }

  async execute(actionId: string): Promise<void> {
    document.getElementById(actionId)?.click();
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const globalAgent = new IkiraroAgent();
