/**
 * Client half of dsh-mobile-settings-entry.
 *
 * dsh-mobile mounts its「移动访问」control button into the sidebar footer
 * (`sidebar.footer.action`). That placement is easy to lose: a collapsed or
 * narrow sidebar unmounts the slot entirely, and some layouts never render it.
 *
 * This plugin therefore does two things in Settings → General:
 *  - 生成配对链接: calls dsh-mobile's own management endpoint
 *    (`POST /api/mobile-access/remote/pairing/open`) and shows the pairing URL,
 *    so a phone can be paired with no control-panel UI at all.
 *  - 打开面板: best-effort forward to dsh-mobile's trigger button for device
 *    management, expanding a collapsed sidebar first.
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
    var TRIGGER_LABELS = ['移动访问', 'Mobile access', 'Mobile Access'];
    var PAIRING_ENDPOINT = '/api/mobile-access/remote/pairing/open';

    /** The dsh-mobile trigger button, or null when the sidebar slot is unmounted. */
    function findTrigger() {
      var trigger = document.querySelector(TRIGGER_SELECTOR);
      if (trigger !== null) return trigger;
      var buttons = document.querySelectorAll('button[aria-label]');
      for (var i = 0; i < buttons.length; i += 1) {
        if (TRIGGER_LABELS.indexOf(buttons[i].getAttribute('aria-label')) !== -1) return buttons[i];
      }
      return null;
    }

    /** Expand a collapsed sidebar, whose footer slot unmounts dsh-mobile's button. */
    function expandSidebar() {
      var labels = ['打开侧边栏', 'Open sidebar'];
      var buttons = document.querySelectorAll('button[aria-label]');
      for (var i = 0; i < buttons.length; i += 1) {
        if (labels.indexOf(buttons[i].getAttribute('aria-label')) !== -1) {
          buttons[i].click();
          return true;
        }
      }
      return false;
    }

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    /** Open dsh-mobile's panel by forwarding a click to its own trigger. */
    async function openMobilePanel() {
      var trigger = findTrigger();
      if (trigger === null && expandSidebar()) {
        await sleep(500);
        trigger = findTrigger();
      }
      if (trigger === null) return false;
      trigger.click();
      return true;
    }

    /**
     * Ask dsh-mobile's host for a fresh pairing link. The endpoint answers 201
     * with { pairUrl, appKey, expiresAt }; a non-2xx means the remote channel is
     * not ready (or the request did not come from loopback).
     */
    async function requestPairingLink() {
      var response = await fetch(PAIRING_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      });
      if (response.status === 403 && !isLoopbackPage()) {
        throw new Error('loopback_only');
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      if (typeof data.pairUrl !== 'string' || data.pairUrl.length === 0) {
        throw new Error('no_pair_url');
      }
      return data;
    }

    /** True when this page is served from loopback, which the admin API requires. */
    function isLoopbackPage() {
      var host = window.location.hostname;
      return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    }

    function formatDeadline(expiresAt) {
      if (typeof expiresAt !== 'number') return '';
      var minutes = Math.max(0, Math.round((expiresAt - Date.now()) / 60000));
      return minutes > 0 ? '（' + minutes + ' 分钟内有效）' : '（已过期，请重新生成）';
    }

    function MobileAccessSettingsItem() {
      var state = react.useState({ phase: 'idle' });
      var current = state[0];
      var setState = state[1];

      var generate = function () {
        setState({ phase: 'loading' });
        requestPairingLink().then(function (data) {
          setState({ phase: 'ready', pairUrl: data.pairUrl, expiresAt: data.expiresAt });
        }).catch(function (error) {
          setState({ phase: 'error', message: String(error && error.message ? error.message : error) });
        });
      };

      var openPanel = function () {
        openMobilePanel().then(function (opened) {
          setState(opened ? { phase: 'panel' } : { phase: 'panel-missing' });
        });
      };

      var hint;
      if (current.phase === 'loading') hint = '正在生成配对链接…';
      else if (current.phase === 'ready') hint = '手机浏览器打开下面的链接即可配对' + formatDeadline(current.expiresAt);
      else if (current.phase === 'error' && current.message === 'loopback_only') hint = '管理接口只允许本机访问：请在电脑上用 http://127.0.0.1:13080 打开本页再生成。';
      else if (current.phase === 'error') hint = '生成失败（' + current.message + '）：确认远程通道处于「后端已监听」。';
      else if (current.phase === 'panel') hint = '已打开面板；配对二维码在「远程访问」标签里。';
      else if (current.phase === 'panel-missing') hint = '这个布局没有渲染 dsh-mobile 的控制按钮，请用「生成配对链接」。';
      else hint = '生成配对链接给手机，或打开原控制面板管理设备。';

      var link = current.phase === 'ready'
        ? react.createElement('div', {
            key: 'link',
            style: {
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(127, 127, 127, 0.12)',
              fontSize: '12px',
              wordBreak: 'break-all',
              userSelect: 'all',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
            }
          }, current.pairUrl)
        : null;

      var buttonStyle = {
        flex: '0 0 auto',
        padding: '6px 14px',
        borderRadius: '6px',
        border: '1px solid rgba(127, 127, 127, 0.4)',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        cursor: current.phase === 'loading' ? 'default' : 'pointer',
        opacity: current.phase === 'loading' ? 0.6 : 1
      };

      return react.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '12px 0',
          borderTop: '1px solid rgba(127, 127, 127, 0.18)'
        }
      }, [
        react.createElement('div', {
          key: 'row',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
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
          react.createElement('div', { key: 'actions', style: { display: 'flex', gap: '8px', flex: '0 0 auto' } }, [
            react.createElement('button', {
              key: 'pair',
              type: 'button',
              onClick: generate,
              disabled: current.phase === 'loading',
              style: buttonStyle
            }, '生成配对链接'),
            react.createElement('button', {
              key: 'panel',
              type: 'button',
              onClick: openPanel,
              style: buttonStyle
            }, '打开面板')
          ])
        ]),
        link
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
