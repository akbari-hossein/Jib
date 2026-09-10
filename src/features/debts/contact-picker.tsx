"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ContactAvatar } from "@/features/debts/contact-avatar";
import type { ContactOption } from "@/features/debts/types";

export function ContactPicker({
  contacts,
  name = "contactName",
  idName = "contactId",
  selectedId,
  onSelect,
  placeholder = "جستجو یا نام جدید",
}: {
  contacts: ContactOption[];
  name?: string;
  idName?: string;
  selectedId?: string;
  onSelect?: (contact: ContactOption | { id: ""; name: string }) => void;
  placeholder?: string;
}) {
  const selected = contacts.find((contact) => contact.id === selectedId);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [pickedId, setPickedId] = useState(selectedId ?? "");

  const matches = useMemo(() => {
    const needle = query.trim();
    if (!needle) {
      return contacts.slice(0, 8);
    }
    return contacts
      .filter((contact) => contact.name.includes(needle))
      .slice(0, 8);
  }, [contacts, query]);

  const exact = contacts.some((contact) => contact.name === query.trim());
  const canCreate = query.trim().length > 0 && !exact;

  function pick(contact: ContactOption) {
    setQuery(contact.name);
    setPickedId(contact.id);
    onSelect?.(contact);
  }

  function createNew() {
    const nameValue = query.trim();
    setPickedId("");
    onSelect?.({ id: "", name: nameValue });
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={idName} value={pickedId} />
      <input type="hidden" name={name} value={pickedId ? "" : query.trim()} />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPickedId("");
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      <ul className="overflow-hidden rounded-2xl border border-border bg-card">
        {matches.map((contact) => (
          <li key={contact.id}>
            <button
              type="button"
              onClick={() => pick(contact)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm hover:bg-surface-muted"
            >
              <ContactAvatar name={contact.name} color={contact.color} size="sm" />
              {contact.name}
            </button>
          </li>
        ))}
        {canCreate ? (
          <li>
            <button
              type="button"
              onClick={createNew}
              className="w-full px-3 py-2.5 text-start text-sm text-primary hover:bg-surface-muted"
            >
              افزودن «{query.trim()}»
            </button>
          </li>
        ) : null}
        {matches.length === 0 && !canCreate ? (
          <li className="px-3 py-2.5 text-sm text-muted-foreground">هنوز کسی ذخیره نشده.</li>
        ) : null}
      </ul>
    </div>
  );
}
