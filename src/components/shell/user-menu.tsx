"use client";

import { signOutAction } from "./logout-action";
import {
  DropdownItemLink,
  DropdownMenu,
  DropdownSeparator,
  useDropdownClose,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  fullName: string;
  initials: string;
}

/** "Sair" como `menuitem` que submete a server action de logout (F-04). */
function LogoutMenuItem() {
  const close = useDropdownClose();
  return (
    <form action={signOutAction}>
      <button
        role="menuitem"
        type="submit"
        onClick={() => close()}
        className="px-md py-sm text-body-sm text-on-surface hover:bg-surface-container-highest gap-sm flex w-full items-center text-left"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          logout
        </span>
        Sair
      </button>
    </form>
  );
}