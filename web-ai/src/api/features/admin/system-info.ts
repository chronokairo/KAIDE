/**
 * @layer features/admin
 * @description Informações do sistema
 */

import os from 'os';
import si from 'systeminformation';

export interface SystemInfo {
    success: boolean;
    system: {
        platform: string;
        arch: string;
        hostname: string;
        uptime: number;
        nodeVersion: string;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    cpu: {
        model: string;
        cores: number;
        loadAvg: number[];
        usagePercent: number;
    };
    gpu?: {
        vendor: string;
        model: string;
        memoryTotal?: number;
        memoryUsed?: number;
        temperature?: number;
        utilization?: number;
    }[];
}

export async function getSystemInfo(): Promise<SystemInfo> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get CPU usage
    const cpuLoad = await si.currentLoad();

    // Get GPU information
    let gpuInfo: SystemInfo['gpu'] = undefined;
    try {
        const graphics = await si.graphics();
        gpuInfo = graphics.controllers.map((gpu: any) => ({
            vendor: gpu.vendor || 'Unknown',
            model: gpu.model || 'Unknown',
            memoryTotal: gpu.memoryTotal,
            memoryUsed: gpu.memoryUsed,
            temperature: gpu.temperatureGpu,
            utilization: gpu.utilizationGpu
        }));
    } catch (error) {
        // GPU info not available
    }

    return {
        success: true,
        system: {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            nodeVersion: process.version
        },
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usagePercent: Math.round((usedMem / totalMem) * 100)
        },
        cpu: {
            model: os.cpus()[0]?.model || 'Unknown',
            cores: os.cpus().length,
            loadAvg: os.loadavg(),
            usagePercent: Math.round(cpuLoad.currentLoad)
        },
        gpu: gpuInfo
    };
}
