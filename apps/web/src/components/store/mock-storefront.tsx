import { ShoppingCart, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useStorefrontStore } from "../../store/storefront";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  darkImage?: string;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "headphones",
    name: "Aethelgard Nova ANC-1 Headphones",
    price: 349.99,
    image: "/headphones.png",
    darkImage: "/headphones-dark.png",
    description: "Premium noise-cancelling over-ear headphones with 40-hour battery life.",
  },
  {
    id: "keyboard",
    name: "Proxima 75% Mechanical Keyboard",
    price: 189.0,
    image: "/keyboard.png",
    darkImage: "/keyboard-dark.png",
    description: "High-end 75% mechanical keyboard with tactile switches and RGB.",
  },
  {
    id: "mouse",
    name: "Razer Ergonomic Wireless Mouse",
    price: 129.5,
    image: "/mouse.png",
    darkImage: "/mouse-dark.png",
    description: "Ultra-lightweight wireless gaming mouse with 26K DPI optical sensor.",
  },
  {
    id: "monitor",
    name: "Lumina 4K UltraSharp Monitor",
    price: 599.0,
    image: "/monitor.png",
    darkImage: "/monitor-dark.png",
    description: "27-inch 4K monitor with 100% sRGB color accuracy for professionals.",
  },
];

export function MockStorefront() {
  const { cart, isCheckingOut, addToCart, removeFromCart, clearCart, setCheckingOut } =
    useStorefrontStore();
  const [showCart, setShowCart] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setTimeout(() => {
      clearCart();
      setCheckingOut(false);
      setShowCart(false);
    }, 2000);
  };

  return (
    <div
      data-scene="store"
      className="w-full h-full bg-background text-foreground overflow-y-auto pb-40"
    >
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm leading-none">T</span>
            </div>
            <h1 className="text-base font-bold tracking-tight">TechNova</h1>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
              {/* Headless LLM Action Triggers */}
              <button
                id="global-checkout"
                onClick={handleCheckout}
                aria-label="Checkout all items in cart"
                className="sr-only"
                tabIndex={-1}
              />
              <button
                id="global-clear-cart"
                onClick={clearCart}
                aria-label="Clear all items from cart"
                className="sr-only"
                tabIndex={-1}
              />

              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
                Categories
              </button>
              <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
                Deals
              </button>
            </nav>

            <div className="flex items-center gap-4 pl-6 border-l border-border/50">
              <div className="flex flex-col items-end" aria-live="polite">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">
                  Total
                </span>
                <span className="text-xs font-bold tabular-nums leading-none">
                  ${total.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => setShowCart(!showCart)}
                variant="outline"
                size="sm"
                className="relative h-8 px-3"
                aria-label={`View Cart with ${cart.length} items`}
                id="view-cart-button"
              >
                <ShoppingCart size={14} className="mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">
                  Cart
                </span>
                {cart.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm border border-background"
                    aria-hidden="true"
                  >
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {showCart && (
        <div className="absolute right-4 top-20 z-20 w-80 bg-card border border-border shadow-xl rounded-xl overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold text-sm">Your Cart</h3>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <Button
                  id="clear-cart-button"
                  onClick={clearCart}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive/90"
                  aria-label="Clear all items from cart"
                >
                  Clear
                </Button>
              )}
              <button
                onClick={() => setShowCart(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] p-4 flex flex-col gap-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Your cart is empty.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center gap-2">
                  <span className="text-xs font-medium truncate flex-1" aria-label={item.name}>
                    {item.name}
                  </span>
                  <span className="text-xs font-bold">${item.price}</span>
                  <Button
                    id={`remove-item-${item.id}-${idx}`}
                    onClick={() => removeFromCart(idx)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold">Total</span>
                <span className="text-sm font-bold">${total.toFixed(2)}</span>
              </div>
              <Button
                id="checkout-button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-8 text-xs font-bold"
                aria-label="Checkout cart"
              >
                {isCheckingOut ? "Processing..." : "Checkout Now"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="mb-8 flex items-center gap-2">
          <Tag size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold tracking-tight">Featured Equipment</h2>
        </header>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col hover:border-primary/30"
              aria-labelledby={`product-title-${product.id}`}
            >
              <div className="aspect-[4/3] bg-secondary/50 relative overflow-hidden flex items-center justify-center p-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className={`max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 drop-shadow-md ${product.darkImage ? "dark:hidden" : ""}`}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback for missing images in playground
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmaWxsPSIjOTk5Ij5JbWFnZTwvdGV4dD48L3N2Zz4=";
                  }}
                />
                {product.darkImage && (
                  <img
                    src={product.darkImage}
                    alt={`${product.name} (Dark Mode)`}
                    className="max-w-full max-h-full object-contain hidden dark:block mix-blend-screen group-hover:scale-110 transition-transform duration-500 drop-shadow-md"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex justify-between items-start gap-2">
                  <h3
                    id={`product-title-${product.id}`}
                    className="font-semibold text-sm leading-tight text-foreground line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    tabIndex={0}
                  >
                    {product.name}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground flex-1 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="font-bold text-sm tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => addToCart(product)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold px-3 hover:bg-primary hover:text-primary-foreground transition-colors group/btn"
                    aria-label={`Add ${product.name} to cart`}
                    id={`add-to-cart-${product.id}`}
                  >
                    <Plus
                      size={14}
                      className="mr-1 group-hover/btn:scale-110 transition-transform"
                      aria-hidden="true"
                    />{" "}
                    Add
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
