#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
惠农网滑动验证码处理模块
"""

import time
import random
import re
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException

logger = logging.getLogger("验证码处理")

def is_captcha_present(html_content):
    """检查HTML内容中是否存在验证码"""
    # 检查是否包含验证码的div
    if '<div id="verify"' in html_content and 'verify-img-canvas' in html_content:
        logger.warning("检测到滑动验证码")
        return True
    return False

def is_captcha_present_selenium(driver):
    """使用Selenium检查页面中是否存在验证码"""
    try:
        captcha_elem = driver.find_element(By.ID, "verify")
        if captcha_elem.is_displayed():
            logger.warning("检测到滑动验证码")
            return True
    except NoSuchElementException:
        pass
    return False

def solve_captcha_selenium(driver, max_attempts=3):
    """
    使用Selenium解决滑动验证码
    
    参数:
    driver: Selenium WebDriver对象
    max_attempts: 最大尝试次数
    
    返回:
    bool: 是否成功解决验证码
    """
    for attempt in range(max_attempts):
        try:
            logger.info(f"尝试解决验证码，第 {attempt + 1} 次")
            
            # 等待验证码加载
            wait = WebDriverWait(driver, 10)
            slider = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "verify-move-block")))
            
            # 获取滑块和图片信息
            slider_container = driver.find_element(By.CLASS_NAME, "verify-bar-area")
            canvas = driver.find_element(By.CLASS_NAME, "verify-img-canvas")
            sub_block = driver.find_element(By.CLASS_NAME, "verify-sub-block")
            
            # 获取滑块位置
            sub_block_left = sub_block.get_attribute("style")
            match = re.search(r'left: (\d+)px', sub_block_left)
            if match:
                distance = int(match.group(1)) + 10  # 加一点偏移量
            else:
                # 如果无法获取精确位置，使用基于图片宽度的估计
                canvas_width = canvas.size['width']
                distance = random.randint(int(canvas_width * 0.4), int(canvas_width * 0.6))
            
            # 创建动作链
            actions = ActionChains(driver)
            actions.click_and_hold(slider).perform()
            
            # 使用人类模拟的移动方式：快速开始，中间减速，接近目标时慢速
            segments = 10
            segment_distance = distance / segments
            current_distance = 0
            
            # 第一阶段：加速
            for i in range(3):
                current_distance += segment_distance * 0.8  # 略小于平均速度
                actions.move_by_offset(segment_distance * 0.8, 0).perform()
                time.sleep(random.uniform(0.01, 0.03))
            
            # 第二阶段：匀速
            for i in range(4):
                current_distance += segment_distance
                actions.move_by_offset(segment_distance, 0).perform()
                time.sleep(random.uniform(0.03, 0.08))
            
            # 第三阶段：减速
            for i in range(3):
                remaining = distance - current_distance
                move = remaining / (3 - i)
                current_distance += move
                actions.move_by_offset(move, 0).perform()
                time.sleep(random.uniform(0.05, 0.1))
            
            # 释放滑块
            actions.release().perform()
            
            # 等待验证结果
            time.sleep(2)
            
            # 检查验证是否成功（验证码消失）
            if not is_captcha_present_selenium(driver):
                logger.info("验证码已成功解决")
                return True
            
            logger.info("验证码未解决，将重试")
            # 刷新验证码，准备下一次尝试
            refresh_button = driver.find_element(By.CLASS_NAME, "verify-refresh")
            refresh_button.click()
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"解决验证码时出错: {str(e)}")
        
        # 在重试前随机延迟
        time.sleep(random.uniform(1, 2))
    
    logger.error(f"在 {max_attempts} 次尝试后未能解决验证码")
    return False

def random_sleep(min_seconds=3, max_seconds=8):
    """随机睡眠，避免请求过快"""
    sleep_time = random.uniform(min_seconds, max_seconds)
    time.sleep(sleep_time)
    return sleep_time

def get_proxy():
    """获取代理IP（示例函数，实际使用时需替换为真实的代理获取逻辑）"""
    # 这里应该实现获取代理IP的逻辑
    # 例如，从代理服务商API获取，或从代理池获取
    # 以下为示例代码，实际使用时需替换
    proxies = [
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        # 添加更多代理IP
    ]
    return random.choice(proxies)

def reduce_request_frequency(min_delay=5, max_delay=15):
    """降低请求频率的装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 随机延迟
            delay = random.uniform(min_delay, max_delay)
            logger.info(f"降低请求频率，延迟 {delay:.2f} 秒")
            time.sleep(delay)
            return func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # 测试验证码检测
    html_example = '''
    <body>
        <div id="verify" data-md5="U2FsdGVkX1/K9S15pjdE0FVlqEl0wtvSSLWG4y+OvcK0ih71ArHX5beE8FoD0lLn" style="position: relative;">
            <div class="verify-img-out" style="position: relative; height: 205px;">
                <div class="verify-img-panel" style="width: 400px; height: 200px;">
                    <div class="verify-refresh" style="z-index:3"><i class="iconfont icon-refresh"></i></div>
                    <canvas class="verify-img-canvas" width="400px" height="200px"></canvas>
                </div>
            </div>
            <canvas class="verify-sub-block" width="58" height="58" style="left: 0px; position: absolute; top: 57.3333px;"></canvas>
            <div class="verify-bar-area" style="width: 400px; height: 40px; line-height: 40px;">
                <span class="verify-msg">向右滑动完成验证</span>
                <div class="verify-left-bar" style="width: 40px; height: 40px; border-color: rgb(221, 221, 221);">
                    <span class="verify-msg" style="color: rgb(0, 0, 0);"></span>
                    <div class="verify-move-block" style="width: 40px; height: 40px; left: 0px; background-color: rgb(255, 255, 255);">
                        <i class="verify-icon iconfont icon-right" style="color: rgb(0, 0, 0);"></i>
                    </div>
                </div>
            </div>
        </div>
    </body>
    '''
    
    print(f"检测到验证码: {is_captcha_present(html_example)}") 