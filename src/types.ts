export interface Message {
  id?: string;
  sender: string;
  phone: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

export interface ServiceStatusDetail {
  status: "running" | "connected" | "offline";
  port?: number;
  uptime?: string;
  dbSize?: string;
  memoryUsed?: string;
  phone?: string;
  device?: string;
  delay?: string;
  modelLoaded?: string;
  statusText?: string;
  activeWorkers?: number;
  pendingJobs?: number;
  failedJobs?: number;
}

export interface ServiceStatus {
  postgresql: ServiceStatusDetail;
  redis: ServiceStatusDetail;
  baileys: ServiceStatusDetail;
  ollama: ServiceStatusDetail;
  laravelQueue: ServiceStatusDetail;
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  storage: number;
  ram_bytes: string;
  storage_bytes: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event: string;
  user: string;
  ip: string;
  status: string;
}

export interface DatabaseBackup {
  id: string;
  timestamp: string;
  size: string;
  status: string;
  type: string;
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: string;
  threatLevel: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  keyTopics: string[];
  insights: string[];
  recommendations: string[];
  flaggedMessages: { text: string; reason: string }[];
}
