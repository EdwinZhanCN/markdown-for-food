// src/features/temperature.ts
export class TemperatureMonitor {
    constructor(private steps: Step[]) {}

    checkCriticalPoints() {
        return this.steps.filter(step =>
            step.parameters?.temp?.critical === true
        ).map(step => ({
            step: step.name,
            temp: step.parameters.temp,
            tolerance: step.parameters.tempTolerance
        }));
    }

    generateTimeline() {
        return this.steps.map(step => ({
            time: step.time,
            temp: step.parameters.temp || '室温',
            action: step.description
        }));
    }
}