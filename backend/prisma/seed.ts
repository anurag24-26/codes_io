import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@codes.io" },
    update: {},
    create: {
      email: "demo@codes.io",
      name: "Demo Owner",
      passwordHash,
      subscription: {
        create: { plan: "FREE", status: "ACTIVE", provider: "MOCK" },
      },
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-diner" },
    update: {},
    create: {
      ownerId: user.id,
      name: "Demo Diner",
      slug: "demo-diner",
      description: "A friendly neighborhood diner serving comfort food classics.",
      address: "123 MG Road, Bengaluru",
      phone: "+91 98765 43210",
      accentColor: "#111827",
    },
  });

  const categoriesData = [
    { name: "Starters", sortOrder: 0 },
    { name: "Main Course", sortOrder: 1 },
    { name: "Desserts", sortOrder: 2 },
  ];

  const categories = [];
  for (const c of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id, name: c.name },
    });
    if (!category) {
      category = await prisma.category.create({ data: { ...c, restaurantId: restaurant.id } });
    }
    categories.push(category);
  }

  const [starters, mains, desserts] = categories;

  const itemsData = [
    { name: "Paneer Tikka", price: 220, categoryId: starters.id, isFeatured: true, description: "Chargrilled cottage cheese with house spices." },
    { name: "Veg Spring Rolls", price: 180, categoryId: starters.id, description: "Crispy rolls with a sweet chili dip." },
    { name: "Butter Chicken", price: 320, categoryId: mains.id, isFeatured: true, description: "Classic creamy tomato-based curry." },
    { name: "Dal Makhani", price: 240, categoryId: mains.id, description: "Slow-cooked black lentils." },
    { name: "Veg Biryani", price: 260, categoryId: mains.id, description: "Fragrant basmati rice with mixed vegetables." },
    { name: "Gulab Jamun", price: 120, categoryId: desserts.id, description: "Warm milk dumplings in sugar syrup." },
  ];

  for (const item of itemsData) {
    const exists = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: item.name },
    });
    if (!exists) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: restaurant.id },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log("Demo login: demo@codes.io / Demo1234!");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
