import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it("authenticates with the configured service role key", async () => {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url, "SUPABASE_URL must be configured").toBeTruthy();
    expect(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.ok, await response.text()).toBe(true);
  });
});
