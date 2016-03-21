#!/usr/bin/env python
# coding=utf-8
import numpy as np
import cv2
import sys
import urllib
import urllib2
from PIL import Image
import pytesseract
import re

jsession = sys.argv[1];
url = 'http://uems.sysu.edu.cn/elect/login/code'
values = {}
headers = { 'Cookie' : 'JSESSIONID=' + jsession } # 设置cookie
data = urllib.urlencode(values)

request = urllib2.Request(url, data, headers)
response = urllib2.urlopen(request) # 获得验证码图片

image = np.asarray(bytearray(response.read()), dtype='uint8')
img = cv2.imdecode(image, cv2.IMREAD_GRAYSCALE) # 转换为灰度图
adaptive = img[1:-2, 1:-2] # 裁剪掉边缘
adaptive = cv2.adaptiveThreshold(adaptive, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 40)   # 自适应二值化
adaptive = cv2.resize(adaptive, (0,0), fx=4, fy=4) # 将图片放大4倍，方便降噪和识别
adaptive = cv2.medianBlur(adaptive, 9) # 模糊降噪

im = Image.fromarray(adaptive)
verify = pytesseract.image_to_string(im, lang='checkcode') # 使用tesseract识别

result = re.sub(r'[^A-Z]', '', verify) # 将非字母去除
print result