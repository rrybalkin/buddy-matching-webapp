/**
 * Utility functions for role display formatting
 */

/**
 * Formats a role for display in the UI
 * Converts role to a user-friendly format
 */
export function formatRoleForDisplay(role: string): string {
  switch (role) {
    case 'HR':
      return 'HR'
    case 'BUDDY':
      return 'Buddy'
    case 'NEWCOMER':
      return 'Newcomer'
    case 'RELOCATED_EMPLOYEE':
      return 'Relocated Employee'
    case 'EXISTING_EMPLOYEE':
      return 'Existing Employee'
    default:
      return role
  }
}
