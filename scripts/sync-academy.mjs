import { copyFileSync } from "node:fs";
for (const file of ["curriculum.ts", "engine.ts"])
  copyFileSync(
    new URL("../src/academy/" + file, import.meta.url),
    new URL("../supabase/functions/academy-api/" + file, import.meta.url),
  );
console.log("Academy content and mastery policy synchronized.");
