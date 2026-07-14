#!/usr/bin/env node
/**
 * Scaffold a new admin *-management module.
 *
 * Usage:
 *   npm run scaffold:admin -- support-management
 *   npm run scaffold:admin -- activity-log-management
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const rawName = process.argv[2];

if (!rawName) {
  console.error("Usage: npm run scaffold:admin -- <module-name>");
  console.error("Example: npm run scaffold:admin -- support-management");
  process.exit(1);
}

const kebab = rawName.replace(/_/g, "-").toLowerCase();
const pascal = kebab
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
const prefix = `admin-${kebab.replace(/-management$/, "")}-management`;
const typeFile = `${prefix}.types.ts`;
const mockFile = `${prefix}.mock.ts`;
const serviceFile = `${prefix}.service.ts`;
const componentDir = join("src/components/admin", kebab);

const files = [
  {
    path: join("src/types", typeFile),
    content: `export interface ${pascal}Item {
  id: string;
  title: string;
}

export interface ${pascal}Data {
  items: ${pascal}Item[];
  pageSize: number;
}
`,
  },
  {
    path: join("src/data/mock", mockFile),
    content: `import type { ${pascal}Data } from "@/types/${prefix.replace(".types", "")}";

export function get${pascal}(): ${pascal}Data {
  return {
    pageSize: 10,
    items: [{ id: "item-1", title: "Sample ${pascal} item" }],
  };
}
`,
  },
  {
    path: join("src/services/admin", serviceFile),
    content: `import { resolve${pascal} } from "@/data/mock/admin-data.resolvers";
import type { ${pascal}Data } from "@/types/${prefix.replace(".types", "")}";
import { fetchAdminData } from "./create-admin-service";

export const ${camel}Service = {
  async getItems(): Promise<${pascal}Data> {
    return fetchAdminData(() => resolve${pascal}());
  },
};
`,
  },
  {
    path: join(componentDir, `admin-${kebab}-page.tsx`),
    content: `"use client";

import type { ${pascal}Data } from "@/types/${prefix.replace(".types", "")}";

export function Admin${pascal}Page({ data }: { data: ${pascal}Data }) {
  return (
    <div className="rounded-2xl border border-[#ebe8e6] bg-white p-6">
      <h1 className="text-2xl font-bold">${pascal}</h1>
      <p className="mt-2 text-sm text-[#757575]">{data.items.length} records loaded.</p>
    </div>
  );
}
`,
  },
  {
    path: join(componentDir, "index.ts"),
    content: `export { Admin${pascal}Page } from "./admin-${kebab}-page";\n`,
  },
  {
    path: join("src/app/(dashboard)/admin", kebab.replace("-management", ""), "page.tsx"),
    content: `import { Admin${pascal}Page } from "@/components/admin/${kebab}";
import { ${camel}Service } from "@/services/admin/${serviceFile.replace(".service.ts", ".service")}";

export const metadata = { title: "${pascal}" };

export default async function Page() {
  const data = await ${camel}Service.getItems();
  return <Admin${pascal}Page data={data} />;
}
`,
  },
];

for (const file of files) {
  if (existsSync(file.path)) {
    console.warn(`skip (exists): ${file.path}`);
    continue;
  }
  mkdirSync(join(file.path, ".."), { recursive: true });
  writeFileSync(file.path, file.content);
  console.log(`created: ${file.path}`);
}

console.log("\nNext steps:");
console.log(`1. Add resolver resolve${pascal}() in src/data/mock/admin-data.resolvers.ts`);
console.log(`2. Export service in src/services/admin/index.ts`);
console.log(`3. Add route in src/constants/routes.ts and src/config/navigation.config.ts`);
