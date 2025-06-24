// Instruksi untuk debugging masalah paths tidak terbentuk
//
// 1. BUKA BROWSER DAN GO TO MONITORING PAGE
// 2. BUKA DEVELOPER TOOLS (F12)
// 3. GO TO CONSOLE TAB
// 4. START MONITORING
// 5. PASTE DAN RUN SCRIPT BERIKUT DI CONSOLE:

// Test data untuk inject ke monitoring system
const testPathData = [
  {
    ultrasonic: 25.5,
    heading: 45,
    velocity: 2.3,
    positionX: 10.5,
    positionY: 15.2,
  },
  {
    ultrasonic: 30.0,
    heading: 47,
    position: { positionX: 11.1, positionY: 15.8 },
    velocity: 2.5,
  },
  { ultrasonic: 28.3, heading: 50, x: 12.0, y: 16.5, speed: 2.8 },
];

console.log('🧪 [MANUAL TEST] Injecting test path data...');

// Simulate serial data processing
testPathData.forEach((data, index) => {
  console.log(`🧪 [TEST ${index + 1}] Injecting:`, data);

  // Trigger the parsing by creating a custom event
  // This simulates serial data coming in
  window.dispatchEvent(
    new CustomEvent('test-serial-data', {
      detail: JSON.stringify(data),
    }),
  );
});

console.log(
  '🧪 [MANUAL TEST] Test data injected. Check if path entries appear in console.',
);
console.log('🧪 [MANUAL TEST] Look for logs: "📊 [DEBUG] Adding path entry:"');
console.log(
  '🧪 [MANUAL TEST] When you STOP monitoring, check if paths JSON file is created.',
);

// Alternative: Direct injection if the component has exposed methods
console.log(
  '🧪 [MANUAL TEST] Alternative: If you see parseSerialDataToReports function available,',
);
console.log(
  '🧪 [MANUAL TEST] you can call it directly with: parseSerialDataToReports(JSON.stringify(testData))',
);
