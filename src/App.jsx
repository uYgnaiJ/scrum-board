import { useEffect, useRef, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowRight, Check, ChevronRight, ChevronsUpDown, Columns3,
  Database, GitBranch, ListTree, Plus, Search, Settings2, StickyNote, X,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const ids = {
  todo: 'c-todo', progress: 'c-progress', review: 'c-review', done: 'c-done',
  low: 'p-low', medium: 'p-medium', high: 'p-high', critical: 'p-critical',
  product: 'project-product', web: 'branch-web', mobile: 'branch-mobile',
  ops: 'project-ops', infra: 'branch-infra',
}

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString()
const newId = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

function makeDemoBoard() {
  return {
    columns: [
      { id: ids.todo, name: 'To do', color: '#6d5dfc', position: 0, is_todo: 1 },
      { id: ids.progress, name: 'In progress', color: '#d99425', position: 1, is_todo: 0 },
      { id: ids.review, name: 'Review', color: '#3685e5', position: 2, is_todo: 0 },
      { id: ids.done, name: 'Done', color: '#2f9d65', position: 3, is_todo: 0 },
    ],
    priorities: [
      { id: ids.low, name: 'Low', color: '#66987a', position: 0 },
      { id: ids.medium, name: 'Medium', color: '#c68b25', position: 1 },
      { id: ids.high, name: 'High', color: '#d45d40', position: 2 },
      { id: ids.critical, name: 'Critical', color: '#bb3e5d', position: 3 },
    ],
    projects: [
      { id: ids.product, parent_id: null, name: 'Product suite', created_at: day(-60) },
      { id: ids.web, parent_id: ids.product, name: 'Web experience', created_at: day(-59) },
      { id: ids.mobile, parent_id: ids.product, name: 'Mobile app', created_at: day(-58) },
      { id: ids.ops, parent_id: null, name: 'Operations', created_at: day(-55) },
      { id: ids.infra, parent_id: ids.ops, name: 'Infrastructure', created_at: day(-54) },
    ],
    tasks: [
      { id: 'task-001', parent_id: null, title: 'Unify account onboarding', content: 'Simplify the first-run experience and remove duplicated verification steps.', requester: 'Maya Chen', requested_at: day(-9), expected_finish: day(3), project_id: ids.web, priority_id: ids.high, column_id: ids.todo, created_at: day(-4), updated_at: day(-1) },
      { id: 'task-002', parent_id: 'task-001', title: 'Map verification edge cases', content: 'Document current paths and error recovery.', requester: 'Leo Park', requested_at: day(-6), expected_finish: day(1), project_id: ids.web, priority_id: ids.medium, column_id: ids.progress, created_at: day(-3), updated_at: day(0) },
      { id: 'task-003', parent_id: 'task-001', title: 'Polish welcome screen', content: 'Complete the responsive UI states.', requester: 'Nora Hill', requested_at: day(-5), expected_finish: day(4), project_id: ids.mobile, priority_id: ids.low, column_id: ids.review, created_at: day(-2), updated_at: day(-1) },
      { id: 'task-004', parent_id: null, title: 'Add usage anomaly alerts', content: 'Notify workspace owners when activity deviates from the baseline.', requester: 'Owen Ross', requested_at: day(-12), expected_finish: day(6), project_id: ids.infra, priority_id: ids.critical, column_id: ids.todo, created_at: day(-8), updated_at: day(-2) },
      { id: 'task-005', parent_id: null, title: 'Improve board keyboard flow', content: 'Support fast navigation and task creation without leaving the keyboard.', requester: 'Sofia Lee', requested_at: day(-10), expected_finish: day(2), project_id: ids.web, priority_id: ids.medium, column_id: ids.progress, created_at: day(-6), updated_at: day(0) },
      { id: 'task-006', parent_id: null, title: 'Database backup playbook', content: 'Finalize recovery steps for both supported database engines.', requester: 'Ari Stone', requested_at: day(-15), expected_finish: day(-1), project_id: ids.infra, priority_id: ids.high, column_id: ids.review, created_at: day(-10), updated_at: day(-1) },
      { id: 'task-007', parent_id: null, title: 'Archive legacy sprint labels', content: 'The old labels have been migrated and can now be retired.', requester: 'Maya Chen', requested_at: day(-18), expected_finish: day(-3), project_id: ids.web, priority_id: ids.low, column_id: ids.done, created_at: day(-14), updated_at: day(-3) },
    ],
    movements: [
      { id: 'm-1', task_id: 'task-003', from_column_id: ids.progress, to_column_id: ids.review, moved_at: day(-1) },
      { id: 'm-2', task_id: 'task-005', from_column_id: ids.todo, to_column_id: ids.progress, moved_at: day(0) },
      { id: 'm-3', task_id: 'task-007', from_column_id: ids.review, to_column_id: ids.done, moved_at: day(-3) },
    ],
  }
}

function loadDemo() {
  try { return JSON.parse(localStorage.getItem('scrum-canvas-demo')) || makeDemoBoard() }
  catch { return makeDemoBoard() }
}

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
  return payload
}

const date = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date(value)) : 'No date'
const dateTime = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(value)) : '—'
const inputDate = (value) => (value ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(value)) : '')
const toDate = (value) => (value ? new Date(value).toISOString() : null)

function DateHintInput({ hint, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (focused) ref.current?.focus() }, [focused])
  return <Input ref={ref} type={focused || value ? 'date' : 'text'} placeholder={hint} value={value} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={onChange} />
}

function Toast({ toast }) {
  if (!toast) return null
  return <div className={cn('fixed right-6 bottom-6 z-[80] rounded-md px-4 py-3 text-sm shadow-lg', toast.error ? 'bg-destructive text-white' : 'bg-foreground text-background')}>{toast.text}</div>
}

