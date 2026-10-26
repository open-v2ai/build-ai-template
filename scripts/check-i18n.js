#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

/**
 * 递归提取 JSON 对象中的所有 key
 * @param {Object} obj - JSON 对象
 * @param {string} prefix - key 前缀
 * @returns {string[]} - 所有 key 的数组
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * 检查未使用的翻译 key
 */
function checkUnusedKeys() {
  console.log('🔍 检查未使用的 i18n key...');
  console.log('========================================');
  
  // 读取翻译文件
  console.log('📋 提取所有翻译 key...');
  const zhFile = path.join('app', 'messages', 'zh.json');
  const enFile = path.join('app', 'messages', 'en.json');
  
  if (!fs.existsSync(zhFile) || !fs.existsSync(enFile)) {
    console.error('❌ 翻译文件不存在');
    process.exit(1);
  }
  
  const zhData = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  
  const zhKeys = extractKeys(zhData);
  const enKeys = extractKeys(enData);
  const allKeys = [...new Set([...zhKeys, ...enKeys])];
  
  console.log(`📊 找到 ${allKeys.length} 个翻译 key`);
  console.log('');
  
  // 扫描代码中使用的 key
  console.log('🔎 扫描代码中使用的 key...');
  
  try {
    // 改进的检测逻辑：支持多行 t() 调用
    console.log('🔍 扫描所有源代码文件...'); 
    
    // 1. 获取所有源代码文件，排除构建目录和 node_modules
    const findOutput = execSync('find . \\( -name "node_modules" -o -name ".next" -o -name "dist" -o -name "build" \\) -prune -o \\( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \\) -print', { encoding: 'utf8' });
    const sourceFiles = findOutput.split('\n').filter(file => file && !file.includes('node_modules') && !file.includes('.next') && !file.includes('dist') && !file.includes('build'));
    
    console.log(`📁 找到 ${sourceFiles.length} 个源代码文件`);
    
    // 2. 逐个文件读取并提取 t() 调用
    const usedKeysSet = new Set();
    
    sourceFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 匹配各种形式的 t() 调用
        const patterns = [
          // 单行调用: t('key') 或 t("key")
          /t\(['"]([^'"]+)['"]\)/g,
          // 多行调用: t('key', 或 t("key",
          /t\(['"]([^'"]+)['"]\s*,/g,
          // 模板字符串中的调用: ${t('key')}
          /\$\{t\(['"]([^'"]+)['"]\)\}/g
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const key = match[1];
            // 验证 key 格式
            if (key && /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(key)) {
              usedKeysSet.add(key);
            }
          }
        });
      } catch (error) {
        // 忽略读取文件错误，继续处理其他文件
        console.warn(`⚠️  无法读取文件 ${filePath}: ${error.message}`);
      }
    });
    
    const usedKeys = Array.from(usedKeysSet).sort();
    
    console.log(`📊 找到 ${usedKeys.length} 个使用的 key`);
    console.log('');
    
    // 查找未使用的 key
    console.log('🔍 查找未使用的 key...');
    const unusedKeys = allKeys.filter(key => !usedKeys.includes(key));
    
    if (unusedKeys.length > 0) {
      console.log(`⚠️  发现 ${unusedKeys.length} 个未使用的翻译 key:`);
      console.log('');
      
      // 显示前 50 个未使用的 key
      unusedKeys.slice(0, 50).forEach(key => {
        console.log(`  ❌ ${key}`);
      });
      
      if (unusedKeys.length > 50) {
        console.log(`  ... 还有 ${unusedKeys.length - 50} 个未显示`);
      }
    } else {
      console.log('✅ 没有发现未使用的翻译 key');
    }
    
  } catch (error) {
    console.error('❌ 扫描过程中出现错误:', error.message);
  }
}

/**
 * 检查缺失的翻译 key
 */
function checkMissingKeys() {
  console.log('');
  console.log('🔍 检查缺失的翻译 key...');
  console.log('========================================');
  
  const zhFile = path.join('app', 'messages', 'zh.json');
  const enFile = path.join('app', 'messages', 'en.json');
  
  const zhData = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  
  const zhKeys = new Set(extractKeys(zhData));
  const enKeys = new Set(extractKeys(enData));
  
  const missingInEn = [...zhKeys].filter(key => !enKeys.has(key));
  const missingInZh = [...enKeys].filter(key => !zhKeys.has(key));
  
  if (missingInEn.length > 0) {
    console.log(`⚠️  英文翻译中缺失 ${missingInEn.length} 个 key:`);
    missingInEn.slice(0, 10).forEach(key => console.log(`  ❌ ${key}`));
    if (missingInEn.length > 10) {
      console.log(`  ... 还有 ${missingInEn.length - 10} 个未显示`);
    }
    console.log('');
  }
  
  if (missingInZh.length > 0) {
    console.log(`⚠️  中文翻译中缺失 ${missingInZh.length} 个 key:`);
    missingInZh.slice(0, 10).forEach(key => console.log(`  ❌ ${key}`));
    if (missingInZh.length > 10) {
      console.log(`  ... 还有 ${missingInZh.length - 10} 个未显示`);
    }
    console.log('');
  }
  
  if (missingInEn.length === 0 && missingInZh.length === 0) {
    console.log('✅ 中英文翻译文件同步正常');
  }
}

