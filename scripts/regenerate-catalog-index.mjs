/**
 * regenerate-catalog-index.mjs
 * Scans the actual disk structure and rebuilds localCatalogIndex.json
 * to match the new flat structure with proper subcategories.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const CATALOG_ROOT = path.resolve("site/public/assets/catalog");
const OUTPUT_FILE = path.resolve("site/features/site/data/localCatalogIndex.json");

const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function generateId(name) {
  return createHash("md5").update(name).digest("hex").slice(0, 8) +
    "-" + createHash("md5").update(name + "salt").digest("hex").slice(0, 4) +
    "-" + createHash("md5").update(name + "salt2").digest("hex").slice(0, 4) +
    "-" + createHash("md5").update(name + "salt3").digest("hex").slice(0, 4) +
    "-" + createHash("md5").update(name + "salt4").digest("hex").slice(0, 12);
}

async function walk(dir, acc = []) {
  let ents;
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

async function main() {
  console.log("Scanning catalog structure...");
  
  const index = [];
  const families = await fs.readdir(CATALOG_ROOT);
  
  for (const family of families) {
    const familyPath = path.join(CATALOG_ROOT, family);
    const stat = await fs.stat(familyPath);
    if (!stat.isDirectory()) continue;
    
    const subdirs = await fs.readdir(familyPath);

    // If no subdir contains images directly, they're subcategories (e.g. seating/cafe, seating/mesh)
    const subdirHasImages = await Promise.all(subdirs.map(async d => {
      try {
        const entries = await fs.readdir(path.join(familyPath, d));
        return entries.some(e => IMAGE_EXT.has(path.extname(e).toLowerCase()));
      } catch { return false; }
    }));
    const isSubcategorized = subdirs.length > 0 && !subdirHasImages.some(Boolean);

    if (isSubcategorized) {
      // Process each subcategory (e.g. seating/cafe, seating/mesh)
      for (const subcat of subdirs) {
        const subcatPath = path.join(familyPath, subcat);
        try {
          const subcatStat = await fs.stat(subcatPath);
          if (!subcatStat.isDirectory()) continue;

          const productFolders = await fs.readdir(subcatPath);
          for (const productFolder of productFolders) {
            const productPath = path.join(subcatPath, productFolder);
            try {
              const productStat = await fs.stat(productPath);
              if (!productStat.isDirectory()) continue;
              
              const images = await walk(productPath);
              if (images.length === 0) continue;
              
              // Extract product name from folder name
              const name = productFolder
                .replace(/^oando-[a-z-]+--/, "")
                .replace(/-/g, " ")
                .replace(/\b\w/g, c => c.toUpperCase());
              
              const slug = productFolder;
              const categoryId = `oando-${family}`;
              
              const imagePaths = images.map(img => {
                const relative = path.relative(CATALOG_ROOT, img);
                return `/assets/catalog/${relative.replace(/\\/g, "/")}`;
              });
              
              index.push({
                id: generateId(slug),
                slug,
                category_id: categoryId,
                name,
                images: imagePaths,
                flagship_image: imagePaths[0]
              });
              
              console.log(`  ${family}/${subcat}/${productFolder}: ${images.length} images`);
            } catch (err) {
              console.error(`  Error processing ${productPath}: ${err.message}`);
            }
          }
        } catch (err) {
          console.error(`  Error processing ${subcatPath}: ${err.message}`);
        }
      }
    } else {
      // Flat family structure (workstations, tables, etc.)
      const productFolders = await fs.readdir(familyPath);
      for (const productFolder of productFolders) {
        const productPath = path.join(familyPath, productFolder);
        try {
          const productStat = await fs.stat(productPath);
          if (!productStat.isDirectory()) continue;
          
          const images = await walk(productPath);
          if (images.length === 0) continue;
          
          const name = productFolder
            .replace(/^oando-[a-z-]+--/, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
          
          const slug = productFolder;
          const categoryId = `oando-${family}`;
          
          const imagePaths = images.map(img => {
            const relative = path.relative(CATALOG_ROOT, img);
            return `/assets/catalog/${relative.replace(/\\/g, "/")}`;
          });
          
          index.push({
            id: generateId(slug),
            slug,
            category_id: categoryId,
            name,
            images: imagePaths,
            flagship_image: imagePaths[0]
          });
          
          console.log(`  ${family}/${productFolder}: ${images.length} images`);
        } catch (err) {
          console.error(`  Error processing ${productPath}: ${err.message}`);
        }
      }
    }
  }
  
  console.log(`\nGenerated ${index.length} catalog entries`);
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Wrote ${OUTPUT_FILE}`);
}

main().catch(console.error);
