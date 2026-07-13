"use client";

import { useState } from "react";
import type { UserRole } from "@prisma/client";
import { ChevronDown, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { ROLE_LABELS, ROLES } from "@/lib/constants/roles";

const modules = [
  "Dashboard",
  "Orders",
  "Clients",
  "Dispatch Manifests",
  "Rider Management",
  "Finance",
  "Support",
  "Reports",
  "Settings",
];

const permissions = [
  "Can view records",
  "Can create records",
  "Can update records",
  "Can delete records",
  "Can export reports",
];

type PermissionMatrix = Record<string, Record<string, Record<string, boolean>>>;

function defaultMatrix(): PermissionMatrix {
  return Object.fromEntries(
    ROLES.map((role) => [
      role,
      Object.fromEntries(
        modules.map((module) => [
          module,
          Object.fromEntries(permissions.map((permission, index) => [permission, role === "SUPER_ADMIN" || index < 3])),
        ]),
      ),
    ]),
  );
}

function normalizeMatrix(value: unknown) {
  const defaults = defaultMatrix();
  if (!value || typeof value !== "object") return defaults;
  const stored = value as PermissionMatrix;

  return Object.fromEntries(
    ROLES.map((role) => [
      role,
      Object.fromEntries(
        modules.map((module) => [
          module,
          Object.fromEntries(
            permissions.map((permission) => [
              permission,
              Boolean(stored[role]?.[module]?.[permission] ?? defaults[role]?.[module]?.[permission]),
            ]),
          ),
        ]),
      ),
    ]),
  );
}

async function savePermissions(value: PermissionMatrix) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "role_permissions", label: "Role Permissions", value }),
  });
  if (!response.ok) throw new Error("Unable to save role permissions.");
}

export function PermissionsClient({ initialPermissions }: { initialPermissions: unknown }) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("DISPATCHER");
  const [selectedModule, setSelectedModule] = useState(modules[1]);
  const [matrix, setMatrix] = useState(() => normalizeMatrix(initialPermissions));
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  async function toggle(permission: string, active: boolean) {
    const next = {
      ...matrix,
      [selectedRole]: {
        ...matrix[selectedRole],
        [selectedModule]: {
          ...matrix[selectedRole]?.[selectedModule],
          [permission]: active,
        },
      },
    };
    setMatrix(next);
    setStatus("saving");
    setMessage("Saving permissions...");
    try {
      await savePermissions(next);
      setStatus("saved");
      setMessage("Permissions saved.");
    } catch {
      setStatus("error");
      setMessage("Unable to save permissions.");
    }
  }

  async function applyChanges() {
    setStatus("saving");
    setMessage("Saving permissions...");
    try {
      await savePermissions(matrix);
      setStatus("saved");
      setMessage("Permissions saved.");
    } catch {
      setStatus("error");
      setMessage("Unable to save permissions.");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-sm text-text-muted">Assign and manage access levels for Sankofa Express users.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              aria-label="Role"
              aria-expanded={roleMenuOpen}
              onClick={() => setRoleMenuOpen((value) => !value)}
              className="flex h-11 min-w-56 items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 text-sm font-bold text-brand shadow-sm transition hover:border-brand focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <span>{ROLE_LABELS[selectedRole]}</span>
              <ChevronDown className={roleMenuOpen ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} />
            </button>
            {roleMenuOpen ? (
              <div className="absolute right-0 top-full z-30 mt-3 w-56 overflow-hidden rounded-xl border border-border bg-white p-2 shadow-xl">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setRoleMenuOpen(false);
                    }}
                    className={role === selectedRole ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-3 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-text-muted hover:bg-slate-50 hover:text-brand"}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {message ? (
            <span className={status === "error" ? "text-sm font-bold text-danger" : "text-sm font-bold text-brand"}>
              {message}
            </span>
          ) : null}
          <Button leftIcon={<Save className="h-4 w-4" />} onClick={applyChanges} loading={status === "saving"}>
            {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Apply Changes"}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={role === selectedRole ? "rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white" : "rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-muted"}
            >
              {ROLE_LABELS[role].split(" ").slice(0, 3).join(" ")}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid grid-cols-[260px_1fr_160px] bg-slate-100 text-sm font-bold text-text-muted">
            <div className="border-r border-border p-4">Modules</div>
            <div className="border-r border-border p-4">Items</div>
            <div className="p-4">Access</div>
          </div>
          <div className="grid grid-cols-[260px_1fr_160px]">
            <div className="border-r border-border bg-slate-50 p-3">
              {modules.map((module) => (
                <button
                  key={module}
                  type="button"
                  onClick={() => setSelectedModule(module)}
                  className={module === selectedModule ? "w-full rounded-md bg-brand px-3 py-2 text-left text-sm font-bold text-white" : "w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-brand"}
                >
                  {module}
                </button>
              ))}
            </div>
            <div className="border-r border-border">
              {permissions.map((permission) => (
                <div key={permission} className="border-b border-border p-4">
                  <strong className="text-sm">{permission}</strong>
                  <p className="text-xs text-text-muted">Allows {ROLE_LABELS[selectedRole].toLowerCase()} to {permission.toLowerCase()} in {selectedModule.toLowerCase()}.</p>
                </div>
              ))}
            </div>
            <div>
              {permissions.map((permission) => (
                <div key={permission} className="grid h-[73px] place-items-center border-b border-border">
                  <Switch checked={Boolean(matrix[selectedRole]?.[selectedModule]?.[permission])} onChange={(active) => toggle(permission, active)} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {message ? <p className={status === "error" ? "mt-3 text-sm font-semibold text-danger" : "mt-3 text-sm font-semibold text-brand"}>{message}</p> : null}
      </Card>
    </div>
  );
}
