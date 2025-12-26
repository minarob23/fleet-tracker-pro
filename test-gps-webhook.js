#!/usr/bin/env node

/**
 * GPS Webhook Test Script
 * 
 * This script simulates GPS device updates to test the webhook integration.
 * 
 * Usage:
 *   node test-gps-webhook.js
 */

const API_URL = 'http://localhost:3001/api/gps/webhook';

// Test GPS coordinates for Moroccan cities
const LOCATIONS = {
    casablanca: { lat: 33.5731, lng: -7.5898, name: 'Casablanca (Start)' },
    marrakech: { lat: 31.6295, lng: -7.9811, name: 'Marrakech' },
    agadir: { lat: 30.4278, lng: -9.5981, name: 'Agadir' },
    laayoune_approach: { lat: 27.5, lng: -13.0, name: 'Approaching Laayoune' },
    laayoune_city: { lat: 27.1536, lng: -13.2033, name: 'Laayoune City Center' },
    laayoune_warehouse: { lat: 27.1500, lng: -13.2000, name: 'Laayoune Warehouse' },
    dakhla: { lat: 23.7185, lng: -15.9582, name: 'Dakhla' },
    smara: { lat: 26.7386, lng: -11.6719, name: 'Smara' },
    guelmim: { lat: 28.9870, lng: -10.0574, name: 'Guelmim' },
};

async function sendGPSUpdate(deviceId, location, speed) {
    const payload = {
        device_id: deviceId,
        latitude: location.lat,
        longitude: location.lng,
        speed: speed,
        timestamp: new Date().toISOString()
    };

    console.log(`\n📡 Sending GPS update for ${deviceId}:`);
    console.log(`   Location: ${location.name}`);
    console.log(`   Coordinates: ${location.lat}, ${location.lng}`);
    console.log(`   Speed: ${speed} km/h`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`   ✅ Success: ${result.message}`);
        } else {
            console.log(`   ❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('🚛 GPS Webhook Test Script');
    console.log('==========================\n');
    console.log(`Testing endpoint: ${API_URL}\n`);

    // Test 1: Single truck journey to Laayoune
    console.log('\n📋 Test 1: Complete Journey Simulation (GPS001 → Laayoune)');
    console.log('─'.repeat(60));

    await sendGPSUpdate('GPS001', LOCATIONS.casablanca, 0);
    await sleep(2000);

    await sendGPSUpdate('GPS001', LOCATIONS.marrakech, 90);
    await sleep(2000);

    await sendGPSUpdate('GPS001', LOCATIONS.agadir, 85);
    await sleep(2000);

    await sendGPSUpdate('GPS001', LOCATIONS.laayoune_approach, 75);
    await sleep(2000);

    await sendGPSUpdate('GPS001', LOCATIONS.laayoune_city, 40);
    console.log('   🎯 Truck should now be in "Arrivé" status');
    await sleep(2000);

    await sendGPSUpdate('GPS001', LOCATIONS.laayoune_warehouse, 5);
    console.log('   🎯 Truck should now be in "Dépôt" status');

    // Test 2: Multiple trucks to different cities
    console.log('\n\n📋 Test 2: Multiple Trucks to Different Cities');
    console.log('─'.repeat(60));

    await sendGPSUpdate('GPS002', LOCATIONS.dakhla, 60);
    await sleep(1000);

    await sendGPSUpdate('GPS003', LOCATIONS.smara, 70);
    await sleep(1000);

    await sendGPSUpdate('GPS004', LOCATIONS.guelmim, 55);

    console.log('\n\n✅ All tests completed!');
    console.log('\n📊 Next steps:');
    console.log('   1. Check backend console for geofence detection messages');
    console.log('   2. Check database: SELECT * FROM gps_locations ORDER BY created_at DESC;');
    console.log('   3. Check frontend map for updated truck positions');
    console.log('   4. Verify WhatsApp notifications in logs\n');
}

// Run tests
runTests().catch(console.error);
