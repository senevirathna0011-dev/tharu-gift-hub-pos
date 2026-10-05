import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: 'Artisan Lavender Scented Soy Candle',
    sku: 'GIFT-1001',
    category: 'Candles & Fragrance',
    costPrice: 6.50,
    sellingPrice: 18.00,
    stockQuantity: 24,
    minStockAlert: 5,
    description: 'Hand-poured 100% natural soy wax candle infused with French lavender essential oils.',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Cuddle Hugs Teddy Bear (Large 14")',
    sku: 'GIFT-1002',
    category: 'Toys & Plush',
    costPrice: 8.00,
    sellingPrice: 24.99,
    stockQuantity: 15,
    minStockAlert: 4,
    description: 'Ultra-soft plush teddy bear with satin neck ribbon, hypoallergenic.',
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Handcrafted Floral Greeting Card',
    sku: 'GIFT-1003',
    category: 'Greeting Cards',
    costPrice: 1.20,
    sellingPrice: 4.99,
    stockQuantity: 45,
    minStockAlert: 10,
    description: 'Embossed gold foil floral design with custom textured envelope.',
    image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Custom Engraved Wooden Keepsake Box',
    sku: 'GIFT-1004',
    category: 'Personalized Gifts',
    costPrice: 12.00,
    sellingPrice: 34.50,
    stockQuantity: 8,
    minStockAlert: 3,
    warranty: '1 Year',
    description: 'Solid walnut keepsake memory box with velvet interior lining.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Warm Hug Ceramic Coffee Mug (Pink Pastels)',
    sku: 'GIFT-1005',
    category: 'Mugs & Drinkware',
    costPrice: 4.50,
    sellingPrice: 14.99,
    stockQuantity: 3,
    minStockAlert: 6,
    description: 'Hand-glazed stoneware mug with ergonomic comfort handle, 350ml.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Warm Fairy LED String Lights (Rose Gold Wire)',
    sku: 'GIFT-1006',
    category: 'Home Decor',
    costPrice: 3.50,
    sellingPrice: 12.99,
    stockQuantity: 18,
    minStockAlert: 5,
    warranty: '6 Months',
    description: '10-meter waterproof battery-operated starry string lights with 8 modes.',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Luxury Velvet Ribbon Gift Box Set (3-Pack)',
    sku: 'GIFT-1007',
    category: 'Gift Wrap & Boxes',
    costPrice: 5.00,
    sellingPrice: 16.50,
    stockQuantity: 20,
    minStockAlert: 5,
    description: 'Nesting rigid gift boxes in blush pink with gold foil trim and magnetic closure.',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Artisanal Belgian Chocolate Truffles (12 Pcs)',
    sku: 'GIFT-1008',
    category: 'Confections & Sweets',
    costPrice: 7.50,
    sellingPrice: 19.99,
    stockQuantity: 12,
    minStockAlert: 4,
    description: 'Assorted handcrafted gourmet truffles in a golden decorative gift tin.',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Personalized Monogram Leather Keychain',
    sku: 'GIFT-1009',
    category: 'Personalized Gifts',
    costPrice: 3.00,
    sellingPrice: 11.50,
    stockQuantity: 2,
    minStockAlert: 5,
    description: 'Full-grain Italian leather keychain with brushed brass hardware.',
    image: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Vintage Style Glass Snow Globe (Winter Wonderland)',
    sku: 'GIFT-1010',
    category: 'Home Decor',
    costPrice: 11.00,
    sellingPrice: 29.99,
    stockQuantity: 9,
    minStockAlert: 3,
    warranty: '6 Months',
    description: 'Wind-up musical snow globe playing "Canon in D" with swirling glitter snow.',
    image: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Birthday Pop-Up Greeting Card (3D Butterfly Garden)',
    sku: 'GIFT-1011',
    category: 'Greeting Cards',
    costPrice: 2.00,
    sellingPrice: 6.99,
    stockQuantity: 30,
    minStockAlert: 8,
    description: 'Laser-cut pop up butterfly greeting card that expands into 3D flower bouquet.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Aromatherapy Essential Oil Diffuser (Ceramic White)',
    sku: 'GIFT-1012',
    category: 'Candles & Fragrance',
    costPrice: 14.00,
    sellingPrice: 39.99,
    stockQuantity: 5,
    minStockAlert: 3,
    warranty: '1 Year',
    description: 'Ultrasonic whisper-quiet mist diffuser with warm ambient nightlight.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60',
  }
];

const sampleUsers = [
  {
    name: 'Emma Harrison (Administrator)',
    username: 'admin',
    password: 'admin123',
    pin: '1234',
    role: 'ADMIN',
    isActive: true,
  },
  {
    name: 'Sarah Jenkins (Cashier)',
    username: 'cashier1',
    password: 'cashier123',
    pin: '1111',
    role: 'CASHIER',
    isActive: true,
  },
  {
    name: 'Alex Morgan (Cashier)',
    username: 'cashier2',
    password: 'cashier123',
    pin: '2222',
    role: 'CASHIER',
    isActive: true,
  }
];

async function main() {
  console.log('Seeding Tharu Gift Hub database...');

  // 1. Upsert default settings
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'Tharu Gift Hub',
      shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
      address: '452 Velvet Lane, Suite 100, West District',
      phone: '+1 (555) 839-4438',
      email: 'hello@blissandbloomgifts.com',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxRate: 0.08,
      receiptFooter: 'Thank you for shopping with us! Visit again. ✨',
      receiptNote: 'Items in original condition can be exchanged within 14 days with this receipt.',
    },
  });

  // 2. Upsert users
  for (const u of sampleUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: u,
      create: u,
    });
  }

  // 3. Upsert sample products
  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }

  // 4. Create a demo sale if none exist
  const existingSales = await prisma.sale.count();
  if (existingSales === 0) {
    const candle = await prisma.product.findUnique({ where: { sku: 'GIFT-1001' } });
    const card = await prisma.product.findUnique({ where: { sku: 'GIFT-1003' } });

    if (candle && card) {
      const subtotal = candle.sellingPrice * 1 + card.sellingPrice * 2;
      const discountAmount = 0.0;
      const taxRate = 0.08;
      const taxAmount = +(subtotal * taxRate).toFixed(2);
      const totalAmount = +(subtotal + taxAmount).toFixed(2);

      await prisma.sale.create({
        data: {
          receiptNo: 'BB-20260815-0001',
          customerName: 'Sarah Jenkins',
          cashierId: 'default-admin',
          cashierName: 'Emma Harrison',
          subtotal,
          discountType: 'NONE',
          discountValue: 0,
          discountAmount,
          taxRate,
          taxAmount,
          totalAmount,
          paymentMethod: 'CASH',
          amountPaid: 35.00,
          changeDue: +(35.00 - totalAmount).toFixed(2),
          notes: 'Gift wrapped for birthday',
          items: {
            create: [
              {
                productId: candle.id,
                productName: candle.name,
                productSku: candle.sku,
                quantity: 1,
                unitPrice: candle.sellingPrice,
                subtotal: candle.sellingPrice * 1,
              },
              {
                productId: card.id,
                productName: card.name,
                productSku: card.sku,
                quantity: 2,
                unitPrice: card.sellingPrice,
                subtotal: card.sellingPrice * 2,
              },
            ],
          },
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
