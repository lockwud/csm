"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "./Input";
import { Button } from "./Button";

export function SearchBar({ placeholder = "Search" }: { placeholder?: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
      <Input className="pl-9 pr-9" placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} />
      {value ? (
        <Button className="absolute right-1 top-1 h-8 w-8" size="icon" variant="ghost" onClick={() => setValue("")} aria-label="Clear search">
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
