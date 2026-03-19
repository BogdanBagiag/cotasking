export type Plan = 'free' | 'premium' | 'premium_plus'

export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type NotificationType =
  | 'task_assigned'
  | 'task_commented'
  | 'task_due'
  | 'task_overdue'
  | 'member_invited'
  | 'member_joined'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  owner_id: string
  plan: Plan
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_by: string | null
  created_at: string
  profile?: Profile
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  color: string
  image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  boards?: Board[]
}

export interface Board {
  id: string
  project_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
  columns?: Column[]
}

export interface Column {
  id: string
  board_id: string
  name: string
  position: number
  color: string | null
  created_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  column_id: string
  title: string
  description: string | null
  position: number
  due_date: string | null
  assignee_id: string | null
  priority: TaskPriority | null
  completed: boolean
  created_by: string
  cover_color: string | null
  repeat: RepeatType | null
  repeat_days: string[] | null
  repeat_time: string | null
  repeat_interval: number | null
  estimated_minutes: number | null
  // Repeat instance system
  is_repeat_template: boolean
  repeat_parent_id: string | null
  repeat_last_generated: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
  labels?: Label[]
  subtasks?: Subtask[]
  comments?: Comment[]
  attachments?: Attachment[]
  watchers?: Profile[]
  _count?: {
    subtasks: number
    completed_subtasks: number
    comments: number
    attachments: number
  }
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
  created_at: string
}

export interface TaskLabel {
  task_id: string
  label_id: string
  label?: Label
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Attachment {
  id: string
  task_id: string
  name: string
  url: string
  size: number | null
  type: string | null
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  read: boolean
  payload: Record<string, string>
  created_at: string
}

export interface Holiday {
  id: string
  workspace_id: string
  name: string
  date: string
  recurring: boolean
  created_at: string
}

// Plan limits
export const PLAN_LIMITS = {
  free: {
    projects: 3,
    members: 5,
    boards_per_project: 1,
    labels: 5,
    subtasks: false,
    email_reminders: false,
    holidays: false,
    advanced_roles: false,
    reports: false,
    export: false,
    workspaces: 1,
  },
  premium: {
    projects: Infinity,
    members: 25,
    boards_per_project: Infinity,
    labels: Infinity,
    subtasks: true,
    email_reminders: true,
    holidays: true,
    advanced_roles: true,
    reports: false,
    export: false,
    workspaces: 1,
  },
  premium_plus: {
    projects: Infinity,
    members: Infinity,
    boards_per_project: Infinity,
    labels: Infinity,
    subtasks: true,
    email_reminders: true,
    holidays: true,
    advanced_roles: true,
    reports: true,
    export: true,
    workspaces: Infinity,
  },
} as const

export type PlanLimits = typeof PLAN_LIMITS
