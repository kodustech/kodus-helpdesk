import { UserRole } from '../../../config/enums';
import { UserModel } from '../../users/entities/user.model';

const INTERNAL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR];
const CUSTOMER_ROLES = [
    UserRole.CUSTOMER_OWNER,
    UserRole.CUSTOMER_ADMIN,
    UserRole.CUSTOMER_EDITOR,
];

/**
 * Determines which roles a given user role can create/invite.
 */
export function getCreatableRoles(role: UserRole): UserRole[] {
    switch (role) {
        case UserRole.OWNER:
            return [
                UserRole.OWNER,
                UserRole.ADMIN,
                UserRole.EDITOR,
                UserRole.CUSTOMER_OWNER,
                UserRole.CUSTOMER_ADMIN,
                UserRole.CUSTOMER_EDITOR,
            ];
        case UserRole.ADMIN:
            return [
                UserRole.EDITOR,
                UserRole.CUSTOMER_ADMIN,
                UserRole.CUSTOMER_EDITOR,
            ];
        case UserRole.CUSTOMER_OWNER:
            return [UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_EDITOR];
        case UserRole.CUSTOMER_ADMIN:
            return [UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_EDITOR];
        default:
            return [];
    }
}

/**
 * Checks if requestingUser can assign/change targetRole.
 * For customer roles, also validates workspace match.
 */
export function canManageRole(
    requestingUser: UserModel,
    targetRole: UserRole,
    targetCustomerId?: string,
): boolean {
    const creatableRoles = getCreatableRoles(requestingUser.role);

    if (!creatableRoles.includes(targetRole)) {
        // Special case: admin can promote editor to admin
        if (
            requestingUser.role === UserRole.ADMIN &&
            targetRole === UserRole.ADMIN
        ) {
            return true;
        }
        return false;
    }

    // Customer roles can only manage within their own workspace
    if (CUSTOMER_ROLES.includes(requestingUser.role)) {
        if (
            !targetCustomerId ||
            !requestingUser.customer ||
            requestingUser.customer.uuid !== targetCustomerId
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Checks if requestingUser can remove targetUser.
 */
export function canRemoveUser(
    requestingUser: UserModel,
    targetUser: UserModel,
): boolean {
    // Customer-owner cannot be removed
    if (targetUser.role === UserRole.CUSTOMER_OWNER) {
        return false;
    }

    // Cannot remove yourself
    if (requestingUser.uuid === targetUser.uuid) {
        return false;
    }

    // Owner can remove anyone (except customer-owner, handled above)
    if (requestingUser.role === UserRole.OWNER) {
        return true;
    }

    // Admin can remove editors and customer users
    if (requestingUser.role === UserRole.ADMIN) {
        return [
            UserRole.EDITOR,
            UserRole.CUSTOMER_ADMIN,
            UserRole.CUSTOMER_EDITOR,
        ].includes(targetUser.role);
    }

    // Customer-owner can remove customer-admin and customer-editor in same workspace
    if (requestingUser.role === UserRole.CUSTOMER_OWNER) {
        return (
            [UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_EDITOR].includes(
                targetUser.role,
            ) &&
            requestingUser.customer?.uuid === targetUser.customer?.uuid
        );
    }

    // Customer-admin can remove customer-admin and customer-editor in same workspace
    if (requestingUser.role === UserRole.CUSTOMER_ADMIN) {
        return (
            [UserRole.CUSTOMER_ADMIN, UserRole.CUSTOMER_EDITOR].includes(
                targetUser.role,
            ) &&
            requestingUser.customer?.uuid === targetUser.customer?.uuid
        );
    }

    return false;
}

/**
 * Checks if requestingUser can change targetUser's role to newRole.
 */
export function canChangeRole(
    requestingUser: UserModel,
    targetUser: UserModel,
    newRole: UserRole,
): boolean {
    // Only owner can change another user to owner
    if (newRole === UserRole.OWNER && requestingUser.role !== UserRole.OWNER) {
        return false;
    }

    // Only owner can edit admin roles
    if (
        targetUser.role === UserRole.ADMIN &&
        requestingUser.role !== UserRole.OWNER
    ) {
        return false;
    }

    // Only owner can edit owner roles
    if (
        targetUser.role === UserRole.OWNER &&
        requestingUser.role !== UserRole.OWNER
    ) {
        return false;
    }

    // Admin can promote editor → admin
    if (
        requestingUser.role === UserRole.ADMIN &&
        targetUser.role === UserRole.EDITOR &&
        newRole === UserRole.ADMIN
    ) {
        return true;
    }

    return canManageRole(
        requestingUser,
        newRole,
        targetUser.customer?.uuid,
    );
}
