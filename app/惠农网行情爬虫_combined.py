import requests
from bs4 import BeautifulSoup
import json
import time
import random
import pandas as pd
import re
import os
from datetime import datetime
import argparse
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
from captcha_handler import is_captcha_present, solve_captcha_selenium, random_sleep

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("惠农网爬虫")

# 默认分类列表
DEFAULT_CATEGORIES = [
    {"name": "水果", "url": "https://www.cnhnb.com/hangqing/sgzw/"},
    {"name": "蔬菜", "url": "https://www.cnhnb.com/hangqing/sczw/"},
    {"name": "禽畜肉蛋", "url": "https://www.cnhnb.com/hangqing/qcrd/"},
    {"name": "水产", "url": "https://www.cnhnb.com/hangqing/shuic/"},
    {"name": "农副加工", "url": "https://www.cnhnb.com/hangqing/nfjg/"},
    {"name": "粮油米面", "url": "https://www.cnhnb.com/hangqing/lymm/"},
    {"name": "种子种苗", "url": "https://www.cnhnb.com/hangqing/zzzm/"},
    {"name": "苗木花草", "url": "https://www.cnhnb.com/hangqing/mmhc/"},
    {"name": "农资农机", "url": "https://www.cnhnb.com/hangqing/nznj/"},
    {"name": "中药材", "url": "https://www.cnhnb.com/hangqing/zyc/"},
    {"name": "日用百货", "url": "https://www.cnhnb.com/hangqing/rybh/"},
    {"name": "土地流转", "url": "https://www.cnhnb.com/hangqing/tudi/"},
    {"name": "包装", "url": "https://www.cnhnb.com/hangqing/package/"},
    {"name": "农业服务", "url": "https://www.cnhnb.com/hangqing/nyfw/"},
    {"name": "农工服务", "url": "https://www.cnhnb.com/hangqing/ngfw/"},
    {"name": "租赁服务", "url": "https://www.cnhnb.com/hangqing/zlfw/"},
    {"name": "农技服务", "url": "https://www.cnhnb.com/hangqing/nongjifuwu/"},
    {"name": "经济作物", "url": "https://www.cnhnb.com/hangqing/jingjizw/"}
]

def get_browser_headers():
    """获取浏览器请求头"""
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://www.cnhnb.com/",
        "Connection": "keep-alive"
    }

def get_all_categories():
    """获取所有分类"""
    base_url = "https://www.cnhnb.com/hangqing/"
    try:
        response = requests.get(base_url, headers=get_browser_headers())
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            logger.error(f"获取分类失败，状态码: {response.status_code}")
            return DEFAULT_CATEGORIES
        
        soup = BeautifulSoup(response.text, 'html.parser')
        category_elements = soup.select('li.first-cate-item a.third-cate-item')
        
        categories = []
        for element in category_elements:
            if element.text.strip() != "全部分类":  # 跳过"全部分类"
                categories.append({
                    "name": element.text.strip(),
                    "url": element.get('href') if element.get('href').startswith('http') else f"https://www.cnhnb.com{element.get('href')}"
                })
        
        if categories:
            return categories
        else:
            logger.warning("未找到分类，使用默认分类列表")
            return DEFAULT_CATEGORIES
            
    except Exception as e:
        logger.error(f"获取分类时出错: {str(e)}")
        return DEFAULT_CATEGORIES

def get_regions(category_url):
    """获取指定分类下的所有地区"""
    try:
        response = requests.get(category_url, headers=get_browser_headers())
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            logger.error(f"获取地区失败，状态码: {response.status_code}")
            return [{"name": "不限", "url": category_url}]
        
        soup = BeautifulSoup(response.text, 'html.parser')
        region_elements = soup.select('li.sub-row a.third-cate-item')
        
        regions = []
        for element in region_elements:
            text = element.text.strip()
            if "更多" not in text:
                regions.append({
                    "name": text,
                    "url": element.get('href') if element.get('href').startswith('http') else f"https://www.cnhnb.com{element.get('href')}"
                })
        
        if regions:
            return regions
        else:
            logger.warning("未找到地区，使用默认地区")
            return [{"name": "不限", "url": category_url}]
            
    except Exception as e:
        logger.error(f"获取地区时出错: {str(e)}")
        return [{"name": "不限", "url": category_url}]

