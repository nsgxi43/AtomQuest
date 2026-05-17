const bcrypt = require("bcryptjs");

async function generateHashes() {
  const hash = await bcrypt.hash("password123", 10);
  console.log(hash);
}

generateHashes();
