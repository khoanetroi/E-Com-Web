/**
 * One-time migration script: generate slugs for all existing products.
 *
 * Usage:
 *   npx tsx scripts/migrate-slugs.ts
 *
 * Prerequisites:
 *   - Column `slug` (text, unique) must already exist on the `products` table.
 *   - Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env from project root manually (no dotenv dependency needed)
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length > 0) {
            process.env[key.trim()] = rest.join("=").trim();
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env!");
    console.warn("   Using anon key instead — this will FAIL if RLS is enabled on `products` table.");
    console.warn("   To fix: add SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key> to .env\n");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateSlug(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

async function main() {
    console.log("🔄 Fetching all products...");

    const { data: products, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .order("created_at");

    if (error) {
        console.error("❌ Failed to fetch products:", error.message);
        process.exit(1);
    }

    if (!products || products.length === 0) {
        console.log("⚠️  No products found.");
        return;
    }

    console.log(`📦 Found ${products.length} products. Generating slugs...\n`);

    const usedSlugs = new Set<string>();
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
        // Skip if slug already exists
        if (product.slug) {
            usedSlugs.add(product.slug);
            skippedCount++;
            continue;
        }

        let slug = generateSlug(product.name);

        // Handle duplicates by appending a suffix
        if (usedSlugs.has(slug)) {
            let suffix = 2;
            while (usedSlugs.has(`${slug}-${suffix}`)) {
                suffix++;
            }
            slug = `${slug}-${suffix}`;
        }

        usedSlugs.add(slug);

        const { error: updateError } = await supabase
            .from("products")
            .update({ slug })
            .eq("id", product.id);

        if (updateError) {
            console.error(`  ❌ ${product.name} → Failed: ${updateError.message}`);
        } else {
            console.log(`  ✅ ${product.name} → ${slug}`);
            updatedCount++;
        }
    }

    console.log(`\n🎉 Done! Updated: ${updatedCount}, Skipped (already has slug): ${skippedCount}`);
}

main().catch(console.error);
