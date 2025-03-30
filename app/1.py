import os
import requests

# 图片URL字典
image_urls = {
    "images/logo/logo-main.png": "https://i.imgur.com/x7CL6Wd.png",
    "images/logo/logo-large.png": "https://i.imgur.com/EO33s5r.png",
    "images/banners/banner-seasonal-fruits.jpg": "https://i.imgur.com/CxVyTg4.jpg",
    "images/banners/banner-organic-vegetables.jpg": "https://i.imgur.com/StWXuxV.jpg",
    "images/banners/banner-farmers-program.jpg": "https://i.imgur.com/4oO5RYT.jpg",
    "images/products/fruits/strawberry.jpg": "https://i.imgur.com/f7PVZjv.jpg",
    "images/products/fruits/apple.jpg": "https://i.imgur.com/Rt5MaIZ.jpg",
    "images/products/fruits/banana.jpg": "https://i.imgur.com/zSmwRDI.jpg",
    "images/products/fruits/grape.jpg": "https://i.imgur.com/Jtsvp1S.jpg",
    "images/products/fruits/orange.jpg": "https://i.imgur.com/sSVq997.jpg",
    "images/products/vegetables/tomato.jpg": "https://i.imgur.com/fpxfh9w.jpg",
    "images/products/vegetables/potato.jpg": "https://i.imgur.com/bO4Ea55.jpg",
    "images/products/vegetables/carrot.jpg": "https://i.imgur.com/TRptGQ8.jpg",
    "images/products/vegetables/cabbage.jpg": "https://i.imgur.com/OPSz0iK.jpg",
    "images/products/vegetables/cucumber.jpg": "https://i.imgur.com/0G8sNXK.jpg",
    "images/products/grains/corn.jpg": "https://i.imgur.com/0nqqj64.jpg",
    "images/products/grains/rice.jpg": "https://i.imgur.com/l0wYwAr.jpg",
    "images/products/grains/wheat.jpg": "https://i.imgur.com/0xm22jr.jpg",
    "images/users/farmer-profile.jpg": "https://i.imgur.com/xyVQPjt.jpg",
    "images/users/company-1.jpg": "https://i.imgur.com/UqmV5Nn.jpg",
    "images/users/company-2.jpg": "https://i.imgur.com/xj4rXoJ.jpg",
    "images/users/company-3.jpg": "https://i.imgur.com/wUCgqVZ.jpg"
}

# 下载图片
base_dir = "farm-market-platform"
for local_path, url in image_urls.items():
    # 创建目录
    full_path = os.path.join(base_dir, local_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # 下载图片
    response = requests.get(url)
    if response.status_code == 200:
        with open(full_path, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded: {local_path}")
    else:
        print(f"Failed to download: {url}")

print("All images downloaded!")