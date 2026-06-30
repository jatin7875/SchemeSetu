import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const uniqueEmail = process.env.TEST_AUTH_EMAIL || `admin-${Date.now()}@schemesetu.test`;
const password = process.env.TEST_AUTH_PASSWORD || "Admin@12345";

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message, error) {
  console.error(`❌ ${message}`);
  if (error?.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error?.message || error);
  }
  process.exitCode = 1;
}

async function testHealth() {
  const response = await axios.get(`${API_BASE_URL}/`);
  if (!response.data.message) {
    throw new Error("Backend health response missing message");
  }
  pass("Backend health passed");
}

async function testRegister() {
  const response = await axios.post(`${API_BASE_URL}/api/auth/admin/register`, {
    name: "Jatin Admin",
    email: uniqueEmail,
    password
  });

  if (response.data.success !== true || !response.data.token || !response.data.admin?.id) {
    throw new Error("Register response missing token/admin");
  }

  pass("Admin register passed");
  return response.data.token;
}

async function testLogin() {
  const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
    email: uniqueEmail,
    password
  });

  if (response.data.success !== true || !response.data.token) {
    throw new Error("Login response missing token");
  }

  pass("Admin login passed");
  return response.data.token;
}

async function testMe(token) {
  const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.data.success !== true || response.data.admin?.email !== uniqueEmail) {
    throw new Error("Auth me response is invalid");
  }

  pass("Auth me passed");
}

async function testInvalidLogin() {
  try {
    await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
      email: uniqueEmail,
      password: "wrong-password"
    });
    throw new Error("Invalid login should fail");
  } catch (error) {
    if (error.response?.status !== 401 || error.response?.data?.message !== "Invalid email or password") {
      throw error;
    }
  }

  pass("Invalid login handled correctly");
}

async function run() {
  try {
    await testHealth();
    await testRegister();
    const token = await testLogin();
    await testMe(token);
    await testInvalidLogin();
  } catch (error) {
    if (error.response?.status === 503) {
      fail("Authentication service unavailable. Check MONGO_URI, MongoDB Atlas IP access, username/password, and password URL encoding.", error);
      return;
    }
    fail("Auth test failed", error);
  }
}

run();
