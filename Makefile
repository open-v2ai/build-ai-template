# Build AI Template - Web Frontend Makefile
# 用于前端 i18n 检查和管理的工具

.PHONY: help i18n-check i18n-unused i18n-missing i18n-stats i18n-remove-unused clean

# 默认目标
help:
	@echo "Build AI Template - Web Frontend 可用命令:"
	@echo ""
	@echo "i18n 相关命令:"
	@echo "  make i18n-check        - 完整的 i18n 检查（包括未使用和缺失的 key）"
	@echo "  make i18n-unused       - 检查未使用的翻译 key"
	@echo "  make i18n-missing      - 检查缺失的翻译 key"
	@echo "  make i18n-stats        - 显示 i18n 统计信息"
	@echo "  make i18n-remove-unused - 移除未使用的翻译 key（危险操作，会自动备份）"
	@echo ""
	@echo "其他命令:"
	@echo "  make clean          - 清理临时文件"
	@echo "  make help           - 显示此帮助信息"

# 完整的 i18n 检查
i18n-check:
	@node scripts/check-i18n.js check

# 检查未使用的翻译 key
i18n-unused:
	@node scripts/check-i18n.js unused

# 检查缺失的翻译 key
i18n-missing:
	@node scripts/check-i18n.js missing

# 显示 i18n 统计信息
i18n-stats:
	@node scripts/check-i18n.js stats

# 移除未使用的翻译 key（危险操作）
i18n-remove-unused:
	@echo "⚠️  警告：这是一个危险操作，将会移除未使用的翻译 key！"
	@echo "📦 操作前会自动创建备份文件"
	@echo ""
	@node scripts/check-i18n.js remove-unused

# 清理临时文件
clean:
	@echo "🧹 清理临时文件..."
	@rm -f .i18n-*.tmp unused-i18n-keys.txt
	@echo "✅ 清理完成"

# 验证特定 key 是否被使用
i18n-check-key:
	@if [ -z "$(KEY)" ]; then \
		echo "❌ 请指定要检查的 key: make i18n-check-key KEY=your.key.name"; \
		exit 1; \
	fi
	@echo "🔍 检查 key '$(KEY)' 的使用情况..."
	@echo "========================================"
	@if grep -r "$(KEY)" . --include="*.tsx" --include="*.ts" --include="*.js" --include="*.jsx" | head -10; then \
		echo ""; \
		echo "✅ Key '$(KEY)' 正在被使用"; \
	else \
		echo "❌ Key '$(KEY)' 未找到使用"; \
	fi

# 查找包含特定文本的翻译 key
i18n-find-text:
	@if [ -z "$(TEXT)" ]; then \
		echo "❌ 请指定要搜索的文本: make i18n-find-text TEXT=搜索文本"; \
		exit 1; \
	fi
	@echo "🔍 搜索包含 '$(TEXT)' 的翻译..."
	@echo "========================================"
	@grep -r "$(TEXT)" app/messages/ --include="*.json" | head -20 || echo "❌ 未找到包含 '$(TEXT)' 的翻译"

# 开发模式：监控翻译文件变化
i18n-watch:
	@echo "👀 监控翻译文件变化..."
	@echo "按 Ctrl+C 停止监控"
	@echo "========================================"
	@if command -v fswatch >/dev/null 2>&1; then \
		fswatch -o app/messages/ | while read f; do \
			echo "📝 翻译文件已更新，重新检查..."; \
			make i18n-check; \
		done; \
	else \
		echo "❌ 需要安装 fswatch: brew install fswatch"; \
	fi
