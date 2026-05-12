import { UserRole } from "../databases/schema";

const VALID: readonly UserRole[] = ["customer", "support", "admin"];

export const parseRole = function(value: unknown) {
    if (typeof value === "string" && (VALID as readonly string[]).includes(value)) {
        return value as UserRole;
    }

    return 'customer';
}

export const isAdmin = function(role: UserRole) {
    return role === 'admin';
}

export const isStaff = function(role: UserRole) {
    return role === 'support' || role === 'admin';
}