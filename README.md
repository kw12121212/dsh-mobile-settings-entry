# dsh-mobile-settings-entry

在 DeepSeek Harness 的**设置 → 通用**里加一个「移动访问」入口，用来打开
[dsh-mobile](https://github.com/saya-ch/dsh-mobile) 的管理面板。

## 为什么

dsh-mobile 把「移动访问」按钮挂在侧栏底部（`sidebar.footer.action`）。
侧栏里的 Bot / 会话列表一长，这个按钮就被挤到窗口边缘甚至看不见，找起来很费劲。

这个插件不改 dsh-mobile 的任何代码，只在设置页加一行入口，点击时转发到
dsh-mobile 自己的触发按钮（`.dsh-mobile-control__trigger`），所以配对、设备管理、
后续面板更新都不受影响。

## 安装

```bash
dsh plugin --profile web add dsh-mobile-settings-entry
```

本地开发时可以直接指向文件夹：

```bash
dsh plugin --profile web add file:/path/to/dsh-mobile-settings-entry
```

装完重启 dsh-web：`systemctl --user restart dsh-web.service`。

## 使用

1. 打开 **设置 → 通用**
2. 找到「移动访问」一行，点 **打开面板**
3. 面板里切到「远程访问」生成配对二维码

如果提示「没有找到 dsh-mobile 的入口按钮」，说明 dsh-mobile 没启用或尚未加载完成。

## 卸载

```bash
dsh plugin --profile web remove dsh-mobile-settings-entry
systemctl --user restart dsh-web.service
```

## License

MIT
