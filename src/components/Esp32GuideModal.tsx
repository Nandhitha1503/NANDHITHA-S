import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Copy, 
  Check, 
  Terminal, 
  Send, 
  Radio, 
  Code, 
  Zap, 
  Globe,
  Navigation,
  Battery,
  Compass,
  Thermometer
} from 'lucide-react';

interface Esp32GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTestPacket: (data: any) => Promise<void>;
}

export const Esp32GuideModal: React.FC<Esp32GuideModalProps> = ({
  isOpen,
  onClose,
  onSendTestPacket,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'code' | 'wiring' | 'tester' | 'publish'>('quick');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Interactive tester form state
  const [testTemp, setTestTemp] = useState('4.2');
  const [testHumidity, setTestHumidity] = useState('54.0');
  const [testTilt, setTestTilt] = useState('4.5');
  const [testGForce, setTestGForce] = useState('1.02');
  const [testShock, setTestShock] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.run.app';
  const apiEndpoint = `${currentHost}/api/telemetry`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleJsonPayload = `{
  "temperature": 4.5,
  "humidity": 55.2,
  "latitude": 37.6213,
  "longitude": -122.3790,
  "speedKmh": 64.0,
  "shockDetected": false,
  "gForce": 1.05,
  "tiltAngle": 6.2,
  "pitch": 4.1,
  "roll": 4.7,
  "batteryLevel": 91,
  "source": "esp32"
}`;

  const sampleCurl = `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '${sampleJsonPayload}'`;

  const arduinoCode = `/*
  Smart Organ Transportation Monitoring System
  ESP32 Firmware + MPU6050 (I2C) + DHT22/DS18B20 + NEO-6M GPS
  Transmits real-time cold-chain telemetry via REST API
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

// ================= USER CONFIGURATION ================= //
const char* WIFI_SSID     = "YOUR_WIFI_NETWORK";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Configure your backend API endpoint here:
const char* API_URL       = "${apiEndpoint}";

// Pin Definitions
#define DHTPIN 4           // DHT22 Data Pin
#define DHTTYPE DHT22
#define SDA_PIN 21         // MPU6050 I2C Data
#define SCL_PIN 22         // MPU6050 I2C Clock
// ====================================================== //

Adafruit_MPU6050 mpu;
DHT dht(DHTPIN, DHTTYPE);

// Fallback GPS coordinates
float currentLat = 37.6213;
float currentLng = -122.3790;
int batteryPct = 94;

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  dht.begin();

  Serial.println("\\n--- Smart Organ Transit Initializing ---");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected! IP: " + WiFi.localIP().toString());

  // Initialize MPU6050 (6-axis gyro & accelerometer)
  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("Warning: MPU6050 not detected at 0x68. Check SDA/SCL wiring.");
  } else {
    Serial.println("MPU6050 initialized successfully.");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting WiFi...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  // 1. Read Temperature & Humidity from DHT22
  float tempC = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(tempC) || isnan(humidity)) {
    Serial.println("Error: Failed to read from DHT sensor!");
    tempC = 4.3; // fallback safe reading
    humidity = 55.0;
  }

  // 2. Read MPU6050 Accelerometer & Gyroscope
  sensors_event_t a, g, temp_mpu;
  mpu.getEvent(&a, &g, &temp_mpu);

  // Normalize Acceleration in Gs (1G = 9.80665 m/s^2)
  float ax_g = a.acceleration.x / 9.80665;
  float ay_g = a.acceleration.y / 9.80665;
  float az_g = a.acceleration.z / 9.80665;
  float totalGForce = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);

  // Compute Pitch & Roll in degrees
  float pitch = atan2(-ax_g, sqrt(ay_g * ay_g + az_g * az_g)) * 180.0 / PI;
  float roll  = atan2(ay_g, az_g) * 180.0 / PI;
  float tiltAngle = sqrt(pitch * pitch + roll * roll);

  // Shock threshold: > 1.8G mechanical impact
  bool shockDetected = (totalGForce >= 1.8);

  // 3. Assemble JSON Payload
  String payload = "{";
  payload += "\\"temperature\\":" + String(tempC, 2) + ",";
  payload += "\\"humidity\\":" + String(humidity, 1) + ",";
  payload += "\\"latitude\\":" + String(currentLat, 5) + ",";
  payload += "\\"longitude\\":" + String(currentLng, 5) + ",";
  payload += "\\"shockDetected\\":" + String(shockDetected ? "true" : "false") + ",";
  payload += "\\"gForce\\":" + String(totalGForce, 2) + ",";
  payload += "\\"tiltAngle\\":" + String(tiltAngle, 1) + ",";
  payload += "\\"pitch\\":" + String(pitch, 1) + ",";
  payload += "\\"roll\\":" + String(roll, 1) + ",";
  payload += "\\"batteryLevel\\":" + String(batteryPct) + ",";
  payload += "\\"rssi\\":" + String(WiFi.RSSI()) + ",";
  payload += "\\"source\\":\\"esp32\\"";
  payload += "}";

  // 4. Send HTTP POST to Backend
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("Telemetry Sent! HTTP %d | Temp: %.1fC | Tilt: %.1f deg | G: %.2f\\n", 
                  httpCode, tempC, tiltAngle, totalGForce);
  } else {
    Serial.printf("HTTP POST failed, error: %s\\n", http.errorToString(httpCode).c_str());
  }
  http.end();

  // Transmit telemetry every 4 seconds
  delay(4000);
}`;

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const g = parseFloat(testGForce) || 1.02;
      const tilt = parseFloat(testTilt) || 4.5;
      await onSendTestPacket({
        temperature: parseFloat(testTemp) || 4.2,
        humidity: parseFloat(testHumidity) || 54.0,
        tiltAngle: tilt,
        pitch: +(tilt * 0.6).toFixed(1),
        roll: +(tilt * 0.8).toFixed(1),
        gForce: g,
        shockDetected: testShock || g >= 1.8,
        source: 'esp32',
        isLiveEsp32: true,
      });
      setTestResult('Success! Payload accepted by /api/telemetry. Dashboard is now in LIVE mode.');
    } catch (err: any) {
      setTestResult(`Error: ${err.message || 'Failed to send'}`);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">ESP32 REST API & Integration Hub</h2>
              <p className="text-xs text-slate-400">Connect real hardware sensors or test via HTTP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Endpoint & Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tester' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Live REST Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'code' ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Arduino ESP32 Sketch</span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wiring' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Wiring Diagram</span>
          </button>

          <button
            onClick={() => setActiveTab('publish')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'publish' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Run & Publish Guide</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-300">

          {/* TAB 1: QUICK ENDPOINT & SCHEMA */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">POST</span>
                    Backend Ingestion Endpoint URL:
                  </span>
                  <button
                    onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] cursor-pointer"
                  >
                    {copiedText === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'endpoint' ? 'Copied URL!' : 'Copy URL'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-cyan-300 select-all break-all border border-slate-800 text-xs">
                  {apiEndpoint}
                </div>
                <p className="text-[11px] text-slate-400">
                  Configure this exact URL inside your ESP32 Arduino code in the <code className="text-amber-300">API_URL</code> constant.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    Test Terminal cURL Command
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleCurl, 'curl')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] cursor-pointer"
                  >
                    {copiedText === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-3 rounded-lg font-mono text-slate-300 overflow-x-auto text-[11px] border border-slate-800">
                  {sampleCurl}
                </pre>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 font-semibold text-white border-b border-slate-800">
                  Telemetry JSON Schema Fields
                </div>
                <div className="divide-y divide-slate-800 bg-slate-900/50 text-[11px]">
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">temperature (float)</span>
                    <span className="text-rose-400">Required</span>
                    <span className="text-slate-400">Chamber temp in °C. Safe range is 2.0°C – 8.0°C.</span>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">humidity (float)</span>
                    <span className="text-rose-400">Required</span>
                    <span className="text-slate-400">Relative humidity % (e.g. 54.0).</span>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">tiltAngle (float)</span>
                    <span className="text-amber-400">Recommended</span>
                    <span className="text-slate-400">Degrees tilt from level. Triggers alarm if &gt; 30.0°.</span>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">gForce / shockDetected</span>
                    <span className="text-amber-400">Recommended</span>
                    <span className="text-slate-400">Accelerometer impact. Triggers alarm if &gt; 1.8G.</span>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">latitude / longitude</span>
                    <span className="text-slate-400">Optional</span>
                    <span className="text-slate-400">GPS position from NEO-6M module for live map tracking.</span>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <span className="font-mono text-cyan-300">source (string)</span>
                    <span className="text-slate-400">Optional</span>
                    <span className="text-slate-400">Set to "esp32" to switch UI to Live Connected mode.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE REST TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/80 rounded-xl text-cyan-200">
                <span className="font-bold">Interactive Webhook Simulator: </span>
                Send a custom payload right from this browser to verify that the backend REST endpoint <code className="font-mono">/api/telemetry</code> receives data and updates the live dashboard!
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Temperature (°C) [Safe: 2-8°C]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testTemp}
                    onChange={(e) => setTestTemp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Humidity (%) [Safe: 40-70%]</label>
                  <input
                    type="number"
                    step="0.5"
                    value={testHumidity}
                    onChange={(e) => setTestHumidity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tilt Angle (°) [Alarm: &gt; 30°]</label>
                  <input
                    type="number"
                    step="1"
                    value={testTilt}
                    onChange={(e) => setTestTilt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">G-Force (G) [Alarm: &gt; 1.8G]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={testGForce}
                    onChange={(e) => setTestGForce(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="shockCheck"
                    checked={testShock}
                    onChange={(e) => setTestShock(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-rose-500 cursor-pointer"
                  />
                  <label htmlFor="shockCheck" className="text-xs text-slate-300 cursor-pointer font-medium">
                    Trigger Mechanical Shock Event (<code className="text-rose-400">shockDetected: true</code>)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleSendTest}
                  disabled={testSending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{testSending ? 'Sending to /api/telemetry...' : 'Send Live Test Telemetry'}</span>
                </button>

                {testResult && (
                  <span className={`text-xs font-medium ${testResult.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {testResult}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE ARDUINO ESP32 SKETCH */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-300">
                  Ready-to-flash Arduino C++ Code for ESP32 with MPU6050 + DHT22.
                </p>
                <button
                  onClick={() => copyToClipboard(arduinoCode, 'arduino')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-800 transition flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  {copiedText === 'arduino' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'arduino' ? 'Copied Code!' : 'Copy Entire Sketch'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                  {arduinoCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: WIRING DIAGRAM */}
          {activeTab === 'wiring' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">ESP32 Hardware Pin Connections</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-purple-400 mb-2 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>MPU6050 (Tilt & Shock)</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>• VCC → ESP32 3.3V</li>
                    <li>• GND → ESP32 GND</li>
                    <li>• <strong className="text-cyan-400">SDA</strong> → ESP32 <strong className="text-white">GPIO 21</strong></li>
                    <li>• <strong className="text-cyan-400">SCL</strong> → ESP32 <strong className="text-white">GPIO 22</strong></li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4" />
                    <span>DHT22 / DS18B20 (Temp & Humidity)</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>• VCC → ESP32 3.3V or 5V</li>
                    <li>• GND → ESP32 GND</li>
                    <li>• <strong className="text-rose-400">DATA</strong> → ESP32 <strong className="text-white">GPIO 4</strong> (with 10k resistor)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    <span>NEO-6M GPS Module</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>• VCC → ESP32 3.3V / 5V</li>
                    <li>• GND → ESP32 GND</li>
                    <li>• <strong className="text-emerald-400">TX</strong> → ESP32 <strong className="text-white">GPIO 16 (RX2)</strong></li>
                    <li>• <strong className="text-emerald-400">RX</strong> → ESP32 <strong className="text-white">GPIO 17 (TX2)</strong></li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                    <Battery className="w-4 h-4" />
                    <span>Power Supply</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>• 18650 Li-Ion 3.7V battery with TP4056 USB charger or 5V ambulance DC socket</li>
                    <li>• Current draw ~80-120mA during active WiFi HTTP POST</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RUN & PUBLISH */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">How to Run Locally</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Clone repository and install dependencies: <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">npm install</code></li>
                  <li>Run development server with full Express REST API and Vite: <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">npm run dev</code></li>
                  <li>Open <code className="text-white">http://localhost:3000</code> in your browser.</li>
                  <li>Point your ESP32 to <code className="text-cyan-400">http://&lt;your-local-ip&gt;:3000/api/telemetry</code>.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">How to Build & Publish for Production</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Build optimized production bundle: <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">npm run build</code></li>
                  <li>Start production server: <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">npm start</code></li>
                  <li>In Google AI Studio or Cloud Run, the app automatically publishes to the public cloud URL where ESP32 devices can reach it globally over HTTPS!</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>ESP32 Ready • REST JSON Ingestion</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
