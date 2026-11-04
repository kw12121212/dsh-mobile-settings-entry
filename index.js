/**
 * Host half of dsh-mobile-settings-entry.
 *
 * The plugin has no host-side service: it only adds a client UI entry. This
 * module exists so the bundle patch has a package root to mount.
 */

export const name = 'dsh-mobile-settings-entry';

export function apply() {
  // Nothing to do on the host.
}