def scrape_with_requests(category, region, max_pages=5, max_captcha_retries=3, use_proxy=False, headless=False):
    """使用requests爬取特定分类和地区的数据"""
    data = []
    category_name = category["name"] if isinstance(category, dict) else category
    region_name = region["name"] if isinstance(region, dict) else region
    region_url = region["url"] if isinstance(region, dict) else category["url"]
    
    logger.info(f"正在爬取: 分类={category_name}, 地区={region_name}")
    
    # 跟踪连续遇到验证码的次数
    captcha_count = 0
    selenium_driver = None
    
    for page in range(1, max_pages + 1):
        # 构造分页URL
        if page > 1:
            base_path = region_url.rstrip('/')
            if base_path.endswith('-1'):
                page_url = f"{base_path[:-1]}-{page}/"
            else:
                page_url = f"{base_path}-{page}/"
        else:
            page_url = region_url
        
        try:
            logger.info(f"  获取第 {page} 页: {page_url}")
            
            # 设置请求头，每次请求使用不同的User-Agent
            headers = get_browser_headers()
            
            # 使用代理（如果启用）
            proxies = None
            if use_proxy:
                from captcha_handler import get_proxy
                proxy = get_proxy()
                proxies = {"http": proxy, "https": proxy}
                logger.info(f"  使用代理: {proxy}")
            
            # 随机延迟，避免请求过快
            random_sleep(2, 5)
            
            # 发送请求
            response = requests.get(page_url, headers=headers, proxies=proxies, timeout=15)
            response.encoding = 'utf-8'
            
            if response.status_code != 200:
                logger.error(f"  请求失败，状态码: {response.status_code}")
                break
            
            # 检查是否出现验证码
            if is_captcha_present(response.text):
                captcha_count += 1
                logger.warning(f"  第 {captcha_count} 次遇到验证码")
                
                if captcha_count >= max_captcha_retries:
                    logger.error(f"  连续 {captcha_count} 次遇到验证码，切换到Selenium模式")
                    
                    # 关闭之前的Selenium会话（如果有）
                    if selenium_driver:
                        try:
                            selenium_driver.quit()
                        except:
                            pass
                    
                    # 初始化Selenium
                    chrome_options = Options()
                    # 根据参数决定是否使用无头模式
                    if headless and not logger.isEnabledFor(logging.DEBUG):
                        chrome_options.add_argument("--headless")
                    chrome_options.add_argument("--disable-gpu")
                    chrome_options.add_argument("--window-size=1920,1080")
                    
                    # 添加反检测参数
                    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
                    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                    chrome_options.add_experimental_option('useAutomationExtension', False)
                    
                    selenium_driver = webdriver.Chrome(options=chrome_options)
                    
                    # 修改 navigator 属性，绕过浏览器指纹检测
                    selenium_driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                    
                    try:
                        # 访问页面
                        selenium_driver.get(page_url)
                        
                        # 验证是否需要解决验证码
                        if is_captcha_present(selenium_driver.page_source):
                            # 尝试解决验证码
                            if solve_captcha_selenium(selenium_driver):
                                logger.info("  验证码已成功解决，继续爬取")
                                # 使用Selenium解析数据
                                soup = BeautifulSoup(selenium_driver.page_source, 'html.parser')
                            else:
                                logger.error("  无法解决验证码，跳过当前页面")
                                # 随机长延迟后继续
                                random_sleep(20, 30)
                                continue
                        else:
                            # 没有验证码，直接使用Selenium解析数据
                            soup = BeautifulSoup(selenium_driver.page_source, 'html.parser')
                    except Exception as e:
                        logger.error(f"  Selenium处理验证码时出错: {str(e)}")
                        random_sleep(20, 30)
                        continue
                else:
                    # 随机长延迟后重试当前页面
                    logger.info(f"  遇到验证码，随机延迟后重试")
                    random_sleep(10, 20)
                    page -= 1  # 重试当前页面
                    continue
            else:
                # 如果成功获取页面且没有验证码，重置计数器
                captcha_count = 0
                soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取价格数据
            price_items = soup.select('li.market-list-item')
            
            if not price_items:
                logger.info(f"  第 {page} 页没有数据，结束翻页")
                break
            
            page_data = []
            for item in price_items:
                try:
                    time_elem = item.select_one('span.time')
                    product_elem = item.select_one('span.product')
                    place_elem = item.select_one('span.place')
                    price_elem = item.select_one('span.price')
                    change_elem = item.select_one('span.lifting')
                    
                    if not all([time_elem, product_elem, place_elem, price_elem, change_elem]):
                        continue
                    
                    item_data = {
                        "category": category_name,
                        "region": region_name,
                        "time": time_elem.text.strip(),
                        "product": product_elem.text.strip(),
                        "place": place_elem.text.strip(),
                        "price": price_elem.text.strip(),
                        "change": change_elem.text.strip()
                    }
                    
                    page_data.append(item_data)
                except Exception as e:
                    logger.error(f"  提取数据项时出错: {str(e)}")
                    continue
            
            data.extend(page_data)
            logger.info(f"  成功提取第 {page} 页数据，共 {len(page_data)} 条")
            
            # 检查是否有下一页
            next_button = soup.select_one('button.btn-next')
            if not next_button or 'disabled' in next_button.get('class', []):
                logger.info(f"  已到达最后一页")
                break
            
            # 随机延迟，避免请求过快
            random_sleep(3, 8)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"  请求异常: {str(e)}")
            # 连续错误时增加延迟
            random_sleep(5, 10)
            continue
        except Exception as e:
            logger.error(f"  处理第 {page} 页时出错: {str(e)}")
            break
    
    # 关闭Selenium会话（如果有）
    if selenium_driver:
        try:
            selenium_driver.quit()
        except:
            pass
    
    return data

