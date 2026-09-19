export type UserRole = "ADMIN" | "LEAD" | "FINANCE" | "CMO" | "COO";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProgramStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export type DashboardTask = {
  id: string;
  title: string;
  clientName: string;
  programName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeName: string;
};

export type DashboardClient = {
  id: string;
  businessName: string;
  sector: string;
  programName: string;
  progress: number | null;
  status: "ACTIVE" | "ON_HOLD" | "PROSPECT";
  nextAction: string;
};

export type DashboardMetrics = {
  activeClients: number;
  activePrograms: number;
  overdueTasks: number;
  dueThisWeek: number;
  receivables: number;
};
