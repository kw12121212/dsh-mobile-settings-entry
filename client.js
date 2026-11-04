/**
 * Client half of dsh-mobile-settings-entry.
 *
 * dsh-mobile mounts its「移动访问」control button into the sidebar footer
 * (`sidebar.footer.action`). On narrow windows or long Bot lists that footer
 * scrolls out of sight, so this plugin adds a parallel entry inside
 * Settings → General. The entry does not re-implement the panel; it forwards a
 * click to dsh-mobile's own trigger button, so pairing, device management and
 * future panel changes keep working unchanged.
 */
window.__ModuleLoader__.load({
  id: 'dsh-mobile-settings-entry',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var react = require('react');

    var name = 'dsh-mobile-settings-entry';
    var TRIGGER_SELECTOR = '.dsh-mobile-control__trigger';

    /** Forward a click to dsh-mobile's sidebar trigger; false when it is absent. */
    function openMobilePanel() {
      var trigger = document.querySelector(TRIGGER_SELECTOR);
      if (trigger === null) return false;
      trigger.click();
      return true;
    }

    function MobileAccessSettingsItem() {
      var state = react.useState('idle');
      var status = state[0];
      var setStatus = state[1];

      var onClick = function () {
        setStatus(openMobilePanel() ? 'opened' : 'missing');
      };

      var hint = status === 'missing'
        ? '没有找到 dsh-mobile 的入口按钮，请确认该插件已启用。'
        : status === 'opened'
          ? '已打开面板；配对二维码在「远程访问」标签里。'
          : '生成配对码、查看已配对设备，都在这里打开。';

      return react.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '12px 0',
          borderTop: '1px solid rgba(127, 127, 127, 0.18)'
        }
      }, [
        react.createElement('div', { key: 'copy', style: { minWidth: 0 } }, [
          react.createElement('div', {
            key: 'title',
            style: { fontSize: '14px', fontWeight: 500 }
          }, '移动访问'),
          react.createElement('div', {
            key: 'hint',
            style: { fontSize: '12px', opacity: 0.65, marginTop: '2px' }
          }, hint)
        ]),
        react.createElement('button', {
          key: 'action',
          type: 'button',
          onClick: onClick,
          style: {
            flex: '0 0 auto',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(127, 127, 127, 0.4)',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer'
          }
        }, '打开面板')
      ]);
    }

    function apply(ctx) {
      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'dsh-mobile-settings-entry'
      }, MobileAccessSettingsItem));
    }

    exports.name = name;
    exports.inject = ['slots'];
    exports.apply = apply;
    return module.exports;
  }
});