def scrape_with_selenium(category, region, max_pages=5, max_captcha_retries=3, headless=False):
    """使用Selenium爬取特定分类和地区的数据"""
    data = []
    category_name = category["name"] if isinstance(category, dict) else category
    region_name = region["name"] if isinstance(region, dict) else region
    region_url = region["url"] if isinstance(region, dict) else category["url"]
    
    logger.info(f"正在爬取: 分类={category_name}, 地区={region_name}")
    
    # 配置Chrome选项
    chrome_options = Options()
    # 根据参数决定是否使用无头模式
    if headless and not logger.isEnabledFor(logging.DEBUG):
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # 添加反检测参数
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # 初始化WebDriver
    driver = webdriver.Chrome(options=chrome_options)
    
    # 修改 navigator 属性，绕过浏览器指纹检测
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    wait = WebDriverWait(driver, 10)
    captcha_count = 0
    
    try:
        # 访问地区页面
        driver.get(region_url)
        
        # 开始处理分页数据
        page = 1
        while page <= max_pages:
            try:
                # 检查是否存在验证码
                if "verify" in driver.page_source:
                    captcha_count += 1
                    logger.warning(f"  第 {captcha_count} 次遇到验证码")
                    
                    if captcha_count > max_captcha_retries:
                        logger.error(f"  连续 {captcha_count} 次无法解决验证码，放弃当前爬取")
                        break
                    
                    # 导入验证码处理模块
                    from captcha_handler import is_captcha_present_selenium, solve_captcha_selenium
                    
                    # 尝试解决验证码
                    if not solve_captcha_selenium(driver):
                        logger.error("  无法解决验证码，尝试刷新页面")
                        driver.refresh()
                        random_sleep(5, 10)
                        continue
                    else:
                        logger.info("  验证码已成功解决")
                        # 重置计数器
                        captcha_count = 0
                
                # 等待表格数据加载
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.market-list-item")))
                
                # 提取当前页数据
                price_items = driver.find_elements(By.CSS_SELECTOR, "li.market-list-item")
                if not price_items:
                    logger.info(f"  第 {page} 页没有数据，结束翻页")
                    break
                
                page_data = []
                for item in price_items:
                    try:
                        # 获取每条数据的详细信息
                        item_data = {
                            "category": category_name,
                            "region": region_name,
                            "time": item.find_element(By.CSS_SELECTOR, "span.time").text.strip(),
                            "product": item.find_element(By.CSS_SELECTOR, "span.product").text.strip(),
                            "place": item.find_element(By.CSS_SELECTOR, "span.place").text.strip(),
                            "price": item.find_element(By.CSS_SELECTOR, "span.price").text.strip(),
                            "change": item.find_element(By.CSS_SELECTOR, "span.lifting").text.strip()
                        }
                        page_data.append(item_data)
                    except Exception as e:
                        logger.error(f"  提取数据项时出错: {str(e)}")
                        continue
                
                data.extend(page_data)
                logger.info(f"  成功提取第 {page} 页数据，共 {len(page_data)} 条")
                
                # 检查是否有下一页
                try:
                    next_button = driver.find_element(By.CSS_SELECTOR, "button.btn-next")
                    
                    # 检查是否是最后一页
                    if "disabled" in next_button.get_attribute("class"):
                        logger.info(f"  已到达最后一页")
                        break
                    
                    # 点击下一页
                    next_button.click()
                    # 随机延迟，避免请求过快
                    random_sleep(3, 6)
                    page += 1
                except NoSuchElementException:
                    logger.info(f"  未找到下一页按钮，结束翻页")
                    break
                
            except TimeoutException:
                logger.error(f"  页面加载超时，可能是遇到了验证码或网络问题")
                # 尝试刷新页面
                try:
                    driver.refresh()
                    random_sleep(5, 10)
                    # 不增加页码，重试当前页
                except:
                    logger.error("  刷新页面失败")
                    break
            except Exception as e:
                logger.error(f"  处理第 {page} 页时出错: {str(e)}")
                # 尝试继续下一页
                random_sleep(5, 10)
                page += 1
    
    except Exception as e:
        logger.error(f"Selenium爬取过程中出错: {str(e)}")
    
    finally:
        # 确保浏览器关闭
        try:
            driver.quit()
        except:
            pass
    
    return data

