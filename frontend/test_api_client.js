// Comprehensive Verification Suite for Frontend API Client & Edge Worker
import assert from "node:assert";

async function runTests() {
  console.log("============================================================");
  console.log("  FRONTEND API & EDGE WORKER VERIFICATION");
  console.log("============================================================\n");

  const api = await import("./src/services/api.js");
  const worker = (await import("./worker.js")).default;

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`[PASS] ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`[FAIL] ${name}:`, err);
        failed++;
      });
  }

  // --- SUITE 1: Browser Network Failure Immunity ---
  console.log("--- SUITE 1: Browser Network Error Immunity ---");

  const networkErrors = [
    { type: "Safari WebKit", msg: "Load failed", err: new TypeError("Load failed") },
    { type: "Chrome / Firefox", msg: "Failed to fetch", err: new TypeError("Failed to fetch") },
    { type: "Firefox CORS", msg: "Cross-Origin Request Blocked", err: new TypeError("Cross-Origin Request Blocked") },
    { type: "Chromium net::ERR", msg: "Failed to load resource", err: new TypeError("Failed to load resource: net::ERR_CONNECTION_REFUSED") },
    { type: "Node.js / Proxy", msg: "connect ECONNREFUSED", err: new Error("connect ECONNREFUSED 127.0.0.1:8000") },
    { type: "Network Timeout", msg: "AbortError", err: new DOMException("The operation was aborted", "AbortError") },
  ];

  for (const item of networkErrors) {
    await test(`Student Login on ${item.type} error ("${item.msg}")`, async () => {
      global.fetch = async () => { throw item.err; };
      const res = await api.loginStudent("IEC2023059", "student123");
      assert.strictEqual(res.status, "success");
      assert.strictEqual(res.student.roll, "IEC2023059");
      assert.strictEqual(res.student.name, "Tushar Garg");
    });

    await test(`Vendor Login on ${item.type} error ("${item.msg}")`, async () => {
      global.fetch = async () => { throw item.err; };
      const res = await api.loginVendor("vendor", "vendor123");
      assert.strictEqual(res.status, "success");
      assert.strictEqual(res.vendor.vendor_id, "vendor");
    });
  }

  // --- SUITE 2: Cloudflare & HTTP Gateway Failure Immunity ---
  console.log("\n--- SUITE 2: Cloudflare & HTTP Gateway Fallback ---");

  await test("Cloudflare Static Assets 405 Method Not Allowed HTML fallback", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 405,
      statusText: "Method Not Allowed",
      headers: { get: (h) => (h.toLowerCase() === "content-type" ? "text/html; charset=UTF-8" : null) },
      text: async () => "<!DOCTYPE html><html><body><h1>405 Method Not Allowed</h1></body></html>",
      json: async () => { throw new SyntaxError("Unexpected token '<'"); },
    });
    const res = await api.loginStudent("IEC2023037", "student123");
    assert.strictEqual(res.status, "success");
    assert.strictEqual(res.student.roll, "IEC2023037");
    assert.strictEqual(res.student.name, "Varun Karankar");
  });

  await test("CDN 404 Not Found fallback", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: { get: () => "text/html" },
      json: async () => { throw new SyntaxError("Unexpected token"); },
    });
    const res = await api.loginVendor("bh2_vendor", "vendor123");
    assert.strictEqual(res.status, "success");
    assert.strictEqual(res.vendor.vendor_id, "bh2_vendor");
  });

  await test("Backend Gateway 502 / 503 error fallback", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      headers: { get: () => "application/json" },
      json: async () => ({ detail: "Bad Gateway" }),
    });
    const res = await api.loginStudent("IEC2023058", "student123");
    assert.strictEqual(res.status, "success");
    assert.strictEqual(res.student.roll, "IEC2023058");
    assert.strictEqual(res.student.name, "Aadarsh Singh");
  });

  // --- SUITE 3: Credential Verification & Edge Rejections ---
  console.log("\n--- SUITE 3: Credential Verification & Rejections ---");

  await test("Live backend 401 Unauthorized correctly rejects bad credentials", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: async () => ({ detail: "Invalid Roll Number or Password" }),
    });
    let threw = false;
    try {
      await api.loginStudent("IEC2023059", "wrong_password");
    } catch (e) {
      threw = true;
      assert.strictEqual(e.message, "Invalid Roll Number or Password");
    }
    assert.strictEqual(threw, true);
  });

  await test("Offline fallback correctly rejects bad student password", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    let threw = false;
    try {
      await api.loginStudent("IEC2023059", "wrong_password");
    } catch (e) {
      threw = true;
      assert.strictEqual(e.message, "Invalid Roll Number or Password");
    }
    assert.strictEqual(threw, true);
  });

  await test("Offline fallback correctly rejects unknown roll number", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    let threw = false;
    try {
      await api.loginStudent("IEC2099999", "student123");
    } catch (e) {
      threw = true;
      assert.strictEqual(e.message, "Invalid Roll Number or Password");
    }
    assert.strictEqual(threw, true);
  });

  await test("Offline fallback all vendor roles (vendor, bh2_vendor, bh3_vendor, admin)", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const v1 = await api.loginVendor("vendor", "vendor123");
    assert.strictEqual(v1.vendor.name, "Central Mess Supervisor");
    const v2 = await api.loginVendor("bh2_vendor", "vendor123");
    assert.strictEqual(v2.vendor.name, "BH-2 Caterer & Manager");
    const v3 = await api.loginVendor("bh3_vendor", "vendor123");
    assert.strictEqual(v3.vendor.name, "BH-3 Dining Head");
    const v4 = await api.loginVendor("admin", "admin123");
    assert.strictEqual(v4.vendor.name, "Mess Warden / Admin");
  });

  await test("Offline fallback correctly rejects bad vendor credentials", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    let threw = false;
    try {
      await api.loginVendor("vendor", "wrongpass");
    } catch (e) {
      threw = true;
      assert.strictEqual(e.message, "Invalid Vendor ID or Password");
    }
    assert.strictEqual(threw, true);
  });

  // --- SUITE 4: Offline Client-Side Life Cycle ---
  console.log("\n--- SUITE 4: Offline Registration, Pass Generation, Turnstile Scans ---");

  await test("Student registration and subsequent login in client database", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const regRes = await api.registerStudent({
      roll: "IEC2023777",
      name: "Harsh Vardhan",
      hostel: "BH-2",
      password: "mypassword123",
      email: "iec2023777@iiita.ac.in",
    });
    assert.strictEqual(regRes.status, "success");
    assert.strictEqual(regRes.student.roll, "IEC2023777");

    const logRes = await api.loginStudent("IEC2023777", "mypassword123");
    assert.strictEqual(logRes.student.roll, "IEC2023777");
    assert.strictEqual(logRes.student.name, "Harsh Vardhan");
  });

  await test("Duplicate student registration rejection in client database", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    let threw = false;
    try {
      await api.registerStudent({
        roll: "IEC2023777",
        name: "Harsh Vardhan",
        hostel: "BH-2",
        password: "mypassword123",
      });
    } catch (e) {
      threw = true;
      assert.ok(e.message.includes("already registered"));
    }
    assert.strictEqual(threw, true);
  });

  await test("Generate meal pass offline", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const pass = await api.generateMealPass("IEC2023059", "Dinner");
    assert.strictEqual(pass.status, "success");
    assert.strictEqual(pass.pass_data.roll, "IEC2023059");
    assert.strictEqual(pass.pass_data.slot, "Dinner");
    assert.ok(pass.qr_string.includes("IEC2023059"));
  });

  await test("Turnstile scanning: APPROVED for valid student", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const pass = await api.generateMealPass("IEC2023012", "Breakfast");
    const scan = await api.scanMealPass(pass.qr_string, "Breakfast");
    assert.strictEqual(scan.status, "APPROVED");
    assert.strictEqual(scan.roll, "IEC2023012");
  });

  await test("Turnstile scanning: DUPLICATE blocked for repeated scan", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const pass = await api.generateMealPass("IEC2023012", "Breakfast");
    const scan2 = await api.scanMealPass(pass.qr_string, "Breakfast");
    assert.strictEqual(scan2.status, "DUPLICATE");
    assert.strictEqual(scan2.allowed, false);
  });

  await test("Turnstile scanning: DENIED for barred student (IEC2023999)", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const pass = await api.generateMealPass("IEC2023999", "Lunch");
    const scan = await api.scanMealPass(pass.qr_string, "Lunch");
    assert.strictEqual(scan.status, "DENIED");
    assert.strictEqual(scan.allowed, false);
    assert.ok(scan.reason.includes("NOT AUTHORIZED"));
  });

  await test("Dynamic toggle student allowed status", async () => {
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    const tog = await api.toggleStudentAllowed("IEC2023999", true);
    assert.strictEqual(tog.status, "success");
    assert.strictEqual(tog.updated.is_allowed, true);

    const pass = await api.generateMealPass("IEC2023999", "Dinner");
    const scan = await api.scanMealPass(pass.qr_string, "Dinner");
    assert.strictEqual(scan.status, "APPROVED");
    assert.strictEqual(scan.allowed, true);
  });

  // --- SUITE 5: Cloudflare Edge Worker (worker.js) Endpoints ---
  console.log("\n--- SUITE 5: Cloudflare Worker (worker.js) Edge API ---");

  async function mockWorkerRequest(method, pathname, body = null, headers = {}) {
    const req = new Request(`https://smart-mess.workers.dev${pathname}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : null,
    });
    const env = {
      ASSETS: {
        fetch: async (r) => new Response("Static Asset Content", { status: 200 }),
      },
    };
    return worker.fetch(req, env, {});
  }

  await test("Worker: OPTIONS /api/health preflight 204 with CORS", async () => {
    const res = await mockWorkerRequest("OPTIONS", "/api/health");
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  await test("Worker: GET /api/health (200 OK)", async () => {
    const res = await mockWorkerRequest("GET", "/api/health");
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "healthy");
    assert.ok(data.authors.length >= 3);
  });

  await test("Worker: POST /api/auth/student/login (200 OK on valid credentials)", async () => {
    const res = await mockWorkerRequest("POST", "/api/auth/student/login", {
      roll: "IEC2023059",
      password: "student123",
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "success");
    assert.strictEqual(data.student.roll, "IEC2023059");
    assert.strictEqual(data.student.name, "Tushar Garg");
  });

  await test("Worker: POST /api/auth/student/login (401 on bad password)", async () => {
    const res = await mockWorkerRequest("POST", "/api/auth/student/login", {
      roll: "IEC2023059",
      password: "wrong",
    });
    assert.strictEqual(res.status, 401);
  });

  await test("Worker: POST /api/auth/vendor/login (200 OK on valid vendor)", async () => {
    const res = await mockWorkerRequest("POST", "/api/auth/vendor/login", {
      vendor_id: "vendor",
      password: "vendor123",
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.vendor.vendor_id, "vendor");
  });

  await test("Worker: POST /api/forecast (200 OK math calculations)", async () => {
    const res = await mockWorkerRequest("POST", "/api/forecast", {
      slot: "dinner",
      academic_phase: "Normal",
      hostel: "BH-2",
      capacity: 300,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.expected_headcount > 100);
    assert.ok(data.cooking_strategy.initial_cook_batch > 0);
  });

  await test("Worker: POST /api/procurement (200 OK ingredient breakdown)", async () => {
    const res = await mockWorkerRequest("POST", "/api/procurement", {
      headcount: 220,
      slot: "dinner",
      hostel: "BH-2",
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.total_estimated_cost_inr > 0);
    assert.ok(data.procurement_list.length >= 7);
  });

  await test("Worker: Static asset fallback for /index.html", async () => {
    const res = await mockWorkerRequest("GET", "/index.html");
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "Static Asset Content");
  });

  console.log("\n============================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
