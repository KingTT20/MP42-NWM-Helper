// MP42 Jadaene Brown 1903233
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  status: 'optimal' | 'warning' | 'critical' | 'normal';
  cropType: 'mono' | 'mixed';
  plantingDate: string;
  growthCycleDays: number;
  secondaryGrowthCycleDays?: number;
  moistureHistory: { day: string; level: number }[];
  growthHistory: { day: string; level: number }[];
  secondaryGrowthHistory?: { day: string; level: number }[];
}

export interface NutrientData {
  name: string;
  level: number;
  optimal: number;
  unit: string;
}

export interface LogEntry {
  id: string;
  type: 'Irrigation' | 'Fertilizer' | 'Pest' | 'Observation';
  value: string;
  date: string;
  notes: string;
  plotId?: string;
}

const JANUARY_17_2026 = '2026-01-17';
const FEB_10_2026 = '2026-02-10';
const MAY_4_2026 = '2026-05-04';
const MARCH_9_2026 = '2026-03-09';
const MARCH_30_2026 = '2026-03-30';
const APRIL_6_2026 = '2026-04-06';
const APRIL_20_2026 = '2026-04-20';
const APRIL_26_2026 = '2026-04-26';

const generateMoistureHistory = (currentMoisture: number) => {
  const days = ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Day -1', 'Today'];
  // Simulate a gradual drop over the last 7 days ending at currentMoisture
  return days.map((day, index) => {
    // Going backwards, add 3-6% moisture per day, capped at 100
    const levelToSubtract = (6 - index) * 5; 
    const historicalLevel = Math.min(100, currentMoisture + levelToSubtract);
    return { day, level: historicalLevel };
  });
};

export const generateGrowthHistoryRange = (plantingDate: string, growthCycleDays: number, daysCount: number) => {
  const labels: string[] = [];
  const points: number[] = [];
  
  const now = new Date('2026-05-13').getTime(); // Using consistent static date
  const start = new Date(plantingDate).getTime();
  const currentDiffTime = Math.abs(now - start);
  const currentDiffDays = Math.ceil(currentDiffTime / (1000 * 60 * 60 * 24));
  const currentGrowth = Math.min(100, Math.round((currentDiffDays / growthCycleDays) * 100));

  // Determine interval points
  const pointsCount = Math.min(daysCount, 7); // We want max 7 data points for UI cleanliness
  const interval = Math.floor(daysCount / pointsCount) || 1;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const daysAgo = i === 0 ? 0 : i * interval;
    const label = daysAgo === 0 ? 'Today' : `Day -${daysAgo}`;
    
    // Simulate historical progress based on linear growth
    const pastDiffDays = Math.max(0, currentDiffDays - daysAgo);
    let historicalProgress = Math.min(100, (pastDiffDays / growthCycleDays) * 100);
    
    // Sometimes it's negative if planted recently, floor it at 0
    historicalProgress = Math.max(0, historicalProgress);
    
    labels.push(label);
    points.push(Number(historicalProgress.toFixed(1)));
  }

  return labels.map((day, index) => ({ day, level: points[index] }));
};

