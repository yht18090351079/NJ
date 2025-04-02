import requests
from bs4 import BeautifulSoup
import json
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import pandas as pd

def get_all_categories_with_selenium():
    """
    使用Selenium自动化浏览器，点击每个一级分类，然后提取二三级分类
    """
    print("启动自动化浏览器...")
    
    # 配置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式，不显示浏览器窗口
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # 初始化WebDriver
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 访问惠农网采购页面
        url = "https://www.cnhnb.com/purchase/"
        driver.get(url)
        
        # 等待页面加载完成
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul.cate-list")))
        
        # 获取所有一级分类
        all_categories = []
        first_level_elements = driver.find_elements(By.CSS_SELECTOR, "ul.cate-list li.first-cate-item")
        
        # 跳过"全部分类"
        first_level_elements = first_level_elements[1:]
        
        for index, first_element in enumerate(first_level_elements):
            try:
                # 获取一级分类信息
                first_link = first_element.find_element(By.CSS_SELECTOR, "a.third-cate-item")
                first_name = first_link.text.strip()
                first_url = first_link.get_attribute("href")
                
                print(f"处理一级分类 [{index+1}/{len(first_level_elements)}]: {first_name}")
                
                first_category = {
                    "name": first_name,
                    "url": first_url,
                    "subcategories": []
                }
                
                # 点击一级分类链接
                first_link.click()
                
                # 等待页面加载二级和三级分类
                try:
                    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.sub-row")))
                    
                    # 解析二级和三级分类
                    sub_rows = driver.find_elements(By.CSS_SELECTOR, "li.sub-row")
                    
                    for sub_row in sub_rows:
                        try:
                            # 获取二级分类
                            second_category_elem = sub_row.find_element(By.CSS_SELECTOR, "span.second-cate-item")
                            second_name = second_category_elem.text.strip()
                            
                            second_category = {
                                "name": second_name,
                                "third_categories": []
                            }
                            
                            # 获取三级分类
                            third_links = sub_row.find_elements(By.CSS_SELECTOR, "a.third-cate-item")
                            
                            for third_link in third_links:
                                third_text = third_link.text.strip()
                                
                                # 跳过"更多"按钮
                                if "更多" in third_text:
                                    # 点击"更多"按钮展开所有三级分类
                                    try:
                                        third_link.click()
                                        # 等待更多分类加载
                                        time.sleep(1)
                                        # 重新获取三级分类
                                        third_links = sub_row.find_elements(By.CSS_SELECTOR, "a.third-cate-item")
                                    except:
                                        pass
                                    continue
                                
                                third_url = third_link.get_attribute("href")
                                
                                third_category = {
                                    "name": third_text,
                                    "url": third_url
                                }
                                
                                second_category["third_categories"].append(third_category)
                            
                            # 只添加有三级分类的二级分类
                            if second_category["third_categories"]:
                                first_category["subcategories"].append(second_category)
                                
                        except NoSuchElementException:
                            continue
                        
                except TimeoutException:
                    print(f"  未找到分类 '{first_name}' 的子分类，或加载超时")
                
                # 添加到结果中
                all_categories.append(first_category)
                
                # 回到采购页面
                driver.get(url)
                
                # 等待页面重新加载
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul.cate-list")))
                
                # 重新获取一级分类元素列表
                first_level_elements = driver.find_elements(By.CSS_SELECTOR, "ul.cate-list li.first-cate-item")
                first_level_elements = first_level_elements[1:]  # 跳过"全部分类"
                
                # 添加随机延迟，避免请求过快
                time.sleep(random.uniform(1, 2))
                
            except Exception as e:
                print(f"  处理分类时出错: {str(e)}")
                # 回到采购页面
                driver.get(url)
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul.cate-list")))
                first_level_elements = driver.find_elements(By.CSS_SELECTOR, "ul.cate-list li.first-cate-item")
                first_level_elements = first_level_elements[1:]
                time.sleep(1)
        
        return all_categories
        
    finally:
        # 确保浏览器关闭
        driver.quit()
        print("浏览器已关闭")

