# Claude Profile Switcher - Quick Reference

## 🚀 **Most Common Commands**

```bash
# Auto-switch (use this most of the time)
./switch-claude-auto.sh auto
source ~/.zshrc

# Switch to specific profile
./switch-claude-auto.sh alt5
source ~/.zshrc

# Check what's working
./switch-claude-ide-simple.sh status

# Mark profile as failed (when you hit limits)
./switch-claude-ide-simple.sh fail alt3
./switch-claude-auto.sh auto
source ~/.zshrc
```

## 📋 **Your Profiles**

| Profile | Description | Base URL |
|---------|-------------|----------|
| `default` | Default Account | code.aitianhu5.top |
| `alt1-alt11` | Claude Accounts 2-12 | code.aitianhu5.top |
| `alt12` | BigModel Account | open.bigmodel.cn |

## 🔄 **Daily Workflow**

1. **Start:** `./switch-claude-auto.sh auto && source ~/.zshrc`
2. **Hit limits:** `./switch-claude-ide-simple.sh fail alt3 && ./switch-claude-auto.sh auto && source ~/.zshrc`
3. **Check status:** `./switch-claude-ide-simple.sh status`

## 💡 **Remember**

- **Use `switch-claude-auto.sh`** for CloudyCode
- **Always run `source ~/.zshrc`** after switching
- **Mark profiles as failed** when you hit limits
- **Check status** regularly with `status` command

**That's it!** 🎯

