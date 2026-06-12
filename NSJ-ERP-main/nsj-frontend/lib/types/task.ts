/**
 * Task Management Types
 *
 * Type definitions for the task management system including tasks,
 * notifications, and status history.
 */

export type TaskStatus =
  | "PENDING"
  | "COMPLETED"
  | "STUCK"
  | "NEED_FOUNDER"
  | "TRANSFERRED";

export type TaskUrgency = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskDepartment =
  | "SALES"
  | "PRODUCTION"
  | "ACCOUNTS"
  | "HR"
  | "IT"
  | "MARKETING"
  | "OPERATIONS"
  | "DESIGN"
  | "QUALITY"
  | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string
  urgency: TaskUrgency;
  urgency_display: string;
  output_medium: string;
  department: TaskDepartment;
  department_display: string;
  assigned_to: string; // User ID
  assigned_to_details: User;
  created_by: string; // User ID
  created_by_details: User;
  status: TaskStatus;
  status_display: string;
  attachment?: string; // URL to attachment
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  completed_at?: string; // ISO datetime string
  is_overdue: boolean;
  is_read?: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  deadline: string; // ISO date string
  urgency: TaskUrgency;
  output_medium?: string;
  department: TaskDepartment;
  assigned_to: string; // User ID
  attachment?: File;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  deadline?: string;
  urgency?: TaskUrgency;
  output_medium?: string;
  department?: TaskDepartment;
  assigned_to?: string;
  status?: TaskStatus;
  attachment?: File;
}

export interface TaskStatusUpdate {
  status: TaskStatus;
  notes?: string;
}

export interface TaskStatusHistory {
  id: string;
  old_status: TaskStatus | null;
  old_status_display: string;
  new_status: TaskStatus;
  new_status_display: string;
  changed_by: string; // User ID
  changed_by_details: User;
  changed_at: string; // ISO datetime string
  notes: string;
}

export interface TaskNotification {
  id: string;
  task_id: string;
  task_title: string;
  message: string;
  is_read: boolean;
  created_at: string; // ISO datetime string
}

export interface TaskStats {
  my_pending: number;
  my_completed: number;
  my_stuck: number;
  my_total: number;
  all_pending: number | null;
  all_completed: number | null;
  all_total: number | null;
  is_admin: boolean;
}

export interface TaskFilters {
  status?: TaskStatus;
  department?: TaskDepartment;
  assigned_to?: string;
  urgency?: TaskUrgency;
  my_tasks?: boolean;
}

export interface StatusTransition {
  label: string;
  description: string;
  color: string;
  next_states: TaskStatus[];
}

export type StatusTransitions = Record<TaskStatus, StatusTransition>;
