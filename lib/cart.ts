// Cart Store using localStorage
export interface CartItem {
    productId: string;
    variantId: string;
    productName: string;
    thumbnail: string;
    attributes: Record<string, string>;
    price: number;
    quantity: number;
    stock: number;
    /** ISO timestamp: if sale ended, item lives until this time before auto-removal */
    saleGraceExpiresAt?: string;
}

const CART_KEY = "telectric_cart";

/** Stamp a 5-minute sale grace period onto a cart item (called when we detect sale just ended) */
export function setCartItemGrace(variantId: string, durationMs = 5 * 60 * 1000) {
    const cart = getCart();
    const idx = cart.findIndex(i => i.variantId === variantId);
    if (idx === -1) return cart;
    cart[idx].saleGraceExpiresAt = new Date(Date.now() + durationMs).toISOString();
    saveCart(cart);
    return cart;
}


export function getCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveCart(items: CartItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    // Dispatch event so other components can listen
    window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem) {
    const cart = getCart();
    const existingIndex = cart.findIndex(
        (c) => c.variantId === item.variantId
    );
    if (existingIndex >= 0) {
        cart[existingIndex].quantity = Math.min(
            cart[existingIndex].quantity + item.quantity,
            item.stock
        );
    } else {
        cart.push(item);
    }
    saveCart(cart);
    return cart;
}

export function updateCartItemQuantity(variantId: string, quantity: number) {
    const cart = getCart();
    const item = cart.find((c) => c.variantId === variantId);
    if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
    }
    saveCart(cart);
    return cart;
}

export function removeFromCart(variantId: string) {
    const cart = getCart().filter((c) => c.variantId !== variantId);
    saveCart(cart);
    return cart;
}

export function clearCart() {
    saveCart([]);
}

export function getCartTotal(items: CartItem[]) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartItemCount(items: CartItem[]) {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

// Format VND
export function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