/**
 * 从 JSON 对象中移除指定的 key
 * @param {Object} obj - JSON 对象
 * @param {string} keyPath - 要移除的 key 路径，如 'admin.users.title'
 * @returns {boolean} - 是否成功移除
 */
function removeKeyFromObject(obj, keyPath) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  
  let current = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      return false; // 路径不存在
    }
    current = current[key];
  }
  
  if (current[lastKey] !== undefined) {
    delete current[lastKey];
    return true;
  }
  
  return false;
}

/**
 * 清理空的父对象
 * @param {Object} obj - JSON 对象
 * @param {string} keyPath - 已移除的 key 路径
 */
function cleanupEmptyParents(obj, keyPath) {
  const keys = keyPath.split('.');
  keys.pop(); // 移除最后一个 key
  
  // 从最深层开始检查并清理空对象
  for (let i = keys.length; i > 0; i--) {
    const currentPath = keys.slice(0, i);
    let current = obj;
    
    // 导航到父对象
    for (let j = 0; j < currentPath.length - 1; j++) {
      current = current[currentPath[j]];
    }
    
    const targetKey = currentPath[currentPath.length - 1];
    const targetObj = current[targetKey];
    
    // 如果对象为空，则删除它
    if (targetObj && typeof targetObj === 'object' && Object.keys(targetObj).length === 0) {
      delete current[targetKey];
    } else {
      break; // 如果对象不为空，停止清理
    }
  }
}

/**
 * 移除未使用的翻译 key
 */
function removeUnusedKeys() {
  console.log('🗑️  移除未使用的翻译 key...');
  console.log('========================================');
  
  // 读取翻译文件
  console.log('📋 提取所有翻译 key...');
  const zhFile = path.join('app', 'messages', 'zh.json');
  const enFile = path.join('app', 'messages', 'en.json');
  
  if (!fs.existsSync(zhFile) || !fs.existsSync(enFile)) {
    console.error('❌ 翻译文件不存在');
    process.exit(1);
  }
  
  const zhData = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
  const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  
  const zhKeys = extractKeys(zhData);
  const enKeys = extractKeys(enData);
  const allKeys = [...new Set([...zhKeys, ...enKeys])];
  
  console.log(`📊 找到 ${allKeys.length} 个翻译 key`);
  console.log('');
  
  // 扫描代码中使用的 key
  console.log('🔎 扫描代码中使用的 key...');
  
  try {
    // 改进的检测逻辑：支持多行 t() 调用
    console.log('🔍 扫描所有源代码文件...');
    
    // 1. 获取所有源代码文件，排除构建目录和 node_modules
    const findOutput = execSync('find . \\( -name "node_modules" -o -name ".next" -o -name "dist" -o -name "build" \\) -prune -o \\( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \\) -print', { encoding: 'utf8' });
    const sourceFiles = findOutput.split('\n').filter(file => file && !file.includes('node_modules') && !file.includes('.next') && !file.includes('dist') && !file.includes('build'));
    
    console.log(`📁 找到 ${sourceFiles.length} 个源代码文件`);
    
    // 2. 逐个文件读取并提取 t() 调用
    const usedKeysSet = new Set();
    
    sourceFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 匹配各种形式的 t() 调用
        const patterns = [
          // 单行调用: t('key') 或 t("key")
          /t\(['"]([^'"]+)['"]\)/g,
          // 多行调用: t('key', 或 t("key",
          /t\(['"]([^'"]+)['"]\s*,/g,
          // 模板字符串中的调用: ${t('key')}
          /\$\{t\(['"]([^'"]+)['"]\)\}/g
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const key = match[1];
            // 验证 key 格式
            if (key && /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(key)) {
              usedKeysSet.add(key);
            }
          }
        });
      } catch (error) {
        // 忽略读取文件错误，继续处理其他文件
        console.warn(`⚠️  无法读取文件 ${filePath}: ${error.message}`);
      }
    });
    
    const usedKeys = Array.from(usedKeysSet).sort();
    
    console.log(`📊 找到 ${usedKeys.length} 个使用的 key`);
    console.log('');
    
    // 查找未使用的 key
    console.log('🔍 查找未使用的 key...');
    const unusedKeys = allKeys.filter(key => !usedKeys.includes(key));
    
    if (unusedKeys.length === 0) {
      console.log('✅ 没有发现未使用的翻译 key');
      return;
    }
    
    console.log(`⚠️  发现 ${unusedKeys.length} 个未使用的翻译 key`);
    console.log('');
    
    // 显示将要移除的 key（前 20 个）
    console.log('📝 将要移除的 key（前 20 个）:');
    unusedKeys.slice(0, 20).forEach(key => {
      console.log(`  🗑️  ${key}`);
    });
    
    if (unusedKeys.length > 20) {
      console.log(`  ... 还有 ${unusedKeys.length - 20} 个`);
    }
    console.log('');
    
    // 询问用户确认
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('⚠️  确定要移除这些未使用的 key 吗？这个操作不可逆！(y/N): ', (answer) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ 操作已取消');
        rl.close();
        return;
      }
      
      console.log('');
      console.log('🗑️  开始移除未使用的 key...');
      
      // 创建备份
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zhBackup = `${zhFile}.backup-${timestamp}`;
      const enBackup = `${enFile}.backup-${timestamp}`;
      
      fs.copyFileSync(zhFile, zhBackup);
      fs.copyFileSync(enFile, enBackup);
      console.log(`📦 已创建备份文件: ${path.basename(zhBackup)}, ${path.basename(enBackup)}`);
      
      // 移除未使用的 key
      let zhRemoved = 0;
      let enRemoved = 0;
      
      // 复制数据以避免修改原始对象
      const newZhData = JSON.parse(JSON.stringify(zhData));
      const newEnData = JSON.parse(JSON.stringify(enData));
      
      unusedKeys.forEach(key => {
        if (zhKeys.includes(key) && removeKeyFromObject(newZhData, key)) {
          cleanupEmptyParents(newZhData, key);
          zhRemoved++;
        }
        if (enKeys.includes(key) && removeKeyFromObject(newEnData, key)) {
          cleanupEmptyParents(newEnData, key);
          enRemoved++;
        }
      });
      
      // 写入更新后的文件
      fs.writeFileSync(zhFile, JSON.stringify(newZhData, null, 2) + '\n', 'utf8');
      fs.writeFileSync(enFile, JSON.stringify(newEnData, null, 2) + '\n', 'utf8');
      
      console.log('');
      console.log('✅ 移除完成！');
      console.log(`📊 中文翻译移除了 ${zhRemoved} 个 key`);
      console.log(`📊 英文翻译移除了 ${enRemoved} 个 key`);
      console.log('');
      console.log('💡 提示:');
      console.log(`  - 如需恢复，可使用备份文件: ${path.basename(zhBackup)}, ${path.basename(enBackup)}`);
      console.log('  - 建议运行测试确保应用正常工作');
      console.log('  - 可运行 "make i18n-missing" 检查是否有遗漏');
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ 扫描过程中出现错误:', error.message);
  }
}

