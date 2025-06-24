// Quick debug script to test paths data parsing

// Sample test data that might come from ESP32
const testSerialData = [
  '{"ultrasonic": 25.5, "heading": 45, "velocity": 2.3, "positionX": 10.5, "positionY": 15.2}',
  '{"ultrasonic": 30.0, "heading": 47, "position": {"positionX": 11.1, "positionY": 15.8}, "velocity": 2.5}',
  '{"ultrasonic": 28.3, "heading": 50, "x": 12.0, "y": 16.5, "speed": 2.8}',
  '{"ultrasonic": 32.1, "heading": 52, "velocity": 3.0}', // No position data - should not create path entry
];

// Test parsing logic
testSerialData.forEach((serialData, index) => {
  console.log(`\n=== Test ${index + 1} ===`);
  console.log('Input:', serialData);

  try {
    const data = JSON.parse(serialData);
    console.log('Parsed data:', data);

    // Check conditions for paths
    const hasNestedPosition =
      data.position &&
      (data.position.positionX !== undefined ||
        data.position.positionY !== undefined);
    const hasFlatPosition =
      data.positionX !== undefined || data.positionY !== undefined;
    const hasAltPosition = data.x !== undefined || data.y !== undefined;
    const hasMovement =
      data.heading !== undefined &&
      (data.speed !== undefined || data.velocity !== undefined);

    console.log('Conditions:', {
      hasNestedPosition,
      hasFlatPosition,
      hasAltPosition,
      hasMovement,
    });

    const shouldCreatePath =
      hasNestedPosition ||
      hasFlatPosition ||
      hasAltPosition ||
      data.position !== undefined ||
      hasMovement;
    console.log('Should create path entry:', shouldCreatePath);

    if (shouldCreatePath) {
      // Handle different position formats
      let positionData = { positionX: 0, positionY: 0 };

      if (data.position && typeof data.position === 'object') {
        positionData = {
          positionX: data.position.positionX || data.position.x || 0,
          positionY: data.position.positionY || data.position.y || 0,
        };
      } else if (data.positionX !== undefined || data.positionY !== undefined) {
        positionData = {
          positionX: data.positionX || 0,
          positionY: data.positionY || 0,
        };
      } else if (data.x !== undefined || data.y !== undefined) {
        positionData = {
          positionX: data.x || 0,
          positionY: data.y || 0,
        };
      }

      const pathEntry = {
        timestamp: new Date().toISOString(),
        position: positionData,
        speed: data.speed || data.velocity || 0,
        velocity: data.velocity,
        heading: data.heading,
        direction: data.direction,
        distanceTraveled: data.distanceTraveled,
        ultrasonic: data.ultrasonic,
      };

      console.log('Generated path entry:', pathEntry);
    }
  } catch (error) {
    console.log('Parse error:', error.message);
  }
});

console.log('\n=== Conclusion ===');
console.log('If you see path entries generated above, the logic is working.');
console.log(
  'If no path entries appear, check if ESP32 is sending position data in any of these formats:',
);
console.log('1. {"position": {"positionX": 10, "positionY": 20}}');
console.log('2. {"positionX": 10, "positionY": 20}');
console.log('3. {"x": 10, "y": 20}');
console.log(
  '4. At minimum: {"heading": 45, "velocity": 2.3} (for movement tracking)',
);
