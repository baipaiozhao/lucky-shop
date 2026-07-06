import { cartRepository } from "../repositories/cart.repository";
import { productRepository } from "../repositories/product.repository";
import { BaseService } from "./base.service";

export class CartService extends BaseService {
  private formatItem(item: any) {
    return {
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productImage: (Array.isArray(item.product.images) ? item.product.images[0] : (typeof item.product.images === 'string' ? JSON.parse(item.product.images)[0] : "")) || "",
      price: Number(item.product.price),
      stock: item.product.stock,
      isActive: item.product.isActive,
      quantity: item.quantity,
      selected: item.selected,
    };
  }

  async list(userId: string) {
    const items = await cartRepository.findByUser(userId);
    const formatted = items.map((item) => this.formatItem(item));
    const selectedItems = formatted.filter((i) => i.selected && i.isActive);
    const itemCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { data: formatted, meta: { itemCount, totalPrice } };
  }

  async add(userId: string, productId: string, quantity: number) {
    const product = await productRepository.findById(productId);
    if (!product || !product.isActive) this.notFound("商品不存在或已下架");
    if (product.stock < quantity) this.badRequest("库存不足", "A4001");

    const existing = await cartRepository.findItem(userId, productId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) this.badRequest("库存不足", "A4001");
      const updated = await cartRepository.updateQuantity(existing.id, newQty);
      return this.formatItem(updated);
    }
    const created = await cartRepository.create(userId, productId, quantity);
    return this.formatItem(created);
  }

  async update(userId: string, itemId: string, changes: { quantity?: number; selected?: boolean }) {
    const cartItem = await cartRepository.findItemByUser(userId, itemId);
    if (!cartItem) this.notFound("购物车项不存在");

    if (changes.quantity !== undefined) {
      if (changes.quantity === 0) {
        await cartRepository.remove(cartItem.id);
        return { message: "已移除" };
      }
      if (cartItem.product.stock < changes.quantity) this.badRequest("库存不足", "A4001");
      const updated = await cartRepository.updateQuantity(cartItem.id, changes.quantity);
      return this.formatItem(updated);
    }
    if (changes.selected !== undefined) {
      const updated = await cartRepository.updateSelected(cartItem.id, changes.selected);
      return this.formatItem(updated);
    }
    return this.formatItem(cartItem);
  }

  async removeItem(userId: string, itemId: string) {
    const cartItem = await cartRepository.findItemByUser(userId, itemId);
    if (!cartItem) this.notFound("购物车项不存在");
    await cartRepository.remove(cartItem.id);
    return { message: "已移除" };
  }

  async clear(userId: string) {
    await cartRepository.clear(userId);
    return { message: "购物车已清空" };
  }
}

export const cartService = new CartService();