function Priority({ item }) {
  return <span className="invisible text-[11px] font-medium group-hover:visible" style={{ color: item?.color || '#777' }}>{item?.name || 'None'}</span>
}

function ColumnStatus({ item, board, onMove, onSuppress }) {
  const [open, setOpen] = useState(false)
  const openTimer = useRef(null)
  const closeTimer = useRef(null)
  const scheduleOpen = () => {
    clearTimeout(closeTimer.current)
    clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 500)
  }
  const scheduleClose = () => {
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }
  return (
    <Select open={open} onOpenChange={setOpen} value={item.column_id || undefined} onValueChange={(columnId) => onMove(item.id, columnId)}>
      <SelectTrigger onMouseEnter={() => { onSuppress(); scheduleOpen() }} onMouseLeave={scheduleClose} className={cn('invisible h-auto w-auto gap-1 border-0 px-0 py-0 text-[10px] font-medium text-muted-foreground shadow-none group-hover:visible data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent', open && 'visible')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent onMouseEnter={() => clearTimeout(closeTimer.current)} onMouseLeave={scheduleClose}>
        {board.columns.map((column) => <SelectItem key={column.id} value={column.id}>{column.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function TaskCard({ item, board, view, columnIndex, onEdit, onMove, onNewSubtask, onHoverEnter, onHoverLeave, onSuppressPreview }) {
  const rank = board.priorities.find((entry) => entry.id === item.priority_id)
  const children = board.tasks.filter((entry) => entry.parent_id === item.id)
  const project = board.projects.find((entry) => entry.id === item.project_id)
  const parentProject = project && board.projects.find((entry) => entry.id === project.parent_id)
  const path = project ? `${parentProject ? `${parentProject.name} / ` : ''}${project.name}` : 'Unassigned'
  const expected = item.expected_finish ? new Date(item.expected_finish) : null
  const soon = expected && expected.getTime() < Date.now() + 2 * 86400000
  const tint = rank?.color && /^#[0-9a-fA-F]{6}$/.test(rank.color) ? rank.color : null

  return (
    <article className={cn('group relative border-t px-3 py-4 transition-colors last:border-b', tint ? 'bg-[linear-gradient(to_bottom,var(--card-tint),transparent)] hover:bg-[linear-gradient(to_bottom,var(--card-tint-hover),transparent)]' : 'hover:bg-muted/35')} style={tint ? { '--card-tint': `${tint}26`, '--card-tint-hover': `${tint}40` } : undefined} onMouseEnter={(event) => onHoverEnter(item, columnIndex, event.currentTarget.getBoundingClientRect())} onMouseLeave={onHoverLeave}>
      <div className="mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="min-w-0 truncate">{path}</span>
        <span className="min-w-0 truncate">{item.requester}</span>
        {item.expected_finish && <span className={cn('shrink-0', soon && 'text-destructive')}>{date(item.expected_finish)}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-2"><ColumnStatus item={item} board={board} onMove={onMove} onSuppress={onSuppressPreview} /><Priority item={rank} /></span>
      </div>
      <h3 className="pr-8 text-[13px] leading-5 font-semibold cursor-pointer hover:underline" onClick={() => onEdit(item)}>{item.title}</h3>
      {view === 'main' && children.length > 0 && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {children.map((child) => {
            const status = board.columns.find((entry) => entry.id === child.column_id)
            return <div key={child.id} className="flex items-center justify-between gap-3 text-[10px]"><span className="min-w-0 truncate"><span className="text-muted-foreground">└ </span><span className="cursor-pointer font-medium hover:underline" onClick={() => onEdit(child)}>{child.title}</span></span><span className="shrink-0 font-medium" style={{ color: status?.color }}>{status?.name}</span></div>
          })}
        </div>
      )}
      <div className="absolute top-10 right-2 hidden items-center gap-1 group-hover:flex" onClick={(event) => event.stopPropagation()}>
        {!item.parent_id && <Tooltip><TooltipTrigger asChild><Button size="icon-xs" variant="outline" onClick={() => onNewSubtask(item)} aria-label="Add sub-task"><Plus /></Button></TooltipTrigger><TooltipContent>Add sub-task</TooltipContent></Tooltip>}
      </div>
    </article>
  )
}

function BoardPage({ board, onNew, onNewSubtask, onEdit, onMove, onHistory, onConfig }) {
  const [view, setView] = useState('main')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const mainTasks = board.tasks.filter((item) => !item.parent_id)
  const matchesProject = (item) => !projectFilter || item.project_id === projectFilter || board.projects.find((entry) => entry.id === item.project_id)?.parent_id === projectFilter
  const visible = (view === 'main' ? mainTasks : board.tasks).filter((item) => `${item.title} ${item.content} ${item.requester}`.toLowerCase().includes(search.toLowerCase()) && matchesProject(item))
  const columns = [...board.columns].sort((a, b) => Number(a.position) - Number(b.position))

  const [preview, setPreview] = useState(null)
  const previewTimer = useRef(null)
  const previewShown = useRef(false)
  const showPreview = (task, columnIndex, rect) => { previewShown.current = true; setPreview({ task, columnIndex, top: rect.top, left: rect.left, right: rect.right }) }
  const hidePreview = () => { previewShown.current = false; clearTimeout(previewTimer.current); setPreview(null) }
  const handleCardEnter = (task, columnIndex, rect) => {
    clearTimeout(previewTimer.current)
    if (previewShown.current) showPreview(task, columnIndex, rect)
    else previewTimer.current = setTimeout(() => showPreview(task, columnIndex, rect), 1000)
  }
  const handleCardLeave = () => clearTimeout(previewTimer.current)
  const previewSoon = preview?.task.expected_finish && new Date(preview.task.expected_finish).getTime() < Date.now() + 2 * 86400000
  const previewStyle = preview
    ? preview.columnIndex >= columns.length - 1
      ? { top: preview.top, left: preview.left - 8, transform: 'translateX(-100%)' }
      : { top: preview.top, left: preview.right + 8 }
    : null

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden p-6">
      <header className="mb-5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="main">Main tasks</TabsTrigger><TabsTrigger value="all">All tasks</TabsTrigger></TabsList></Tabs>
          <div className="relative"><Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" /><Input className="h-9 w-52 pl-8" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="w-52"><ProjectTreeSelect projects={board.projects} value={projectFilter} onChange={setProjectFilter} placeholder="All projects" allowAll /></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onHistory}><Activity />History</Button>
          <Button variant="outline" onClick={onConfig}><Settings2 />Configuration</Button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 auto-cols-[minmax(260px,1fr)] grid-flow-col overflow-x-auto border-y">
        {columns.map((column, index) => {
          const items = visible.filter((item) => item.column_id === column.id)
          return (
            <section key={column.id} className="min-w-0 border-r first:border-l" onMouseLeave={hidePreview}>
              <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase"><span className="size-1.5 rounded-full" style={{ background: column.color }} />{column.name}<span className="font-normal text-muted-foreground">{items.length}</span></div>
                {Number(column.is_todo) ? <Tooltip><TooltipTrigger asChild><Button size="icon-sm" variant="outline" onClick={onNew} aria-label="Create task"><Plus /></Button></TooltipTrigger><TooltipContent>Create task in To do</TooltipContent></Tooltip> : null}
              </div>
              <div className="px-2">{items.length ? items.map((item) => <TaskCard key={item.id} item={item} board={{ ...board, columns }} view={view} columnIndex={index} onEdit={onEdit} onMove={onMove} onNewSubtask={onNewSubtask} onHoverEnter={handleCardEnter} onHoverLeave={handleCardLeave} onSuppressPreview={hidePreview} />) : <div className="border-t px-3 py-8 text-[11px] text-muted-foreground">No tasks in this column</div>}</div>
            </section>
          )
        })}
      </div>
      {preview && (
        <div className="pointer-events-none fixed z-[70] w-80 rounded-lg border bg-background p-4 shadow-lg" style={previewStyle}>
          <div className="text-sm font-semibold">{preview.task.title}</div>
          {preview.task.content && <p className="mt-2 text-[12px] leading-5 whitespace-pre-wrap text-muted-foreground">{preview.task.content}</p>}
          <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
            <span>{preview.task.requester || 'No requester'}</span>
            {preview.task.expected_finish && <span className={cn('flex items-center gap-1', previewSoon && 'text-destructive')}>{date(preview.task.expected_finish)}</span>}
          </div>
        </div>
      )}
    </main>
  )
}

function Field({ label, children, className }) {
  return <div className={cn('grid gap-2', className)}><Label>{label}</Label>{children}</div>
}

function ProjectTreeSelect({ projects, value, onChange, placeholder = 'Select project or branch', allowAll = false, disabled = false }) {
  const [open, setOpen] = useState(false)
  const roots = projects.filter((item) => !item.parent_id)
  const selected = projects.find((item) => item.id === value)
  const selectedParent = selected && projects.find((item) => item.id === selected.parent_id)
  const selectedPath = selected ? `${selectedParent ? `${selectedParent.name} / ` : ''}${selected.name}` : placeholder
  const choose = (id) => { onChange(id); setOpen(false) }

  if (disabled) return <Button type="button" variant="outline" disabled className="w-full justify-between font-normal"><span className="truncate">{selectedPath}</span><ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" /></Button>
  return <Popover modal open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal"><span className={cn('truncate', !selected && 'text-muted-foreground')}>{selectedPath}</span><ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2"><div className="max-h-72 touch-pan-y overflow-y-auto overscroll-contain" onWheel={(event) => event.stopPropagation()}>{allowAll && <Button type="button" variant="ghost" className="w-full justify-start gap-2 border-b rounded-none font-medium" onClick={() => choose('')}><Check className={cn('size-4', !value ? 'opacity-100' : 'opacity-0')} />All projects</Button>}{roots.map((root) => { const branches = projects.filter((item) => item.parent_id === root.id); return <div key={root.id} className="border-b py-1 last:border-b-0"><Button type="button" variant="ghost" className="w-full justify-start gap-2 font-medium" onClick={() => choose(root.id)}><Check className={cn('size-4', value === root.id ? 'opacity-100' : 'opacity-0')} />{root.name}</Button>{branches.length > 0 && <div className="relative ml-5 border-l pl-3">{branches.map((branch) => <Button key={branch.id} type="button" variant="ghost" className="relative w-full justify-start gap-2 font-normal before:absolute before:top-1/2 before:-left-3 before:w-3 before:border-t" onClick={() => choose(branch.id)}><Check className={cn('size-4', value === branch.id ? 'opacity-100' : 'opacity-0')} />{branch.name}</Button>)}</div>}</div> })}{!roots.length && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No projects configured</div>}</div></PopoverContent></Popover>
}

function TaskDialog({ open, onOpenChange, value, setValue, board, onSave, onDelete, onOpenTask, onMove, onNewSubtask, lockedCreate }) {
  if (!value) return null
  const editing = Boolean(value.id)
  const locked = Boolean(lockedCreate) || (editing && Boolean(value.parent_id))
  const parents = board.tasks.filter((item) => !item.parent_id && item.id !== value.id)
  const parentTask = value.parent_id ? board.tasks.find((item) => item.id === value.parent_id) : null
  const subtasks = editing ? board.tasks.filter((item) => item.parent_id === value.id) : []
  const showSubtasks = editing && !value.parent_id
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', showSubtasks ? 'sm:max-w-4xl' : 'sm:max-w-2xl')} onPointerDownOutside={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader><DialogTitle>{editing ? 'Edit task' : 'Create task'}</DialogTitle><DialogDescription>Task timestamps are maintained automatically.</DialogDescription></DialogHeader>
        <div className="flex gap-6">
          <form className="grid flex-1 gap-3" onSubmit={(event) => { event.preventDefault(); onSave() }}>
            <Input required maxLength={240} placeholder="Title" value={value.title || ''} onChange={(event) => setValue({ ...value, title: event.target.value })} />
            <Textarea placeholder="Content" value={value.content || ''} onChange={(event) => setValue({ ...value, content: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <DateHintInput hint="Request time" value={inputDate(value.requested_at)} onChange={(event) => setValue({ ...value, requested_at: event.target.value })} />
              <DateHintInput hint="Expected finish" value={inputDate(value.expected_finish)} onChange={(event) => setValue({ ...value, expected_finish: event.target.value })} />
              <ProjectTreeSelect projects={board.projects} value={value.project_id} onChange={(project_id) => setValue({ ...value, project_id })} disabled={locked} />
              <Select value={value.priority_id || undefined} onValueChange={(priority_id) => setValue({ ...value, priority_id })}><SelectTrigger className="w-full"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{board.priorities.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
              <Input required placeholder="Requester" value={value.requester || ''} onChange={(event) => setValue({ ...value, requester: event.target.value })} />
              <Select value={value.column_id || undefined} onValueChange={(column_id) => setValue({ ...value, column_id })}><SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{board.columns.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
            </div>
            {locked && value.parent_id ? <button type="button" onClick={() => parentTask && onOpenTask(parentTask)} className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"><ArrowLeft className="size-3.5 shrink-0" /><span className="truncate">{parentTask?.title || 'Parent task'}</span></button> : <Select value={value.parent_id || '__main'} onValueChange={(parent_id) => setValue({ ...value, parent_id: parent_id === '__main' ? '' : parent_id })}><SelectTrigger className="w-full"><SelectValue placeholder="Parent task" /></SelectTrigger><SelectContent><SelectItem value="__main">This is a main task</SelectItem>{parents.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select>}
            {editing && <div className="flex gap-6 border-t pt-3 text-[10px] text-muted-foreground"><span>Created {dateTime(value.created_at)}</span><span>Edited {dateTime(value.updated_at)}</span></div>}
            <DialogFooter className="items-center sm:justify-between">{editing ? <Button type="button" variant="link" className="text-destructive hover:text-destructive" onClick={onDelete}>Delete</Button> : <span />}<Button type="submit">{editing ? 'Save changes' : 'Create task'}</Button></DialogFooter>
          </form>
          {showSubtasks && (
            <aside className="hidden w-80 shrink-0 border-l pl-5 sm:block">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">Sub tasks ({subtasks.length})</h4>
                {onNewSubtask && <Tooltip><TooltipTrigger asChild><Button size="icon-sm" variant="outline" onClick={() => onNewSubtask(value)} aria-label="Add sub-task"><Plus /></Button></TooltipTrigger><TooltipContent>Add sub-task</TooltipContent></Tooltip>}
              </div>
              <div className="mt-3 max-h-[52vh] overflow-y-auto">
                {subtasks.length ? subtasks.map((child) => <TaskCard key={child.id} item={child} board={board} view="all" columnIndex={0} onEdit={onOpenTask} onMove={onMove} onNewSubtask={() => {}} onHoverEnter={() => {}} onHoverLeave={() => {}} onSuppressPreview={() => {}} />) : <p className="py-6 text-xs text-muted-foreground">No sub tasks yet.</p>}
              </div>
            </aside>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DatasourceConfig({ config, draft, setDraft, notice, onTest, onConnect, onUse, onNew, onEdit }) {
  return (
    <section>
      <ConfigHeader title="Data sources" description="Connect MySQL or PostgreSQL. Required tables are detected or created." action={<Button size="sm" onClick={onNew}><Plus />New source</Button>} />
      <div className="space-y-8 py-6">
        <div className="divide-y border-y">{config.datasources.length ? config.datasources.map((source) => <div key={source.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><Database className="size-4 text-muted-foreground" /><div><div className="text-sm font-medium">{source.name}</div><div className="text-xs text-muted-foreground">{source.type === 'postgres' ? 'PostgreSQL' : 'MySQL'} · {source.host}:{source.port} / {source.database}</div></div></div><div className="flex items-center gap-2">{source.id === config.activeDatasourceId && <Badge variant="secondary">Active</Badge>}<Button size="sm" variant="outline" onClick={() => onEdit(source)}>Edit</Button>{source.id !== config.activeDatasourceId && <Button size="sm" onClick={() => onUse(source.id)}>Connect</Button>}</div></div>) : <div className="py-6 text-sm text-muted-foreground">No database connected. Demo data remains available.</div>}</div>
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onConnect() }}>
          <h3 className="text-sm font-medium">{draft.id ? `Edit ${draft.name}` : 'Add a data source'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display name"><Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Engine"><Select value={draft.type} onValueChange={(type) => setDraft({ ...draft, type, port: type === 'postgres' ? 5432 : 3306 })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="postgres">PostgreSQL</SelectItem><SelectItem value="mysql">MySQL</SelectItem></SelectContent></Select></Field>
            <Field label="Host"><Input required value={draft.host} onChange={(event) => setDraft({ ...draft, host: event.target.value })} /></Field>
            <Field label="Port"><Input required type="number" value={draft.port} onChange={(event) => setDraft({ ...draft, port: event.target.value })} /></Field>
            <Field label="Database"><Input required value={draft.database} onChange={(event) => setDraft({ ...draft, database: event.target.value })} /></Field>
            <Field label="User"><Input required value={draft.user} onChange={(event) => setDraft({ ...draft, user: event.target.value })} /></Field>
            <Field label="Password (visible)" className="col-span-2"><Input required type="text" autoComplete="off" spellCheck={false} value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={draft.ssl} onCheckedChange={(ssl) => setDraft({ ...draft, ssl: Boolean(ssl) })} /> Use SSL</label>
          {notice && <Alert variant={notice.error ? 'destructive' : 'default'}><AlertDescription>{notice.text}</AlertDescription></Alert>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onTest}>Test connection</Button><Button type="submit">Connect & use</Button></div>
        </form>
      </div>
    </section>
  )
}

function ConfigHeader({ title, description, action }) {
  return <header className="flex min-h-20 items-center justify-between border-b"><div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>{action}</header>
}

function DirectActions({ onEdit, onDelete }) {
  return <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>Remove</Button></div>
}

function ProjectTree({ projects, onAddProject, onAddBranch, onEdit, onDelete }) {
  const roots = projects.filter((item) => !item.parent_id)
  return (
    <section>
      <ConfigHeader title="Projects & branches" description="Projects contain branches. Tasks can be assigned to either level." action={<Button size="sm" onClick={onAddProject}><Plus />Project</Button>} />
      <div className="py-6">
        <div className="border-y">
          {roots.map((root) => {
            const branches = projects.filter((item) => item.parent_id === root.id)
            return <Collapsible key={root.id} defaultOpen>
              <div className="group flex h-14 items-center border-b px-1">
                <CollapsibleTrigger asChild><Button variant="ghost" size="icon-sm" className="mr-1 data-[state=open]:[&_svg]:rotate-90"><ChevronRight className="transition-transform" /></Button></CollapsibleTrigger>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{root.name}</div><div className="text-[10px] text-muted-foreground">{branches.length} {branches.length === 1 ? 'branch' : 'branches'}</div></div>
                <Button variant="ghost" size="sm" onClick={() => onAddBranch(root.id)}><Plus />Branch</Button>
                <DirectActions onEdit={() => onEdit(root.id)} onDelete={() => onDelete(root.id)} />
              </div>
              <CollapsibleContent>
                <div className="relative ml-5 border-l pl-7">
                  {branches.map((branch) => <div key={branch.id} className="relative flex h-11 items-center border-b last:border-b-0 before:absolute before:-left-7 before:top-1/2 before:w-5 before:border-t"><GitBranch className="mr-2 size-3.5 text-muted-foreground" /><span className="flex-1 text-sm">{branch.name}</span><DirectActions onEdit={() => onEdit(branch.id)} onDelete={() => onDelete(branch.id)} /></div>)}
                  {!branches.length && <button className="h-11 text-xs text-muted-foreground hover:text-foreground" onClick={() => onAddBranch(root.id)}>Add the first branch</button>}
                </div>
              </CollapsibleContent>
            </Collapsible>
          })}
          {!roots.length && <div className="py-8 text-sm text-muted-foreground">No projects configured.</div>}
        </div>
      </div>
    </section>
  )
}

function SimpleConfig({ type, items, onAdd, onEdit, onDelete, onShift }) {
  const columnMode = type === 'column'
  return <section><ConfigHeader title={columnMode ? 'Board columns' : 'Priorities'} description={columnMode ? 'Arranged horizontally to match the board.' : 'Use a small set of clear urgency levels.'} action={<Button size="sm" onClick={onAdd}><Plus />{columnMode ? 'Column' : 'Priority'}</Button>} /><div className="py-6"><div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col overflow-x-auto border-y">{items.map((item, index) => <div key={item.id} className="flex min-h-36 flex-col border-r p-4 first:border-l"><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: item.color }} /><span className="text-sm font-medium">{item.name}</span></div>{Number(item.is_todo) ? <Badge variant="secondary" className="mt-3 w-fit">Default To do</Badge> : <div className="flex-1" />}<div className="mt-auto flex flex-wrap items-center gap-1">{columnMode && <><Button variant="outline" size="sm" disabled={index === 0} onClick={() => onShift(item.id, -1)}><ArrowLeft />Left</Button><Button variant="outline" size="sm" disabled={index === items.length - 1} onClick={() => onShift(item.id, 1)}>Right<ArrowRight /></Button></>}<Button variant="ghost" size="sm" onClick={() => onEdit(item.id)}>Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>Remove</Button></div></div>)}</div></div></section>
}

function ConfigPage({ onBoard, ...props }) {
  const [tab, setTab] = useState('datasources')
  const tabs = [
    ['datasources', Database, 'Data sources'], ['columns', Columns3, 'Board columns'],
    ['projects', ListTree, 'Projects & branches'], ['priorities', Activity, 'Priorities'],
  ]
  return <main className="h-full overflow-y-auto"><div className="mx-auto max-w-7xl px-8 py-6"><header className="mb-6 flex items-center justify-between"><Button variant="outline" onClick={onBoard}><ArrowLeft />Board</Button><div className="flex items-center gap-4"><Tabs value={tab} onValueChange={setTab}><TabsList>{tabs.map(([id, Icon, label]) => <TabsTrigger key={id} value={id}><Icon />{label}</TabsTrigger>)}</TabsList></Tabs><span className="text-xs text-muted-foreground">v{APP_VERSION}</span></div></header><div className="min-w-0 border-t">
    {tab === 'datasources' && <DatasourceConfig {...props.datasourceProps} />}
    {tab === 'columns' && <SimpleConfig type="column" items={props.board.columns} {...props.columnProps} />}
    {tab === 'projects' && <ProjectTree projects={props.board.projects} {...props.projectProps} />}
    {tab === 'priorities' && <SimpleConfig type="priority" items={props.board.priorities} {...props.priorityProps} />}
  </div></div></main>
}

const colorPalette = ['#6d5dfc', '#3685e5', '#2f9d65', '#d99425', '#d45d40', '#bb3e5d', '#64748b', '#202020']

function ConfigItemDialog({ value, setValue, onSave, onOpenChange }) {
  if (!value) return null
  const hasColor = value.type === 'column' || value.type === 'priority'
  return <Dialog open={Boolean(value)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{value.id ? 'Edit' : 'Add'} {value.type}</DialogTitle><DialogDescription>{hasColor ? 'Set the name and color together.' : 'Enter a clear, concise name.'}</DialogDescription></DialogHeader><div className="grid gap-5"><Field label="Name"><Input autoFocus value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></Field>{hasColor && <Field label="Color palette"><div className="flex flex-wrap gap-2">{colorPalette.map((color) => <button key={color} type="button" className={cn('size-9 rounded-md border-2 transition-transform hover:scale-105', value.color === color ? 'border-foreground' : 'border-transparent')} style={{ background: color }} onClick={() => setValue({ ...value, color })} aria-label={`Use ${color}`} />)}</div></Field>}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!value.name.trim()} onClick={onSave}>Save</Button></DialogFooter></DialogContent></Dialog>
}

function ConfirmDeleteDialog({ target, onOpenChange, onConfirm }) {
  return <AlertDialog open={Boolean(target)} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove {target?.label || 'item'}?</AlertDialogTitle><AlertDialogDescription>{target?.type === 'task' ? 'The task and its subtasks will be soft deleted and hidden from the board.' : 'This change is applied immediately and cannot be undone from the interface.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onConfirm}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function FloatingNote({ open, setOpen, content, setContent, status }) {
  return <><Button className="fixed right-6 bottom-6 z-50 shadow-md" size="icon" onClick={() => setOpen(!open)} aria-label="Open note"><StickyNote /></Button>{open && <section className="fixed right-6 bottom-20 z-40 w-96 rounded-lg border bg-background shadow-xl"><header className="flex h-12 items-center justify-between border-b px-4"><div><h2 className="text-sm font-semibold">Workspace note</h2></div><div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{status}</span><Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close note"><X /></Button></div></header><div className="p-3"><Textarea className="min-h-64 resize-none border-0 p-1 text-sm shadow-none focus-visible:ring-0" placeholder="Write a note…" value={content} onChange={(event) => setContent(event.target.value)} /></div></section>}</>
}

function HistorySheet({ open, onOpenChange, board }) {
  const movements = [...board.movements].sort((a, b) => new Date(b.moved_at) - new Date(a.moved_at))
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent><SheetHeader><SheetTitle>Movement history</SheetTitle><SheetDescription>Every task creation and status change.</SheetDescription></SheetHeader><div className="mt-6 space-y-0">{movements.map((move) => { const item = board.tasks.find((task) => task.id === move.task_id); const from = board.columns.find((column) => column.id === move.from_column_id); const to = board.columns.find((column) => column.id === move.to_column_id); return <div key={move.id} className="relative border-l pb-6 pl-5 text-sm before:absolute before:top-1 before:-left-1 before:size-2 before:rounded-full before:bg-foreground"><p><span className="font-medium">{item?.title || 'Deleted task'}</span> <span className="text-muted-foreground">{from ? `moved from ${from.name} to` : 'was created in'}</span> <span className="font-medium">{to?.name || 'Unknown'}</span></p><time className="mt-1 block text-xs text-muted-foreground">{dateTime(move.moved_at)}</time></div> })}</div></SheetContent></Sheet>
}

export function App() {
  const [page, setPage] = useState('board')
  const [board, setBoard] = useState(loadDemo)
  const [config, setConfig] = useState({ activeDatasourceId: null, datasources: [] })
  const [demo, setDemo] = useState(true)
  const [taskValue, setTaskValue] = useState(null)
  const [taskOpen, setTaskOpen] = useState(false)
  const [lockedCreate, setLockedCreate] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [configEditor, setConfigEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteLoaded, setNoteLoaded] = useState(false)
  const [noteStatus, setNoteStatus] = useState('Saved')
  const [toast, setToast] = useState(null)
  const [notice, setNotice] = useState(null)
  const [draft, setDraft] = useState({ name: '', type: 'postgres', host: '127.0.0.1', port: 5432, database: '', user: '', password: '', ssl: false })

  const emptyDatasource = { name: '', type: 'postgres', host: '127.0.0.1', port: 5432, database: '', user: '', password: '', ssl: false }

  const notify = (text, error = false) => { setToast({ text, error }); setTimeout(() => setToast(null), 3000) }
  const persistDemo = (next) => { setBoard(next); localStorage.setItem('scrum-canvas-demo', JSON.stringify(next)) }

  useEffect(() => {
    api('/config').then(async (nextConfig) => {
      setConfig(nextConfig)
      if (nextConfig.activeDatasourceId) { setBoard(await api('/board')); setDemo(false) }
    }).catch(() => setDemo(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    setNoteLoaded(false)
    if (demo) {
      setNoteContent(localStorage.getItem('scrum-canvas-note') || '')
      setNoteLoaded(true)
      setNoteStatus('Saved locally')
      return () => { cancelled = true }
    }
    api('/note').then((note) => {
      if (cancelled) return
      setNoteContent(note.content || '')
      setNoteLoaded(true)
      setNoteStatus('Saved')
    }).catch((error) => {
      if (cancelled) return
      setNoteLoaded(true)
      setNoteStatus(error.message)
    })
    return () => { cancelled = true }
  }, [demo, config.activeDatasourceId])

  useEffect(() => {
    if (!noteLoaded) return undefined
    setNoteStatus('Saving…')
    const timer = setTimeout(async () => {
      try {
        if (demo) {
          localStorage.setItem('scrum-canvas-note', noteContent)
          setNoteStatus('Saved locally')
        } else {
          await api('/note', { method: 'PUT', body: { content: noteContent } })
          setNoteStatus('Saved')
        }
      } catch (error) { setNoteStatus(`Not saved: ${error.message}`) }
    }, 650)
    return () => clearTimeout(timer)
  }, [noteContent, noteLoaded, demo, config.activeDatasourceId])

  const newTask = () => {
    const todo = board.columns.find((item) => Number(item.is_todo)) || board.columns[0]
    setTaskValue({ title: '', content: '', requester: '', requested_at: '', expected_finish: '', project_id: '', priority_id: board.priorities[1]?.id || board.priorities[0]?.id, column_id: todo?.id, parent_id: '' })
    setLockedCreate(false)
    setTaskOpen(true)
  }
  const editTask = (item) => { setTaskValue({ ...item }); setLockedCreate(false); setTaskOpen(true) }
  const newSubtask = (parent) => {
    const todo = board.columns.find((item) => Number(item.is_todo)) || board.columns[0]
    setTaskValue({ title: '', content: '', requester: '', requested_at: '', expected_finish: '', project_id: parent.project_id || '', priority_id: board.priorities[1]?.id || board.priorities[0]?.id, column_id: todo?.id, parent_id: parent.id })
    setLockedCreate(true)
    setTaskOpen(true)
  }

  const saveTask = async () => {
    try {
      const payload = { ...taskValue, expected_finish: toDate(taskValue.expected_finish), requested_at: toDate(taskValue.requested_at), parent_id: taskValue.parent_id || null }
      let next = structuredClone(board)
      if (!taskValue.id) {
        if (demo) {
          const stamp = new Date().toISOString(); const created = { ...payload, id: newId(), created_at: stamp, updated_at: stamp, deleted_at: null }
          next.tasks.unshift(created); next.movements.unshift({ id: newId(), task_id: created.id, from_column_id: null, to_column_id: created.column_id, moved_at: stamp })
        } else {
          const created = await api('/tasks', { method: 'POST', body: payload }); next.tasks.unshift(created); next.movements.unshift({ id: newId(), task_id: created.id, from_column_id: null, to_column_id: created.column_id, moved_at: created.created_at })
        }
      } else {
        const index = next.tasks.findIndex((item) => item.id === taskValue.id); const oldColumn = next.tasks[index].column_id
        if (demo) {
          const stamp = new Date().toISOString(); next.tasks[index] = { ...next.tasks[index], ...payload, updated_at: stamp }
          if (oldColumn !== payload.column_id) next.movements.unshift({ id: newId(), task_id: taskValue.id, from_column_id: oldColumn, to_column_id: payload.column_id, moved_at: stamp })
        } else {
          const updated = await api(`/tasks/${taskValue.id}`, { method: 'PUT', body: payload }); next.tasks[index] = { ...next.tasks[index], ...updated }
          if (oldColumn !== payload.column_id) { const movement = await api(`/tasks/${taskValue.id}/move`, { method: 'POST', body: { columnId: payload.column_id } }); next.tasks[index].column_id = payload.column_id; next.movements.unshift({ ...movement, task_id: taskValue.id, id: newId() }) }
        }
      }
      demo ? persistDemo(next) : setBoard(next); setTaskOpen(false); notify('Task saved')
    } catch (error) { notify(error.message, true) }
  }

  const moveTask = async (id, target) => {
    try {
      const next = structuredClone(board); const item = next.tasks.find((task) => task.id === id); const from = item.column_id
      if (demo) { const stamp = new Date().toISOString(); item.column_id = target; item.updated_at = stamp; next.movements.unshift({ id: newId(), task_id: id, from_column_id: from, to_column_id: target, moved_at: stamp }); persistDemo(next) }
      else { const movement = await api(`/tasks/${id}/move`, { method: 'POST', body: { columnId: target } }); item.column_id = target; item.updated_at = movement.moved_at; next.movements.unshift({ ...movement, task_id: id, id: newId() }); setBoard(next) }
    } catch (error) { notify(error.message, true) }
  }

  const deleteTask = async (id) => {
    try { if (!demo) await api(`/tasks/${id}`, { method: 'DELETE' }); const childIds = board.tasks.filter((item) => item.parent_id === id).map((item) => item.id); const next = { ...board, tasks: board.tasks.filter((item) => item.id !== id && !childIds.includes(item.id)) }; demo ? persistDemo(next) : setBoard(next); setTaskOpen(false); notify('Task soft deleted') } catch (error) { notify(error.message, true) }
  }

  const testSource = async () => { try { setNotice({ text: 'Testing connection and inspecting the schema…' }); const result = await api('/datasources/test', { method: 'POST', body: { ...draft, port: Number(draft.port) } }); setNotice({ text: result.inspection.valid ? 'Connection works and the Scrum schema is ready.' : `Connection works. ${result.inspection.missingTables.length} tables will be created.` }) } catch (error) { setNotice({ text: error.message, error: true }) } }
  const connectSource = async () => { try { setNotice({ text: 'Connecting and preparing the schema…' }); const result = await api('/datasources', { method: 'POST', body: { ...draft, port: Number(draft.port) } }); setConfig(result.config); setBoard(result.board); setDemo(false); setNotice({ text: 'Connected. The board is ready.' }); notify(draft.id ? 'Data source updated' : 'Data source connected') } catch (error) { setNotice({ text: error.message, error: true }) } }
  const useSource = async (id) => { try { const result = await api(`/datasources/${id}/connect`, { method: 'POST' }); setConfig(result.config); setBoard(result.board); setDemo(false); notify('Data source connected') } catch (error) { notify(error.message, true) } }

  const saveConfigImmediately = async (next) => {
    try {
      if (demo) persistDemo(next)
      else setBoard(await api('/board-config', { method: 'PUT', body: { columns: next.columns, projects: next.projects, priorities: next.priorities } }))
      notify('Configuration updated')
    } catch (error) { notify(error.message, true) }
  }

  const openAddConfig = (type, parentId = null) => setConfigEditor({ type, id: null, name: '', color: '#6d5dfc', parentId })
  const openEditConfig = (type, id) => {
    const list = type === 'column' ? board.columns : type === 'priority' ? board.priorities : board.projects
    const item = list.find((entry) => entry.id === id)
    setConfigEditor({ type, id, name: item.name, color: item.color || '#6d5dfc', parentId: item.parent_id || null })
  }
  const saveConfigEditor = async () => {
    const next = structuredClone(board)
    const listName = configEditor.type === 'column' ? 'columns' : configEditor.type === 'priority' ? 'priorities' : 'projects'
    if (configEditor.id) {
      const item = next[listName].find((entry) => entry.id === configEditor.id)
      item.name = configEditor.name.trim()
      if (configEditor.type !== 'project') item.color = configEditor.color
    } else if (configEditor.type === 'column') next.columns.push({ id: newId(), name: configEditor.name.trim(), color: configEditor.color, position: next.columns.length, is_todo: 0, created_at: new Date().toISOString() })
    else if (configEditor.type === 'priority') next.priorities.push({ id: newId(), name: configEditor.name.trim(), color: configEditor.color, position: next.priorities.length, created_at: new Date().toISOString() })
    else next.projects.push({ id: newId(), name: configEditor.name.trim(), parent_id: configEditor.parentId, created_at: new Date().toISOString() })
    setConfigEditor(null)
    await saveConfigImmediately(next)
  }
  const requestDeleteConfig = (type, id) => {
    const used = type === 'column' ? board.tasks.some((item) => item.column_id === id) : type === 'priority' ? board.tasks.some((item) => item.priority_id === id) : board.tasks.some((item) => item.project_id === id)
    if (used) return notify(`This ${type} is used by an active task`, true)
    if (type === 'column' && board.columns.find((item) => item.id === id)?.is_todo) return notify('The default To do column cannot be removed', true)
    setDeleteTarget({ type, id, label: type })
  }
  const confirmDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    if (target.type === 'task') return deleteTask(target.id)
    const next = structuredClone(board)
    if (target.type === 'column') next.columns = next.columns.filter((item) => item.id !== target.id)
    if (target.type === 'priority') next.priorities = next.priorities.filter((item) => item.id !== target.id)
    if (target.type === 'project') next.projects = next.projects.filter((item) => item.id !== target.id && item.parent_id !== target.id)
    await saveConfigImmediately(next)
  }
  const shiftColumn = async (id, direction) => { const next = structuredClone(board); const index = next.columns.findIndex((item) => item.id === id); const target = index + direction; if (target < 0 || target >= next.columns.length) return; [next.columns[index], next.columns[target]] = [next.columns[target], next.columns[index]]; next.columns.forEach((item, position) => { item.position = position }); await saveConfigImmediately(next) }

  const configProps = {
    datasourceProps: { config, draft, setDraft, notice, onTest: testSource, onConnect: connectSource, onUse: useSource, onNew: () => { setDraft(emptyDatasource); setNotice(null) }, onEdit: (source) => { const { hasSavedPassword: _saved, ...editable } = source; setDraft({ ...editable, ssl: Boolean(editable.ssl) }); setNotice(null) } },
    columnProps: { onAdd: () => openAddConfig('column'), onEdit: (id) => openEditConfig('column', id), onDelete: (id) => requestDeleteConfig('column', id), onShift: shiftColumn },
    projectProps: { onAddProject: () => openAddConfig('project'), onAddBranch: (id) => openAddConfig('project', id), onEdit: (id) => openEditConfig('project', id), onDelete: (id) => requestDeleteConfig('project', id) },
    priorityProps: { onAdd: () => openAddConfig('priority'), onEdit: (id) => openEditConfig('priority', id), onDelete: (id) => requestDeleteConfig('priority', id), onShift: () => {} },
  }

  return <TooltipProvider><div className="h-full min-w-[1024px] bg-background">{page === 'board' ? <BoardPage board={board} onNew={newTask} onNewSubtask={newSubtask} onEdit={editTask} onMove={moveTask} onHistory={() => setHistoryOpen(true)} onConfig={() => setPage('config')} /> : <ConfigPage board={board} onBoard={() => setPage('board')} {...configProps} />}<TaskDialog open={taskOpen} onOpenChange={setTaskOpen} value={taskValue} setValue={setTaskValue} board={board} onSave={saveTask} onDelete={() => setDeleteTarget({ type: 'task', id: taskValue.id, label: 'task' })} onOpenTask={editTask} onMove={moveTask} onNewSubtask={newSubtask} lockedCreate={lockedCreate} /><ConfigItemDialog value={configEditor} setValue={setConfigEditor} onSave={saveConfigEditor} onOpenChange={(open) => { if (!open) setConfigEditor(null) }} /><ConfirmDeleteDialog target={deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} onConfirm={confirmDelete} /><HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} board={board} /><FloatingNote open={noteOpen} setOpen={setNoteOpen} content={noteContent} setContent={setNoteContent} status={noteStatus} /><Toast toast={toast} /></div></TooltipProvider>
}
