import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD || "strongpassword";

const sampleProfile = {
  age: 21,
  gender: "male",
  state: "Maharashtra",
  district: "Nagpur",
  caste: "OBC",
  annual_income: 120000,
  occupation: "student",
  disability_status: "no",
  farmer_status: "no",
  bpl_status: "yes",
  ration_card_type: "yellow",
  education_level: "undergraduate"
};

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message, error) {
  console.error(`FAIL ${message}`);
  if (error?.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(JSON.stringify(error.response.data, null, 2));
  } else if (error?.message) {
    console.error(error.message);
  }
  process.exitCode = 1;
}

async function testBackendHealth() {
  const response = await axios.get(`${API_BASE_URL}/`);
  if (!response.data.message) {
    throw new Error("Missing backend message");
  }
  pass("Backend health passed");
}

async function testSchemesApi() {
  const response = await axios.get(`${API_BASE_URL}/api/schemes`);
  const schemes = response.data.schemes || response.data;
  if (!Array.isArray(schemes)) {
    throw new Error("Schemes API should return an array or paginated schemes array");
  }

  if (schemes.length > 0) {
    const firstScheme = schemes[0];
    const detailResponse = await axios.get(`${API_BASE_URL}/api/schemes/${firstScheme.scheme_id}`);
    const detail = detailResponse.data.scheme || detailResponse.data;
    if (detail.scheme_id !== firstScheme.scheme_id) {
      throw new Error("Scheme detail endpoint returned the wrong scheme");
    }
  }

  try {
    await axios.get(`${API_BASE_URL}/api/schemes/not-a-real-scheme`);
    throw new Error("Missing scheme should return 404");
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  pass("Schemes API passed");
}

async function testRecommendationApi() {
  const response = await axios.post(`${API_BASE_URL}/api/recommend`, sampleProfile);
  const recommendations = response.data.recommendations || [];

  if (response.data.success !== true || recommendations.length === 0) {
    throw new Error("Recommendation API did not return recommendations");
  }

  for (let index = 1; index < recommendations.length; index += 1) {
    if (recommendations[index - 1].final_score < recommendations[index].final_score) {
      throw new Error("Recommendations are not sorted by final_score descending");
    }
  }

  pass("Recommendation API passed");
}

async function testRuleExtractionApi() {
  const response = await axios.post(`${API_BASE_URL}/api/extract-rules`, {
    text: "Applicant age should be between 18 and 60 years."
  });

  const rules = response.data.rules || [];
  if (!rules.some((rule) => rule.attribute === "age" && rule.operator === ">=" && rule.value === 18)) {
    throw new Error("Age minimum rule not extracted");
  }

  pass("Rule extraction API passed");
}

async function testAnalyticsApi() {
  const token = await getAdminToken();
  if (!token) {
    pass("Analytics API skipped because MongoDB/admin auth is unavailable");
    return;
  }

  const response = await axios.get(`${API_BASE_URL}/api/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.data.success !== true || !response.data.summary) {
    throw new Error("Analytics dashboard response is invalid");
  }

  pass("Analytics API passed");
}

async function testAdminAuthApi() {
  const token = await getAdminToken();
  if (!token) {
    pass("Admin auth API skipped because MongoDB is unavailable");
    return;
  }

  const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.data.success !== true || !response.data.admin) {
    throw new Error("Admin auth /me response is invalid");
  }

  pass("Admin auth API passed");
}

async function testAdminApi() {
  const token = await getAdminToken();
  if (!token) {
    pass("Admin API skipped because MongoDB/admin auth is unavailable");
    return;
  }

  const response = await axios.post(`${API_BASE_URL}/api/admin/schemes`, {
    scheme_name: `Test Education Scheme ${Date.now()}`,
    category: "Education",
    benefits: "Financial support for students",
    eligibility: "Students with income below 2 lakh are eligible.",
    required_documents: ["Aadhaar", "Income Certificate"],
    application_url: "https://example.com",
    source_urls: ["https://example.com"],
    tags: ["student", "education"],
    eligibility_rules_extracted: [
      {
        attribute: "annual_income",
        operator: "<=",
        value: 200000
      }
    ]
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.data.success !== true) {
    throw new Error("Admin add scheme did not return success true");
  }

  pass("Admin add scheme API passed");
}

async function testImportApi() {
  const token = await getAdminToken();
  if (!token) {
    pass("Import API skipped because MongoDB/admin auth is unavailable");
    return;
  }

  const response = await axios.post(`${API_BASE_URL}/api/import/schemes/json`, {
    records: [
      {
        scheme_id: `test-import-${Date.now()}`,
        scheme_name: "Imported Test Scheme",
        category: "Education",
        benefits: "Test benefit",
        eligibility: "Students are eligible.",
        status: "active"
      }
    ]
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.data.success !== true || !response.data.job) {
    throw new Error("Import API did not create an import job");
  }

  pass("Import API passed");
}

async function testOcrErrorCases() {
  try {
    await axios.post(`${API_BASE_URL}/api/ocr/verify-document`, {});
    throw new Error("OCR endpoint should reject missing file");
  } catch (error) {
    if (error.response?.status !== 400) {
      throw error;
    }
  }

  pass("OCR basic error case passed");
}

async function getAdminToken() {
  try {
    const login = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
      email: adminEmail,
      password: adminPassword
    });
    return login.data.token;
  } catch (loginError) {
    if (loginError.response?.status === 503) {
      return null;
    }
  }

  try {
    const register = await axios.post(`${API_BASE_URL}/api/auth/admin/register`, {
      name: "Test Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    });
    return register.data.token;
  } catch (registerError) {
    if (registerError.response?.status === 503) {
      return null;
    }
    throw registerError;
  }
}

async function run() {
  const tests = [
    ["Backend health", testBackendHealth],
    ["Schemes API", testSchemesApi],
    ["Recommendation API", testRecommendationApi],
    ["Rule extraction API", testRuleExtractionApi],
    ["Admin auth API", testAdminAuthApi],
    ["Analytics API", testAnalyticsApi],
    ["Admin API", testAdminApi],
    ["Import API", testImportApi],
    ["OCR error cases", testOcrErrorCases]
  ];

  for (const [name, test] of tests) {
    try {
      await test();
    } catch (error) {
      fail(`${name} failed`, error);
    }
  }

  console.log("SKIP OCR success upload test skipped because it needs an image file upload");
}

run();
