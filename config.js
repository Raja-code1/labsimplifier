// LabSimplifier — Authorised user hashes
// =============================================================================
// This file stores the SHA-256 hashes of registered / authorised GITAM student IDs.
// Any team member can add a new registration ID by computing its SHA-256 hash
// (lowercase hexadecimal string) and appending it to the AUTHORISED_IDS array below.
//
// How to add a new ID without modifying any app logic:
// 1. Take the student's 10-11 digit GITAM registration ID, e.g. "1234567890"
// 2. Compute its SHA-256 hash using terminal or online tool:
//    - Windows PowerShell:
//      [BitConverter]::ToString((New-Object Security.Cryptography.SHA256Managed).ComputeHash([Text.Encoding]::UTF8.GetBytes("1234567890"))).Replace("-","").ToLower()
//    - Node.js:
//      require('crypto').createHash('sha256').update('1234567890').digest('hex')
// 3. Paste the resulting 64-character hex string into the AUTHORISED_IDS array below.
// 4. Save this file and reload the application.
// =============================================================================

const AUTHORISED_IDS = [
  // Team Member 1
  "98b2652a25b8f921a01c3256feade0a9f571deb29ad3d2e7784c0552b9b38e60",

  // Team Member 2
  "f4f58ca60d3224150a9df80650a97336f3d3b7df9448241e961a524921377d1b",

  // Team Member 3
  "bc4897afb4e0d85adb91eb47b21c827f1755a7492921a904f2c749214d37af15",

  // Team Member 4
  "b8db508700787b0a7df9caa7df013a3fc5a9c2bae207a9f7fe19d17a45779ac7",

  // Test / Demo ID 1: "1234567890" (for immediate testing and grading)
  "c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646",

  // Test / Demo ID 2: "12345678901" (11-digit demo ID)
  "254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4"
];

// Ensure accessibility across browser execution contexts
if (typeof window !== "undefined") {
  window.AUTHORISED_IDS = AUTHORISED_IDS;
}
