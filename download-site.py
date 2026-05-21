import os
import time
import urllib.request
from urllib.parse import urljoin

# 要下载的网站
base_url = "https://tests-1101.pages.dev"

# 创建目录
download_dir = os.path.join(os.path.dirname(__file__), "downloaded-site")
os.makedirs(download_dir, exist_ok=True)

# 要下载的文件列表
files_to_download = [
    "/",
    "/index.html",
    "/admin.html",
    "/upload.html",
    "/styles.css",
    "/script.js",
    "/README.md",
    "/tests/test_list.json",
    "/tests/test1.json",
    "/tests/test2.json",
    "/tests/test_zc1.json",
    "/tests/robot_level1-2_sim1.json",
    "/tests/robot_level1-2_sim2.json",
    "/tests/robot_level1-2_sim3.json",
    "/tests/robot_level1-2_sim4.json",
    "/tests/robot_level1-2_sim5.json",
]

def download_file(url, filepath):
    """下载单个文件"""
    try:
        print("正在下载:", url)
        
        # 创建目录（如果需要）
        dir_path = os.path.dirname(filepath)
        os.makedirs(dir_path, exist_ok=True)
        
        # 模拟浏览器请求
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        request = urllib.request.Request(url, headers=headers)
        
        # 下载文件
        with urllib.request.urlopen(request) as response:
            content = response.read()
            with open(filepath, 'wb') as f:
                f.write(content)
        
        print("成功保存:", filepath)
        return True
        
    except Exception as e:
        print("下载失败:", url)
        print("   错误:", str(e))
        return False

def main():
    print("开始下载网站:", base_url)
    print("目标目录:", download_dir)
    print("=" * 60)
    
    success_count = 0
    for file_path in files_to_download:
        url = urljoin(base_url, file_path)
        
        # 处理根路径
        if file_path == "/":
            local_path = os.path.join(download_dir, "index.html")
        else:
            local_path = os.path.join(download_dir, file_path.lstrip("/"))
        
        if download_file(url, local_path):
            success_count += 1
        
        # 稍微延迟避免请求过快
        time.sleep(0.3)
    
    print("\n" + "=" * 60)
    print("下载完成！")
    print("成功:", success_count, "/", len(files_to_download), "个文件")
    print("文件保存在:", download_dir)

if __name__ == "__main__":
    main()
