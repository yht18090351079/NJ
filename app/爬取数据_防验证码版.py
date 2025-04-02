#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
惠农网爬虫示例（防验证码版本）
该脚本演示如何使用增强的反验证码功能爬取惠农网价格数据
"""

import argparse
import logging
from datetime import datetime
import time
from 惠农网行情爬虫_combined import (
    scrape_with_selenium, scrape_with_requests,
    save_to_excel, save_to_json, analyze_data
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("anti_captcha_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("防验证码爬虫")

def main():
    parser = argparse.ArgumentParser(description="惠农网防验证码爬虫示例")
    parser.add_argument("--category", type=str, default="水果", help="要爬取的分类，默认为水果")
    parser.add_argument("--selenium", action="store_true", help="使用Selenium爬取（默认使用requests）")
    parser.add_argument("--pages", type=int, default=3, help="每个地区最多爬取的页数（默认3页）")
    parser.add_argument("--delay", type=float, default=2.0, help="延迟因子，增加请求间隔（默认2.0）")
    parser.add_argument("--headless", action="store_true", help="使用无头模式（默认不使用，显示浏览器界面）")
    args = parser.parse_args()
    
    logger.info("启动惠农网防验证码爬虫...")
    
    # 定义要爬取的分类（默认为水果）
    categories = {
        "水果": "https://www.cnhnb.com/hangqing/sgzw/",
        "蔬菜": "https://www.cnhnb.com/hangqing/sczw/",
        "禽畜肉蛋": "https://www.cnhnb.com/hangqing/qcrd/",
        "水产": "https://www.cnhnb.com/hangqing/shuic/"
    }
    
    if args.category not in categories:
        logger.error(f"不支持的分类: {args.category}，支持的分类有: {list(categories.keys())}")
        return
    
    category = {
        "name": args.category,
        "url": categories[args.category]
    }
    
    # 定义几个主要地区（为减少请求量，只选择少量地区）
    regions = [
        # {"name": "不限", "url": categories[args.category]},  # 注释掉"不限"地区
        {"name": "河北", "url": f"https://www.cnhnb.com/hangqing/cdlist-2003191-0-3-0-0-1/"},
        {"name": "山东", "url": f"https://www.cnhnb.com/hangqing/cdlist-2003191-0-15-0-0-1/"},
        {"name": "广东", "url": f"https://www.cnhnb.com/hangqing/cdlist-2003191-0-19-0-0-1/"}
    ]
    
    # 保存所有数据
    all_data = []
    
    # 使用随机延迟减少被检测风险
    from captcha_handler import random_sleep
    
    # 爬取每个地区的数据
    for region in regions:
        # 跳过"不限"地区
        if region["name"] == "不限":
            logger.info(f"跳过'不限'地区的数据爬取")
            continue
            
        logger.info(f"开始爬取 {args.category} 分类下的 {region['name']} 地区数据...")
        
        try:
            # 添加较长延迟，避免触发验证码
            random_sleep(10 * args.delay, 15 * args.delay)
            
            # 根据参数选择爬取方式
            if args.selenium:
                # 使用Selenium模式（更能应对验证码）
                logger.info("使用Selenium模式爬取（更能应对验证码但速度较慢）")
                if not args.headless:
                    logger.info("使用有界面模式，请勿关闭浏览器窗口")
                data = scrape_with_selenium(
                    category, 
                    region, 
                    max_pages=args.pages,
                    max_captcha_retries=5,  # 增加重试次数
                    headless=args.headless  # 使用有界面模式
                )
            else:
                # 使用requests模式（速度更快）
                logger.info("使用requests模式爬取（速度更快但可能更容易触发验证码）")
                data = scrape_with_requests(
                    category, 
                    region, 
                    max_pages=args.pages,
                    max_captcha_retries=3,
                    use_proxy=False,  # 如果有可靠的代理，可以设为True
                    headless=args.headless  # 使用有界面模式处理验证码
                )
            
            # 累计数据
            all_data.extend(data)
            logger.info(f"已获取 {region['name']} 地区的 {len(data)} 条数据")
            
            # 每个地区爬取后保存一次，避免数据丢失
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            temp_file = f"{args.category}_{region['name']}_{timestamp}.json"
            save_to_json(data, temp_file)
            logger.info(f"已保存临时数据至: {temp_file}")
            
        except Exception as e:
            logger.error(f"爬取 {region['name']} 时出错: {str(e)}")
        
        # 不同地区之间添加长随机延迟，降低被封风险
        sleep_time = random_sleep(20 * args.delay, 30 * args.delay)
        logger.info(f"为降低被封风险，延迟 {sleep_time:.2f} 秒后继续")
    
    # 如果成功获取了数据，则保存并分析
    if all_data:
        # 生成带时间戳的文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        excel_file = f"{args.category}_价格数据_{timestamp}.xlsx"
        json_file = f"{args.category}_价格数据_{timestamp}.json"
        
        # 保存为Excel和JSON
        save_to_excel(all_data, excel_file)
        save_to_json(all_data, json_file)
        logger.info(f"共获取 {len(all_data)} 条数据，已保存至:\n{excel_file}\n{json_file}")
        
        # 分析数据
        analysis = analyze_data(all_data)
        
        # 输出分析结果
        if analysis:
            # 保存分析结果
            analysis_file = f"{args.category}_数据分析_{timestamp}.json"
            with open(analysis_file, 'w', encoding='utf-8') as f:
                import json
                json.dump(analysis, f, ensure_ascii=False, indent=4)
            
            # 打印一些基本信息
            logger.info("\n--- 数据分析摘要 ---")
            logger.info(f"总数据量: {analysis['total_records']} 条")
            logger.info(f"产品种类: {analysis['unique_products']} 种")
            logger.info(f"产地数量: {analysis['unique_places']} 个")
            
            # 打印价格最高的几种产品
            logger.info("\n价格最高的5种产品:")
            for i, product in enumerate(analysis["top_expensive_products"][:5]):
                logger.info(f"  {i+1}. {product['产品']}: {product['mean']:.2f}元/斤 (样本数: {product['count']})")
    else:
        logger.error("未能获取任何数据")

if __name__ == "__main__":
    start_time = time.time()
    main()
    elapsed = time.time() - start_time
    logger.info(f"爬虫运行完成，总耗时: {elapsed:.2f} 秒") 