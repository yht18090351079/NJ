# 惠农网行情数据爬虫

这是一个从惠农网 (https://www.cnhnb.com/hangqing/) 爬取农产品价格行情数据的爬虫工具。

## 功能特点

- 支持多种农产品分类的数据爬取
- 支持按地区筛选数据
- 提供两种爬取方式：requests (更快) 和 Selenium (更稳定)
- 数据自动保存为Excel和JSON格式
- 提供数据分析功能，生成统计报告
- 支持中断恢复功能，可以从上次中断的地方继续爬取
- 完善的日志记录和错误处理

## 依赖库

使用前需要安装以下Python库：

```bash
pip install requests beautifulsoup4 pandas selenium
```

如果使用Selenium模式，还需要安装Chrome浏览器和对应版本的ChromeDriver。

## 使用方法

### 基本用法

```bash
python 惠农网行情爬虫_combined.py
```

这将使用默认设置爬取所有分类的数据（每个分类下的"不限"地区，最多5页）。

### 高级选项

```bash
# 使用Selenium爬取
python 惠农网行情爬虫_combined.py --selenium

# 限制每个分类和地区的最大页数
python 惠农网行情爬虫_combined.py --pages 10

# 从上次中断的地方继续爬取
python 惠农网行情爬虫_combined.py --resume

# 只爬取特定分类
python 惠农网行情爬虫_combined.py --category "水果,蔬菜"

# 只爬取特定地区
python 惠农网行情爬虫_combined.py --region "河北,山东,北京"

# 组合使用
python 惠农网行情爬虫_combined.py --selenium --pages 3 --category "水果" --region "河北"

# 防验证码选项
python 惠农网行情爬虫_combined.py --delay 2.0 --captcha-retries 5 --selenium

# 开启调试模式
python 惠农网行情爬虫_combined.py --debug

# 使用有界面模式（默认）或无头模式
python 惠农网行情爬虫_combined.py --selenium                  # 有界面模式，可以看到浏览器操作
python 惠农网行情爬虫_combined.py --selenium --headless       # 无头模式，不显示浏览器界面

# 控制"不限"地区数据爬取（默认跳过）
python 惠农网行情爬虫_combined.py                           # 默认跳过"不限"地区
python 惠农网行情爬虫_combined.py --include-unlimited       # 包含"不限"地区的数据
```

### 防验证码爬取

当爬取大量数据时，网站可能会显示滑动验证码。以下选项可以帮助处理验证码问题：

```bash
# 使用专门的防验证码脚本（推荐新手使用）
python 爬取数据_防验证码版.py --category "水果" --selenium --delay 3.0

# 使用有界面模式便于手动处理验证码（推荐）
python 爬取数据_防验证码版.py --category "水果" --selenium

# 仍然使用无头模式
python 爬取数据_防验证码版.py --category "水果" --selenium --headless

# 更多选项
python 爬取数据_防验证码版.py --help
```

## 验证码处理

当网站检测到爬虫行为时，会弹出滑动验证码。本项目提供了几种处理策略：

1. **自动降低请求频率**：使用 `--delay` 参数增加请求间隔，降低触发验证码的概率
2. **自动切换到Selenium模式**：当使用requests模式遇到验证码时，会自动切换到Selenium模式尝试解决
3. **滑动验证码自动识别**：使用Selenium模拟人工滑动操作，自动解决滑动验证码
4. **多次重试机制**：使用 `--captcha-retries` 设置遇到验证码后的最大重试次数
5. **有界面模式**：默认使用有界面模式运行浏览器，可以观察验证码破解过程，必要时手动干预

如果持续遇到验证码问题，建议：
- 使用 `--selenium` 选项，直接采用Selenium模式爬取
- 不使用 `--headless` 选项，保持浏览器可见，必要时手动解决验证码
- 增加 `--delay` 值，如设置为2.0或更高，增加请求间隔
- 限制爬取范围，如只爬取特定分类或地区
- 分时段爬取，避开网站高峰期

## 输出文件

程序运行后会生成以下文件：

1. `惠农网行情数据_YYYYMMDD.json` - 包含所有原始数据的JSON文件
2. `惠农网行情数据_YYYYMMDD.xlsx` - 包含所有数据的Excel文件
3. `惠农网行情分析_YYYYMMDD.json` - 数据分析结果
4. `scraper.log` - 详细的运行日志

## 选择爬取模式

1. **requests模式**（默认）：使用requests库和BeautifulSoup爬取，速度更快，但可能会在某些情况下不稳定。
2. **Selenium模式**：使用Selenium自动化浏览器爬取，更稳定但速度较慢。

## 代码结构

- `get_all_categories()`: 获取所有产品分类
- `get_regions()`: 获取特定分类下的所有地区选项
- `scrape_with_requests()`: 使用requests方式爬取数据
- `scrape_with_selenium()`: 使用Selenium方式爬取数据
- `load_previous_data()`: 加载之前爬取的数据（用于断点续爬）
- `save_data()`: 保存数据到JSON文件
- `save_to_excel()`: 保存数据到Excel文件
- `analyze_data()`: 分析爬取的数据，生成统计信息
- `main()`: 主函数，协调整个爬取过程

## 注意事项

1. 爬取过程会有随机延迟，避免请求过快被网站封禁
2. 大量爬取数据时建议使用`--resume`选项，以便在中断后能够继续爬取
3. 网站结构可能会变化，如果爬虫失效，可能需要更新选择器
4. 请遵守网站的robots.txt规则和使用条款，合理使用爬虫

## 免责声明

本工具仅用于学习和研究目的，请勿用于任何商业用途。使用本工具产生的一切法律责任由使用者自行承担。