/**
 * 显示统计信息
 */
function showStats() {
  console.log('');
  console.log('📊 i18n 统计信息');
  console.log('========================================');
  
  function countKeys(obj) {
    let count = 0;
    for (const [, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        count += countKeys(value);
      } else {
        count++;
      }
    }
    return count;
  }
  
  const zhFile = path.join('app', 'messages', 'zh.json');
  const enFile = path.join('app', 'messages', 'en.json');
  
  if (fs.existsSync(zhFile)) {
    const zhData = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
    const zhCount = countKeys(zhData);
    const zhSize = (fs.statSync(zhFile).size / 1024).toFixed(2);
    console.log(`📄 中文翻译: ${zhCount} 个 key (${zhSize} KB)`);
  }
  
  if (fs.existsSync(enFile)) {
    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const enCount = countKeys(enData);
    const enSize = (fs.statSync(enFile).size / 1024).toFixed(2);
    console.log(`📄 英文翻译: ${enCount} 个 key (${enSize} KB)`);
  }
  
  console.log('💡 运行 \'make i18n-unused\' 查看未使用的 key');
  console.log('');
  console.log('📁 扫描的文件类型:');
  console.log('  - TypeScript/JavaScript: .ts, .tsx, .js, .jsx');
  console.log('  - 翻译文件: app/messages/*.json');
  console.log('');
  console.log('🔍 检查模式:');
  console.log('  - t(\'key\') 或 t("key")');
  console.log('  - ${t(\'key\')} 模板字符串');
  console.log('');
  console.log('📂 扫描目录: web/ (当前目录)');
}

// 根据命令行参数执行不同的功能
const command = process.argv[2];

switch (command) {
  case 'unused':
    checkUnusedKeys();
    break;
  case 'missing':
    checkMissingKeys();
    break;
  case 'stats':
    showStats();
    break;
  case 'check':
    checkUnusedKeys();
    checkMissingKeys();
    showStats();
    break;
  case 'remove-unused':
    removeUnusedKeys();
    break;
  default:
    console.log('用法: node check-i18n.js [unused|missing|stats|check|remove-unused]');
    console.log('');
    console.log('命令:');
    console.log('  unused       - 检查未使用的翻译 key');
    console.log('  missing      - 检查缺失的翻译 key');
    console.log('  stats        - 显示统计信息');
    console.log('  check        - 执行完整检查');
    console.log('  remove-unused - 移除未使用的翻译 key（危险操作，会自动备份）');
    process.exit(1);
}
