import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { settingsApis } from "../../Axios/SettingsApi";
import { getRequestPayload } from "../../Utils/requestPayload";

type ApiRecord = Record<string, unknown>;

interface PermissionContextValue {
  loading: boolean;
  isLoaded: boolean;
  isAdmin: boolean;
  can: (permission: string) => boolean;
  hasPermission: (permission?: string) => boolean;
  canAccessModule: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue>({
  loading: true,
  isLoaded: false,
  isAdmin: false,
  can: () => true,
  hasPermission: () => true,
  canAccessModule: () => true,
  refreshPermissions: async () => undefined,
});

const valueOf = (record: ApiRecord, aliases: string[]) => {
  const key = Object.keys(record).find((candidate) =>
    aliases.some((alias) => alias.toLowerCase() === candidate.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const slug = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^bills-and-receipts$/, "bills-and-receipts");

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findMenuRows = (response: unknown): ApiRecord[] => {
  const queue: Array<{ value: unknown; depth: number }> = [
    { value: parseJson(response), depth: 0 },
  ];
  const rowsById = new Map<string, ApiRecord>();
  const visited = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 6 || current.value == null) continue;
    const parsed = parseJson(current.value);
    if (Array.isArray(parsed)) {
      const rows = parsed.filter(
        (item): item is ApiRecord => Boolean(item) && typeof item === "object",
      );
      rows.forEach((row, index) => {
        const title = valueOf(row, [
            "cMenuName",
            "menuName",
            "cDisplayName",
            "displayName",
            "title",
            "label",
            "cName",
            "name",
          ]);
        if (title) {
          const id = String(
            valueOf(row, ["nMenuId", "menuId", "nId", "id", "key"]) ??
              `${current.depth}-${index}-${slug(title)}`,
          );
          rowsById.set(id, row);
        }
        queue.push({ value: row, depth: current.depth + 1 });
      });
      continue;
    }
    if (typeof parsed !== "object" || visited.has(parsed)) continue;
    visited.add(parsed);
    Object.values(parsed as ApiRecord).forEach((value) =>
      queue.push({ value, depth: current.depth + 1 }),
    );
  }

  return [...rowsById.values()];
};

const getCurrentUserType = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const type = Number(
          source?.nType ??
            source?.nUserType ??
            source?.userDetails?.nType ??
            source?.agentDetails?.nType,
        );
        if (Number.isFinite(type)) return type;
      } catch {
        // Ignore malformed session data.
      }
    }
  }
  return -1;
};

const findMenusValue = (response: unknown): unknown => {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();
  while (queue.length) {
    const current = parseJson(queue.shift());
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const record = current as ApiRecord;
    const menus = valueOf(record, ["cMenus", "menus", "menuIds", "cMenuIds"]);
    if (menus !== undefined) return menus;
    Object.values(record).forEach((value) => queue.push(value));
  }
  return undefined;
};

const selectedIdsFrom = (response: unknown, rows: ApiRecord[]) => {
  const selected = new Set<string>();
  const menusValue = parseJson(findMenusValue(response));
  const menuItems = Array.isArray(menusValue)
    ? menusValue
    : typeof menusValue === "string"
      ? menusValue.split(",")
      : [];

  menuItems.forEach((item) => {
    const id =
      item && typeof item === "object"
        ? valueOf(item as ApiRecord, ["nMenuId", "menuId", "id", "key"])
        : item;
    if (id !== undefined && id !== null && String(id).trim()) {
      selected.add(String(id).trim());
    }
  });

  rows.forEach((row) => {
    const checked = valueOf(row, [
      "bChecked",
      "checked",
      "isChecked",
      "bSelected",
      "selected",
      "isSelected",
      "bRight",
      "hasRight",
      "bMenuRight",
    ]);
    if (checked === true || checked === 1 || String(checked).toLowerCase() === "true") {
      const id = valueOf(row, ["nMenuId", "menuId", "nId", "id", "key"]);
      if (id !== undefined && id !== null) selected.add(String(id));
    }
  });
  return selected;
};

const permissionSetFrom = (response: unknown) => {
  const rows = findMenuRows(response);
  if (!rows.length) return { enforced: false, permissions: new Set<string>() };

  const titles = new Map<string, string>();
  const parents = new Map<string, string>();
  const selected = selectedIdsFrom(response, rows);

  const addRows = (items: ApiRecord[], nestedParent?: string) => {
    items.forEach((row, index) => {
      const id = String(
        valueOf(row, ["nMenuId", "menuId", "nId", "id", "key"]) ??
          `${nestedParent ?? "menu"}-${index}`,
      );
      const title = valueOf(row, [
        "cMenuName",
        "menuName",
        "cDisplayName",
        "displayName",
        "title",
        "label",
        "cName",
        "name",
      ]);
      if (title) titles.set(id, slug(title));
      const explicitParent = valueOf(row, [
        "nParentMenuId",
        "parentMenuId",
        "nParentId",
        "parentId",
      ]);
      if (explicitParent !== undefined && explicitParent !== null && Number(explicitParent) !== 0) {
        parents.set(id, String(explicitParent));
      } else if (nestedParent) {
        parents.set(id, nestedParent);
      }
      const children = parseJson(
        valueOf(row, ["children", "childMenus", "subMenus", "items", "lMenu"]),
      );
      if (Array.isArray(children)) addRows(children as ApiRecord[], id);
    });
  };
  addRows(rows);

  const pathFor = (id: string, seen = new Set<string>()): string => {
    if (seen.has(id)) return titles.get(id) ?? "";
    seen.add(id);
    const own = titles.get(id) ?? "";
    const parent = parents.get(id);
    const parentPath = parent ? pathFor(parent, seen) : "";
    return [parentPath, own].filter(Boolean).join(".");
  };

  const permissions = new Set<string>();
  selected.forEach((id) => {
    const path = pathFor(id);
    if (!path) return;
    const segments = path.split(".");
    segments.forEach((_, index) =>
      permissions.add(segments.slice(0, index + 1).join(".")),
    );
  });

  return { enforced: true, permissions };
};

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [enforced, setEnforced] = useState(false);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const isAdmin = useMemo(() => [0, 1].includes(getCurrentUserType()), []);

  const refreshPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const payload = getRequestPayload();
      const response = await settingsApis.getMenuRights({
        ...payload,
        nAgentId: Number(payload.nAgentId ?? payload.id ?? 0),
      });
      const next = permissionSetFrom(response);
      setEnforced(next.enforced);
      setPermissions(next.permissions);
    } catch {
      // Do not lock the application when the rights service is unavailable.
      setEnforced(false);
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  const value = useMemo<PermissionContextValue>(() => {
    const normalize = (permission: string) =>
      permission
        .split(".")
        .map(slug)
        .filter(Boolean)
        .join(".");
    const hasPermission = (permission?: string) => {
      if (isAdmin || !permission || !enforced) return true;
      return permissions.has(normalize(permission));
    };
    return {
      loading,
      isLoaded: !loading,
      isAdmin,
      can: hasPermission,
      hasPermission,
      canAccessModule: (permission) => {
        if (isAdmin || !enforced) return true;
        const normalized = normalize(permission);
        return [...permissions].some(
          (item) => item === normalized || item.startsWith(`${normalized}.`),
        );
      },
      refreshPermissions,
    };
  }, [enforced, isAdmin, loading, permissions, refreshPermissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