def load_previous_data(filename):
    """加载之前爬取的数据"""
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载之前的数据失败: {str(e)}")
    return []

def save_data(data, filename):
    """保存数据到文件"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        logger.info(f"数据已保存至 {filename}")
        return True
    except Exception as e:
        logger.error(f"保存数据失败: {str(e)}")
        return False

def save_to_excel(data, filename):
    """将数据保存为Excel文件"""
    try:
        df = pd.DataFrame(data)
        df.to_excel(filename, index=False)
        logger.info(f"数据已保存至 {filename}")
        return True
    except Exception as e:
        logger.error(f"保存Excel失败: {str(e)}")
        return False

def analyze_data(data):
    """分析爬取的数据"""
    if not data:
        logger.warning("没有数据可分析")
        return None
    
    try:
        df = pd.DataFrame(data)
        
        # 提取价格数值
        def extract_price(price_str):
            if isinstance(price_str, str):
                match = re.search(r'(\d+(\.\d+)?)', price_str)
                if match:
                    return float(match.group(1))
            return None
        
        df['price_value'] = df['price'].apply(extract_price)
        
        # 按分类统计
        category_stats = df.groupby('category')['price_value'].agg(['mean', 'min', 'max', 'count']).reset_index()
        
        # 按地区统计
        place_stats = df.groupby('place')['price_value'].agg(['mean', 'count']).reset_index()
        place_stats = place_stats.sort_values('count', ascending=False).head(20)
        
        # 按产品统计
        product_stats = df.groupby('product')['price_value'].agg(['mean', 'min', 'max', 'count']).reset_index()
        product_stats = product_stats.sort_values('count', ascending=False)
        
        # 创建分析结果
        analysis = {
            "total_records": len(df),
            "unique_categories": df['category'].nunique(),
            "unique_products": df['product'].nunique(),
            "unique_places": df['place'].nunique(),
            "category_stats": category_stats.to_dict('records'),
            "top_places": place_stats.to_dict('records'),
            "product_stats": product_stats.to_dict('records'),
            "top_expensive_products": product_stats.sort_values('mean', ascending=False).head(10).to_dict('records'),
            "top_cheapest_products": product_stats[product_stats['count'] > 5].sort_values('mean').head(10).to_dict('records')
        }
        
        return analysis
    
    except Exception as e:
        logger.error(f"分析数据时出错: {str(e)}")
        return None

def main(use_selenium=False, categories=None, regions=None, max_pages=5, resume=False, 
         max_captcha_retries=3, use_proxy=False, delay_factor=1.0, headless=False, skip_unlimited=True):
    """
    主函数，爬取惠农网行情数据
    
    参数:
    skip_unlimited: 是否跳过"不限"地区，默认为True
    """
    logger.info("开始爬取惠农网行情数据...")
    
    # 调整随机延迟因子
    if delay_factor != 1.0:
        # 修改captcha_handler中的随机延迟函数
        from captcha_handler import random_sleep as original_sleep
        
        def adjusted_sleep(min_seconds, max_seconds):
            """根据延迟因子调整的随机睡眠函数"""
            adjusted_min = min_seconds * delay_factor
            adjusted_max = max_seconds * delay_factor
            return original_sleep(adjusted_min, adjusted_max)
        
        # 替换随机睡眠函数
        import captcha_handler
        captcha_handler.random_sleep = adjusted_sleep
        logger.info(f"已调整延迟因子为 {delay_factor}")
    
    # 设置文件名
    current_time = datetime.now().strftime("%Y%m%d")
    data_file = f"惠农网行情数据_{current_time}.json"
    excel_file = f"惠农网行情数据_{current_time}.xlsx"
    analysis_file = f"惠农网行情分析_{current_time}.json"
    
    # 加载之前的数据（如果需要恢复）
    all_data = load_previous_data(data_file) if resume else []
    
    # 如果未指定分类，获取所有分类
    if categories is None:
        categories = get_all_categories()
    
    # 记录已经处理过的分类和地区
    processed = set()
    if resume and all_data:
        for item in all_data:
            processed.add((item["category"], item["region"]))
    
    # 开始爬取数据
    try:
        for category in categories:
            category_name = category["name"] if isinstance(category, dict) else category
            category_url = category["url"] if isinstance(category, dict) else category
            
            # 如果未指定地区，获取该分类下的所有地区
            current_regions = regions if regions is not None else get_regions(category_url)
            
            for region in current_regions:
                region_name = region["name"] if isinstance(region, dict) else region
                
                # 如果设置了跳过"不限"地区，则跳过
                if skip_unlimited and region_name == "不限":
                    logger.info(f"跳过'不限'地区: 分类={category_name}")
                    continue
                
                # 检查是否已处理过
                if (category_name, region_name) in processed:
                    logger.info(f"跳过已处理的组合: 分类={category_name}, 地区={region_name}")
                    continue
                
                # 根据选项使用不同的爬取方法
                if use_selenium:
                    data = scrape_with_selenium(category, region, max_pages, max_captcha_retries, headless)
                else:
                    data = scrape_with_requests(category, region, max_pages, max_captcha_retries, use_proxy, headless)
                
                # 添加到总数据中
                all_data.extend(data)
                processed.add((category_name, region_name))
                
                # 每完成一个分类-地区组合后保存数据
                save_data(all_data, data_file)
                
                # 随机延迟，避免请求过快
                from captcha_handler import random_sleep
                random_sleep(5, 10)
        
        # 保存最终结果
        logger.info(f"数据爬取完成，共获取 {len(all_data)} 条记录")
        save_data(all_data, data_file)
        save_to_excel(all_data, excel_file)
        
        # 分析数据
        analysis = analyze_data(all_data)
        if analysis:
            save_data(analysis, analysis_file)
        
        return True
    
    except KeyboardInterrupt:
        logger.warning("用户中断爬取过程")
        # 保存当前进度
        save_data(all_data, data_file)
        return False
    
    except Exception as e:
        logger.error(f"爬取过程中出错: {str(e)}")
        # 保存当前进度
        save_data(all_data, data_file)
        return False

if __name__ == "__main__":
    # 命令行参数解析
    parser = argparse.ArgumentParser(description="惠农网行情数据爬虫")
    parser.add_argument("--selenium", action="store_true", help="使用Selenium爬取（默认使用requests）")
    parser.add_argument("--pages", type=int, default=5, help="每个分类和地区组合最多爬取的页数（默认5页）")
    parser.add_argument("--resume", action="store_true", help="从上次中断的地方继续爬取")
    parser.add_argument("--category", type=str, help="指定要爬取的分类，多个分类用逗号分隔")
    parser.add_argument("--region", type=str, help="指定要爬取的地区，多个地区用逗号分隔")
    parser.add_argument("--captcha-retries", type=int, default=3, help="验证码处理失败后最大重试次数（默认3次）")
    parser.add_argument("--proxy", action="store_true", help="使用代理IP（默认不使用）")
    parser.add_argument("--delay", type=float, default=1.0, help="延迟因子，调整请求间隔（默认1.0）")
    parser.add_argument("--debug", action="store_true", help="启用调试模式，显示更详细的日志")
    parser.add_argument("--headless", action="store_true", help="使用无头模式（默认不使用，显示浏览器界面）")
    parser.add_argument("--include-unlimited", action="store_true", help="包含'不限'地区（默认跳过）")
    args = parser.parse_args()
    
    # 设置日志级别
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("已启用调试模式")
    
    # 处理分类参数
    selected_categories = None
    if args.category:
        category_names = [name.strip() for name in args.category.split(",")]
        all_categories = get_all_categories()
        selected_categories = [cat for cat in all_categories if cat["name"] in category_names]
        if not selected_categories:
            logger.warning(f"未找到指定的分类: {args.category}，将使用所有分类")
            selected_categories = None
    
    # 处理地区参数（简化处理，只接受地区名称，不包含URL）
    selected_regions = None
    if args.region:
        region_names = [name.strip() for name in args.region.split(",")]
        selected_regions = [{"name": name, "url": None} for name in region_names]
    
    # 运行爬虫
    main(
        use_selenium=args.selenium,
        categories=selected_categories,
        regions=selected_regions,
        max_pages=args.pages,
        resume=args.resume,
        max_captcha_retries=args.captcha_retries,
        use_proxy=args.proxy,
        delay_factor=args.delay,
        headless=args.headless,
        skip_unlimited=not args.include_unlimited  # 默认跳过"不限"地区
    ) 