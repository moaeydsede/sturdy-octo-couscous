# SweetLab PRO Menu (GitHub Pages)

## الملفات
- index.html
- styles.css
- app.js
- products.json
- manifest.json
- sw.js
- favicon.svg
- icon-192.png
- icon-512.png

## مميزات النسخة PRO
- تصميم PRO موبايل 100% (Bottom Bar)
- بحث Overlay + فلاتر (عروض / جديد / الأكثر طلباً)
- مختارات اليوم (Carousel)
- صفحة تفاصيل المنتج (Bottom Sheet) + تحديد كمية
- سلة Drawer احترافية + استلام/توصيل + رسوم توصيل
- رسالة واتساب مرتبة (اسم/هاتف/عنوان/ملاحظة)
- PWA + Offline Cache

## تعديل رقم واتساب
داخل app.js:
WHATSAPP_NUMBER = "201155590838"
بدون علامة +

## رفع على GitHub Pages (من الموبايل)
1) GitHub > New repository
2) Upload files: ارفع كل الملفات (بدون مجلدات)
3) Settings > Pages
4) Deploy from a branch
5) Branch: main / root
6) افتح الرابط

## تعديل المنتجات
افتح products.json وعدّل:
name, price, category, desc, image, tags
tags: ["offer"] أو ["new"] أو ["popular"]