export const MOCK_PLOTS: FarmPlot[] = [
  { id: '1', name: 'Plot 1', crop: 'Yam', cropType: 'mono', moisture: 65, nitrogen: 55, phosphorus: 32, potassium: 72, status: 'optimal', plantingDate: JANUARY_17_2026, growthCycleDays: 300, moistureHistory: generateMoistureHistory(65), growthHistory: generateGrowthHistoryRange(JANUARY_17_2026, 300, 7) },
  { id: '2', name: 'Plot 2', crop: 'Pepper & Tomato', cropType: 'mixed', moisture: 35, nitrogen: 40, phosphorus: 28, potassium: 65, status: 'warning', plantingDate: MARCH_9_2026, growthCycleDays: 130, secondaryGrowthCycleDays: 100, moistureHistory: generateMoistureHistory(35), growthHistory: generateGrowthHistoryRange(MARCH_9_2026, 130, 7), secondaryGrowthHistory: generateGrowthHistoryRange(MARCH_9_2026, 100, 7) },
  { id: '3', name: 'Plot 3', crop: 'Pepper', cropType: 'mono', moisture: 62, nitrogen: 60, phosphorus: 35, potassium: 75, status: 'optimal', plantingDate: MAY_4_2026, growthCycleDays: 130, moistureHistory: generateMoistureHistory(62), growthHistory: generateGrowthHistoryRange(MAY_4_2026, 130, 7) },
  { id: '4', name: 'Plot 4', crop: 'Pak Choy', cropType: 'mono', moisture: 60, nitrogen: 58, phosphorus: 34, potassium: 70, status: 'optimal', plantingDate: APRIL_26_2026, growthCycleDays: 50, moistureHistory: generateMoistureHistory(60), growthHistory: generateGrowthHistoryRange(APRIL_26_2026, 50, 7) },
  { id: '5', name: 'Plot 5', crop: 'Tomato', cropType: 'mono', moisture: 60, nitrogen: 62, phosphorus: 40, potassium: 70, status: 'optimal', plantingDate: FEB_10_2026, growthCycleDays: 100, moistureHistory: generateMoistureHistory(22), growthHistory: generateGrowthHistoryRange(FEB_10_2026, 100, 7) },
  { id: '6', name: 'Plot 6', crop: 'Corn', cropType: 'mono', moisture: 40, nitrogen: 45, phosphorus: 30, potassium: 68, status: 'warning', plantingDate: MARCH_9_2026, growthCycleDays: 100, moistureHistory: generateMoistureHistory(40), growthHistory: generateGrowthHistoryRange(MARCH_9_2026, 100, 7) },
];

export const MOCK_NUTRIENTS: NutrientData[] = [
  { name: 'Nitrogen (N)', level: 45, optimal: 60, unit: 'mg/kg' },
  { name: 'Phosphorus (P)', level: 30, optimal: 35, unit: 'mg/kg' },
  { name: 'Potassium (K)', level: 75, optimal: 70, unit: 'mg/kg' },
];

const generateMockLogs = (plots: FarmPlot[]): LogEntry[] => {
  const logs: LogEntry[] = [];
  let logId = 1;
  const endDate = new Date('2026-05-14T12:00:00Z');

  plots.forEach(plot => {
    let currentDate = new Date(`${plot.plantingDate}T12:00:00Z`);
    
    while (currentDate <= endDate) {
      const rand = Math.random();
      let type: 'Irrigation' | 'Fertilizer' | 'Pest' | 'Observation' = 'Observation';
      let value = '';
      let notes = '';

      if (rand < 0.4) {
        type = 'Irrigation';
        value = `${Math.floor(Math.random() * 5 + 2)}gal`; 
        notes = `${plot.name} (${plot.crop}): Automated drip irrigation cycle completed from Main Tank.`;
      } else if (rand < 0.6) {
        type = 'Observation';
        value = 'Checked';
        notes = `${plot.name} (${plot.crop}): Growth looks normal. No visible signs of stress.`;
      } else if (rand < 0.8) {
        type = 'Fertilizer';
        value = `${Math.floor(Math.random() * 5 + 2)}kg`;
        notes = `${plot.name} (${plot.crop}): Applied scheduled nutrients based on current cycle.`;
      } else if (rand < 0.9) {
        type = 'Pest';
        value = 'Monitored';
        notes = `${plot.name} (${plot.crop}): Checked for signs of common pests. All clear.`;
      } else {
        type = 'Observation'; // Assuming Observation for Refill if literal type is limited
        value = 'Rainfall Event';
        notes = `Main Tank: Captured estimated ${Math.floor(Math.random() * 20 + 5)} gallons of rainfall from weather event.`;
      }

      logs.push({
        id: `mock_log_${logId++}`,
        type,
        value,
        date: currentDate.toISOString().split('T')[0],
        notes,
        plotId: plot.id,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MOCK_LOGS: LogEntry[] = generateMockLogs(MOCK_PLOTS);
