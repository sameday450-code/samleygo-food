import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../cache/cache-keys';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private cacheService: CacheService,
  ) {}

  private async invalidateMenuCache(restaurantId: string) {
    await this.cacheService.del(
      CacheKeys.MENU_CATEGORIES(restaurantId),
      CacheKeys.MENU_ITEMS(restaurantId),
    );
    this.logger.log(`Menu cache invalidated for restaurant ${restaurantId}`);
  }

  private async getRestaurantByOwner(ownerId: string) {
    const [restaurant] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.ownerId, ownerId));

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

    return restaurant;
  }

  // CATEGORIES

  async createCategory(ownerId: string, dto: CreateCategoryDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

    const [category] = await this.db
      .insert(schema.menuCategories)
      .values({ restaurantId: restaurant.id, name: dto.name })
      .returning();

    await this.invalidateMenuCache(restaurant.id);
    return category;
  }

  async getCategories(restaurantId: string) {
    const cached = await this.cacheService.get<
      (typeof schema.menuCategories.$inferSelect)[]
    >(CacheKeys.MENU_CATEGORIES(restaurantId));

    if (cached) {
      this.logger.log(
        `Returning categories for restaurant ${restaurantId} from cache`,
      );
      return cached;
    }

    const categories = await this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, restaurantId));

    await this.cacheService.set(
      CacheKeys.MENU_CATEGORIES(restaurantId),
      categories,
      300,
    );

    return categories;
  }

  async updateCategory(id: string, ownerId: string, dto: UpdateCategoryDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [category] = await this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    if (!category) throw new NotFoundException('Category not found');

    if (category.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This category does not belong to your restaurant',
      );
    }

    const [updated] = await this.db
      .update(schema.menuCategories)
      .set({ name: dto.name })
      .where(eq(schema.menuCategories.id, id))
      .returning();

    await this.invalidateMenuCache(restaurant.id);
    return updated;
  }

  async deleteCategory(id: string, ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [category] = await this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    if (!category) throw new NotFoundException('Category not found');

    if (category.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This category does not belong to your restaurant',
      );
    }

    // cascade delete will remove all items in this category automatically
    await this.db
      .delete(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    await this.invalidateMenuCache(restaurant.id);
    return { message: 'Category deleted' };
  }

  // MENU ITEMS

  async createItem(ownerId: string, dto: CreateMenuItemDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

    const [item] = await this.db
      .insert(schema.menuItems)
      .values({
        restaurantId: restaurant.id,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        isAvailable: true,
      })
      .returning();

    await this.invalidateMenuCache(restaurant.id);
    return item;
  }

  async getItemsByRestaurant(restaurantId: string) {
    const cached = await this.cacheService.get<
      (typeof schema.menuItems.$inferSelect)[]
    >(CacheKeys.MENU_ITEMS(restaurantId));

    if (cached) {
      this.logger.log(
        `Returning menu items for restaurant ${restaurantId} from cache`,
      );
      return cached;
    }

    // returns all items for a restaurant — frontend groups them by category
    const items = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurantId));

    await this.cacheService.set(CacheKeys.MENU_ITEMS(restaurantId), items, 300);

    return items;
  }

  async updateItem(id: string, ownerId: string, dto: UpdateMenuItemDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [item] = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, id));

    if (!item) throw new NotFoundException('Menu item not found');

    if (item.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This item does not belong to your restaurant',
      );
    }

    const [updated] = await this.db
      .update(schema.menuItems)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.menuItems.id, id))
      .returning();

    await this.invalidateMenuCache(restaurant.id);
    return updated;
  }

  async deleteItem(id: string, ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [item] = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, id));

    if (!item) throw new NotFoundException('Menu item not found');

    if (item.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This item does not belong to your restaurant',
      );
    }

    await this.db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));

    await this.invalidateMenuCache(restaurant.id);
    return { message: 'Item deleted' };
  }
}
