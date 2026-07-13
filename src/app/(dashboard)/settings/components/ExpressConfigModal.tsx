"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";

export function ExpressConfigModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Express config</Button>
      <Modal open={open} title="Express Configuration" onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>Save configuration</Button>}>
        <div className="grid gap-4">
          <Input label="Base Rate" type="number" defaultValue="35" />
          <Input label="Minimum Distance" type="number" defaultValue="1" />
          <Input label="Maximum Distance" type="number" defaultValue="25" />
          <Input label="Time Limit" defaultValue="90 minutes" />
          <Switch checked label="Active" />
        </div>
      </Modal>
    </>
  );
}
