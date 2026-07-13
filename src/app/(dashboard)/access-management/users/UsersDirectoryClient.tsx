"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  profile?: { jobTitle?: string | null } | null;
  client?: { businessName: string } | null;
  rider?: { zone: string } | null;
};

const roles = ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE", "CLIENT", "RIDER"];
const statuses = ["ACTIVE", "INVITED", "SUSPENDED"];

function SoftDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <details className="group relative">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg bg-slate-100 px-3 text-sm font-bold text-text shadow-sm ring-1 ring-border transition hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
          <span className="truncate">{value.replaceAll("_", " ")}</span>
          <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={(event) => {
                onChange(option);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className={option === value ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}
            >
              <Check className={option === value ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              {option.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </details>
    </label>
  );
}

function accountContextFor(user: ManagedUser) {
  if (user.client) return `Client account: ${user.client.businessName}`;
  if (user.rider) return `Rider zone: ${user.rider.zone}`;
  return user.profile?.jobTitle ?? "Internal staff";
}

function emptyForm() {
  return {
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "ADMIN",
    status: "ACTIVE",
    department: "",
    password: "",
  };
}

export function UsersDirectoryClient({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const editing = Boolean(form.id);

  const sortedUsers = useMemo(() => users, [users]);

  function openCreate() {
    setMessage(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setMessage(null);
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      status: user.status,
      department: user.client?.businessName ?? user.rider?.zone ?? user.profile?.jobTitle ?? "",
      password: "",
    });
    setOpen(true);
  }

  async function saveUser() {
    setSaving(true);
    setMessage(null);
    const payload = { ...form, password: form.password || undefined };
    const response = await fetch(editing ? `/api/users/${form.id}` : "/api/users", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.ok) {
      setMessage(result.error ?? "Unable to save user.");
      return;
    }

    const nextUser = editing ? result.data : result.data.user;
    setUsers((items) => editing ? items.map((item) => item.id === nextUser.id ? nextUser : item) : [nextUser, ...items]);
    setOpen(false);
    if (result.data?.temporaryPassword) setMessage(`User created. Temporary password: ${result.data.temporaryPassword}`);
  }

  async function deleteUser(user: ManagedUser) {
    if (!confirm(`Delete ${user.name}?`)) return;
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (response.ok) setUsers((items) => items.filter((item) => item.id !== user.id));
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Directory</h1>
          <p className="text-sm text-text-muted">Manage platform users, roles, and access status.</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Users are login accounts. Clients are customer/business courier profiles.</p>
          {message ? <p className="mt-2 text-sm font-bold text-brand">{message}</p> : null}
        </div>
        <Button type="button" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Create User</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr_96px] bg-brand px-4 py-3 text-sm font-bold text-white">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Account Type</span>
          <span />
        </div>
        <div className="max-h-[640px] overflow-y-auto">
          {sortedUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr_96px] items-center border-b border-border px-4 py-3 text-sm">
              <strong>{user.name}</strong>
              <span className="truncate">{user.email}</span>
              <span>{user.role.replaceAll("_", " ")}</span>
              <span className="truncate text-text-muted">{accountContextFor(user)}</span>
              <div className="flex justify-end gap-1">
                <button type="button" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => deleteUser(user)} aria-label={`Delete ${user.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold">{editing ? "Edit User" : "Create User"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 rounded-lg border border-border px-3 outline-none focus:border-brand" /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-lg border border-border px-3 outline-none focus:border-brand" /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-lg border border-border px-3 outline-none focus:border-brand" /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Staff Title / Client Business / Rider Zone<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-10 rounded-lg border border-border px-3 outline-none focus:border-brand" /></label>
              <SoftDropdown label="Role" value={form.role} options={roles} onChange={(role) => setForm({ ...form, role })} />
              <SoftDropdown label="Status" value={form.status} options={statuses} onChange={(status) => setForm({ ...form, status })} />
              <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank to keep current password" : "Blank creates a temporary password"} className="h-10 rounded-lg border border-border px-3 outline-none focus:border-brand" /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" loading={saving} onClick={saveUser}>{editing ? "Save Changes" : "Create User"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
