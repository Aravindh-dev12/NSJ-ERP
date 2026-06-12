/**
 * Process Tasks API Client
 * Handles all API calls related to process task reordering
 */

import { api } from "./api";

export interface ProcessTask {
  id?: string;
  task_name: string;
  description: string;
  department: string;
  original_position: number;
  custom_position: number;
  status?: string;
  assigned_to?: string;
  assigned_to_details?: {
    id: string;
    name: string;
    email: string;
  };
  due_date?: string;
  completed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessOrder {
  id: string;
  sales_query: string;
  sales_query_details?: {
    id: string;
    jewellery_type: string;
    order_date: string;
  };
  is_custom: boolean;
  tasks: ProcessTask[];
  created_at: string;
  updated_at: string;
}

export interface DefaultTasksResponse {
  tasks: Array<{
    position: number;
    name: string;
    description: string;
    department: string;
  }>;
  count: number;
  message: string;
}

export interface ProcessOrderResponse {
  process_order: ProcessOrder | null;
  default_tasks?: ProcessTask[];
  has_custom_order: boolean;
  message: string;
}

export interface SaveProcessOrderRequest {
  tasks: Array<{
    task_name: string;
    description: string;
    department: string;
    original_position: number;
    custom_position: number;
  }>;
  is_custom: boolean;
}

export interface SaveProcessOrderResponse {
  process_order: ProcessOrder;
  message: string;
  is_custom: boolean;
  created: boolean;
}

/**
 * Get the 29 default process tasks
 */
export async function getDefaultProcessTasks(): Promise<DefaultTasksResponse> {
  const response = await api.get<DefaultTasksResponse>(
    "/process-tasks/default/"
  );
  return response;
}

/**
 * Get process order for a sales query
 * Returns custom order if exists, otherwise returns default tasks
 */
export async function getProcessOrder(
  salesQueryId: string
): Promise<ProcessOrderResponse> {
  const response = await api.get<ProcessOrderResponse>(
    `/sales-queries/${salesQueryId}/process-order/`
  );
  return response;
}

/**
 * Save custom process order for a sales query
 */
export async function saveProcessOrder(
  salesQueryId: string,
  data: SaveProcessOrderRequest
): Promise<SaveProcessOrderResponse> {
  const response = await api.post<SaveProcessOrderResponse>(
    `/sales-queries/${salesQueryId}/process-order/`,
    data
  );
  return response;
}

/**
 * Update existing process order
 */
export async function updateProcessOrder(
  salesQueryId: string,
  data: SaveProcessOrderRequest
): Promise<SaveProcessOrderResponse> {
  const response = await api.put<SaveProcessOrderResponse>(
    `/sales-queries/${salesQueryId}/process-order/update/`,
    data
  );
  return response;
}

/**
 * Reset process order to default
 */
export async function resetProcessOrder(
  salesQueryId: string
): Promise<SaveProcessOrderResponse> {
  const response = await api.post<SaveProcessOrderResponse>(
    `/sales-queries/${salesQueryId}/process-order/reset/`
  );
  return response;
}

/**
 * Update individual process task (status, notes, etc.)
 */
export async function updateProcessTask(
  salesQueryId: string,
  taskId: string,
  data: Partial<ProcessTask>
): Promise<{ task: ProcessTask; message: string }> {
  const response = await api.patch<{ task: ProcessTask; message: string }>(
    `/sales-queries/${salesQueryId}/process-tasks/${taskId}/`,
    data
  );
  return response;
}

/**
 * Mark a process task as completed
 */
export async function markTaskCompleted(
  salesQueryId: string,
  taskId: string
): Promise<{ task: ProcessTask; message: string }> {
  return updateProcessTask(salesQueryId, taskId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
}

/**
 * Mark a process task as in progress
 */
export async function markTaskInProgress(
  salesQueryId: string,
  taskId: string
): Promise<{ task: ProcessTask; message: string }> {
  return updateProcessTask(salesQueryId, taskId, {
    status: "in_progress",
  });
}