def save_to_json(data, filename="categories.json"):
    """将数据保存为JSON文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"数据已保存至 {filename}")

def count_categories(categories):
    """统计分类数量"""
    first_level_count = len(categories)
    second_level_count = 0
    third_level_count = 0
    
    for first_cat in categories:
        second_level_count += len(first_cat.get('subcategories', []))
        
        for second_cat in first_cat.get('subcategories', []):
            third_level_count += len(second_cat.get('third_categories', []))
    
    return {
        'first_level': first_level_count,
        'second_level': second_level_count,
        'third_level': third_level_count,
        'total': first_level_count + second_level_count + third_level_count
    }

def get_specific_categories():
    """
    使用requests和BeautifulSoup获取特定分类页面的数据
    这是一个备选方案，如果一级分类已知且网址固定
    """
    # 一级分类及其URL - 根据图片中显示的所有分类更新
    categories = [
        {"name": "全部分类", "url": "/purchase/?pinyin=undefined&cateId=0&breedId=undefined&areaId=undefined&specId=undefined", "subcategories": []},
        {"name": "水果", "url": "/purchase/sgzw/", "subcategories": []},
        {"name": "蔬菜", "url": "/purchase/sczw/", "subcategories": []},
        {"name": "禽畜肉蛋", "url": "/purchase/qcrd/", "subcategories": []},
        {"name": "水产", "url": "/purchase/shuic/", "subcategories": []},
        {"name": "农副加工", "url": "/purchase/nfjg/", "subcategories": []},
        {"name": "粮油米面", "url": "/purchase/lymm/", "subcategories": []},
        {"name": "种子种苗", "url": "/purchase/zzzm/", "subcategories": []},
        {"name": "苗木花草", "url": "/purchase/mmhc/", "subcategories": []},
        {"name": "农资农机", "url": "/purchase/nznj/", "subcategories": []},
        {"name": "中药材", "url": "/purchase/zyc/", "subcategories": []},
        {"name": "日用百货", "url": "/purchase/rybh/", "subcategories": []},
        {"name": "土地流转", "url": "/purchase/tudi/", "subcategories": []},
        {"name": "包装", "url": "/purchase/package/", "subcategories": []},
        {"name": "农业服务", "url": "/purchase/nyfw/", "subcategories": []},
        {"name": "农工服务", "url": "/purchase/ngfw/", "subcategories": []},
        {"name": "租赁服务", "url": "/purchase/zlfw/", "subcategories": []},
        {"name": "农技服务", "url": "/purchase/nongjifuwu/", "subcategories": []},
        {"name": "经济作物", "url": "/purchase/jingjizw/", "subcategories": []},
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    }
    
    for category in categories:
        # 跳过"全部分类"
        if category["name"] == "全部分类":
            continue
            
        base_url = "https://www.cnhnb.com"
        full_url = base_url + category["url"]
        
        try:
            print(f"获取分类 '{category['name']}' 的数据...")
            response = requests.get(full_url, headers=headers)
            response.encoding = 'utf-8'
            
            if response.status_code != 200:
                print(f"  请求失败，状态码: {response.status_code}")
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找二级和三级分类
            sub_rows = soup.select('ul li.sub-row')
            
            for sub_row in sub_rows:
                second_category_elem = sub_row.select_one('span.second-cate-item')
                if second_category_elem:
                    second_category = {
                        'name': second_category_elem.text.strip(),
                        'third_categories': []
                    }
                    
                    # 提取三级分类
                    third_links = sub_row.select('a.third-cate-item')
                    for third_link in third_links:
                        # 跳过"更多"按钮
                        if "更多" in third_link.text.strip():
                            continue
                            
                        third_category = {
                            'name': third_link.text.strip(),
                            'url': third_link.get('href')
                        }
                        second_category['third_categories'].append(third_category)
                    
                    # 只添加有三级分类的二级分类
                    if second_category['third_categories']:
                        category['subcategories'].append(second_category)
            
            print(f"  成功获取 '{category['name']}' 分类的子分类，找到 {len(category['subcategories'])} 个二级分类")
            # 添加随机延迟
            time.sleep(random.uniform(0.5, 1.5))
            
        except Exception as e:
            print(f"  处理 '{category['name']}' 分类时出错: {e}")
    
    # 过滤掉没有子分类的一级分类
    return [category for category in categories if category["name"] != "全部分类"]

def save_simple_json(data, filename="categories_simple.json"):
    """将简化版的分类数据（只有名称）保存为JSON文件"""
    # 创建简化的数据结构
    simple_data = []
    
    for first_cat in data:
        first_category = {
            "name": first_cat["name"],
            "subcategories": []
        }
        
        for second_cat in first_cat.get("subcategories", []):
            second_category = {
                "name": second_cat["name"],
                "third_categories": []
            }
            
            for third_cat in second_cat.get("third_categories", []):
                second_category["third_categories"].append({
                    "name": third_cat["name"]
                })
            
            first_category["subcategories"].append(second_category)
        
        simple_data.append(first_category)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(simple_data, f, ensure_ascii=False, indent=4)
    print(f"简化版数据已保存至 {filename}")
    
    return simple_data

def save_to_excel(data, filename="categories.xlsx"):
    """将分类数据保存为Excel表格"""
    # 准备Excel数据
    excel_data = []
    
    for first_cat in data:
        first_name = first_cat["name"]
        
        # 如果没有二级和三级分类，添加一行只有一级分类
        if not first_cat.get("subcategories", []):
            excel_data.append([first_name, "", ""])
            continue
        
        for second_cat in first_cat.get("subcategories", []):
            second_name = second_cat["name"]
            
            # 如果没有三级分类，添加一行只有一级和二级分类
            if not second_cat.get("third_categories", []):
                excel_data.append([first_name, second_name, ""])
                continue
                
            for third_cat in second_cat.get("third_categories", []):
                third_name = third_cat["name"]
                excel_data.append([first_name, second_name, third_name])
    
    # 创建DataFrame
    df = pd.DataFrame(excel_data, columns=["一级分类", "二级分类", "三级分类"])
    
    # 保存为Excel
    df.to_excel(filename, index=False)
    print(f"Excel表格已保存至 {filename}")

if __name__ == "__main__":
    print("开始爬取惠农网分类数据...")
    
    # 优先使用不需要Selenium的方法
    try:
        print("使用直接请求方法获取分类数据...")
        categories = get_specific_categories()
    except Exception as e:
        print(f"直接请求方法失败: {e}")
        print("尝试使用Selenium方法...")
        try:
            categories = get_all_categories_with_selenium()
        except Exception as e:
            print(f"Selenium方法也失败: {e}")
            categories = None
    
    if categories:
        # 统计分类数量
        count = count_categories(categories)
        print(f"\n共获取到 {count['first_level']} 个一级分类，{count['second_level']} 个二级分类，{count['third_level']} 个三级分类")
        print(f"分类总数: {count['total']}")
        
        # 保存为完整JSON
        save_to_json(categories)
        
        # 保存为简化版JSON（只有名称）
        simple_data = save_simple_json(categories)
        
        # 保存为Excel表格
        save_to_excel(simple_data)
        
        # 打印部分结果
        print("\n--- 分类结构预览 ---")
        for first_cat in categories[:3]:  # 只显示前3个一级分类
            print(f"一级分类: {first_cat['name']}")
            
            if 'subcategories' in first_cat and first_cat['subcategories']:
                for second_cat in first_cat['subcategories'][:2]:  # 只显示前2个二级分类
                    print(f"  二级分类: {second_cat['name']}")
                    
                    for third_cat in second_cat['third_categories'][:3]:  # 只显示前3个三级分类
                        print(f"    三级分类: {third_cat['name']}")
            else:
                print("  暂无二级分类")
    else:
        print("获取分类数据失败")
